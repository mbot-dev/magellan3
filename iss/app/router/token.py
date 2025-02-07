import os
import json
import jwt
from pathlib import Path
import httpx
from starlette.responses import JSONResponse
from starlette.templating import Jinja2Templates
from starlette.exceptions import HTTPException
from starlette.background import BackgroundTask

from ..worker.iss import issue, verify, verify_access_token, bearer_token, magic_claim, refresh_token_claim, invite_claim, access_token_claim
from ..worker import db_redis, courier, pusher_cl
from ..util.tracer import get_logger, pretty_dumps
from .custome_exception import ConsumedLink, NoRefreshToken

# Template dir
BASE_PATH = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_PATH / "templates"))

# Background Tsk Gmail sender
def send_magic(receiver, subject, title, job, link):
    courier.send_signup_link(receiver, subject, title, job, link)

def path_to_account_url(path):
    acc_server = os.getenv('INTERNAL_BRIDGE')  # on the same docker
    return f'{acc_server}{path}'

async def send_signup_link(request):
    """
    アカウント作成およびログイン
    Phase 1
    メールアドレスが本人のものかどうかを確認するためリンクを送信する
    サインアップを拒否するケース
    1. sub（Email）アカウントが存在している
    ログインを拒否するケース
    2. sub（Email）アカウントが存在しない
    """
    payload = await request.json()
    get_logger(__name__).debug(pretty_dumps(payload))
    
    sub = payload.get('sub')  # E-mail address
    mode = payload.get('mode')  # 'signup' or 'login'
    sign_up_ = mode == 'sign_up'
    login_ = mode == 'login'
    
    # Serach if the user exists on the server
    path = '/stream/api/v1/accept/account'
    url = path_to_account_url(path)
    req_data = {'sub': sub}
    async with httpx.AsyncClient() as client:
        res = await client.post(url, data=req_data)
        if res.status_code != 200:
            get_logger(__name__).warning(f'{res.status_code}')
            raise HTTPException(status_code=res.status_code, detail='unexpected')

    # Check response    
    data = res.json()
    exists_ = data.get('account_exist')
    get_logger(__name__).info(f'account exists = {exists_}')

    # case 1 sigup and account exists
    if sign_up_ and exists_:
        raise HTTPException(status_code=409, detail='conflict')

    # case 2 login and no account
    if login_ and not exists_:
        raise HTTPException(status_code=401, detail='unauthorized')
    
    # Create jwt for mail link 
    expires_in = int(os.getenv('LINK_EXPIRES_IN'))
    claim = magic_claim(sub, expires_in)  # {sub, jti, aud, iss, iat, exp} + nonce as pusher channel
    token = issue(claim)

    # Save the claim to redis
    if sign_up_:
        # Raise exception if the user already exists
        db_redis.save_signup_link(sub, claim, expires_in)  # key=sub, value=json.dumps(claim)
    else:
        # Allow multiple login requsets
        db_redis.save_login_link(claim.get('jti'), claim, expires_in) # key=jti, value=json.dumps(claim)

    # Create verfication link
    callback = os.getenv('VERIFY_SIGNUP_LINK') # callback url
    link = f'{callback}?token={token}&mode=sign_up' if sign_up_ else f'{callback}?token={token}&mode=login'  # verification link

    # Send user signup link via gmail
    suffix = 'SIGNUP' if sign_up_ else 'LOGIN'
    mail_subject = os.getenv(f'MAIL_SUBJECT_{suffix}')
    mail_title = os.getenv(f'MAIL_TITLE_{suffix}')
    job = os.getenv(f'MAIL_JOB_{suffix}')
    task = BackgroundTask(send_magic, sub, mail_subject, mail_title, job, link)

    # Set cookie refresh token-------------------------------------------------------------------------------------------
    response = JSONResponse({'username': sub, 'channel': claim.get('nonce')}, background=task)
    response.delete_cookie(key=os.getenv('REFRESH_TOKEN_COOKIE'))
    refresh_claim = refresh_token_claim(sub)  # Issue refresh token with sub
    refresh_tkn = issue(refresh_claim)
    response.set_cookie(key=os.getenv('REFRESH_TOKEN_COOKIE'), value=json.dumps(refresh_tkn), httponly=True, max_age=int(os.getenv('COOKIE_MAX_AGE')))   # 100 days
    get_logger(__name__).debug('cookie has set refresh token in send_magic_link')
    #-------------------------------------------------------------------------------------------------------------------
    # Return nonce , client subscribe to nonce channel to receive access token
    return response

async def verify_signup_link(request):
    """
    Phase 2
    ユーザーがリンクをタップするとここへcallbackされる
    メール認証が成功すると html template 表示
    """
    params = [request.query_params.get(key) for key in ['token', 'mode']]
    token = params[0]
    sign_up_ = params[1] == 'sign_up'
    login_ = params[1] == 'login'

    try:
        payload = verify(token, os.getenv('ISS'), os.getenv('AUD'))    
        get_logger(__name__).info(pretty_dumps(payload))
        
        if sign_up_:
            db_redis.consume_link(payload.get('sub'))  # consiume link
        elif login_:
            db_redis.consume_link(payload.get('jti'))   # consume link
        else:
            raise HTTPException(status_code=400, detail='bad-request')

        # Issue access token
        expires_in = int(os.getenv('TOKEN_EXPIRES_IN'))
        claim = access_token_claim(expires_in)
        access_token = issue(claim)
        token = bearer_token(access_token, expires_in)
        get_logger(__name__).debug(token)

        # Send token via pusher
        nonce = payload.get('nonce')  # stored in claim as pusher channel
        channel = f'{nonce}'  # nonce channel
        pusher_cl.send_event(channel, os.getenv('PUSHER_TOKEN_EVENT'), token)

    # Return template html as response
    except jwt.InvalidSignatureError:
        get_logger(__name__).warning('InvalidSignatureError')
        return templates.TemplateResponse("error.html", {"request": request})
    except jwt.exceptions.ExpiredSignatureError:
        get_logger(__name__).warning('ExpiredSignatureError')
        return templates.TemplateResponse("expired.html", {"request": request})
    except jwt.InvalidIssuerError:
        get_logger(__name__).warning('InvalidIssuerError')
        return templates.TemplateResponse("error.html", {"request": request})
    except jwt.InvalidAudienceError:
        get_logger(__name__).warning('InvalidAudienceError')
        return templates.TemplateResponse("error.html", {"request": request})
    except ConsumedLink:
        get_logger(__name__).warning('ConsumedLink')
        return templates.TemplateResponse("expired.html", {"request": request})
    except Exception as ex:
        get_logger(__name__).warning(f'{ex}')
        return templates.TemplateResponse("error.html", {"request": request})
    else:
        # Success
        file_name = 'verified_signup.html' if sign_up_ else 'verified_magic.html'
        return templates.TemplateResponse(file_name, {"request": request})

#------------------------------------------------------------------------
# リフレッシュトークンを使って、リフレッシュトークン自体とアクセストークンを更新する
# リフレッシュトークンはクッキーに保存されている、更新はそれを置き換える
# 新しいアクセストークンをレスポンスする
#------------------------------------------------------------------------
async def refresh_token(request):
    try:
        get_logger(__name__).info('Refresh token requested')
        # Read cookie ---------------------------------------------------
        refresh_tkn = request.cookies.get(os.getenv('REFRESH_TOKEN_COOKIE'))
        get_logger(__name__).debug(f'cookie is {refresh_tkn}')
        if refresh_tkn is None:
            raise NoRefreshToken('no-refresh-token')
        payload = verify_access_token(json.loads(refresh_tkn))
        get_logger(__name__).debug(pretty_dumps(payload))
        # ----------------------------------------------------------------

    except jwt.InvalidSignatureError as ex1:
        get_logger(__name__).warning(f'{ex1}')
        raise HTTPException(status_code=401, detail='unauthorized')
    except jwt.exceptions.ExpiredSignatureError as ex2:
        get_logger(__name__).warning(f'{ex2}')
        raise HTTPException(status_code=401, detail='unauthorized')
    except NoRefreshToken as nrf:
        get_logger(__name__).warning(f'{nrf}')
        raise HTTPException(status_code=401, detail='unauthorized')
    except Exception as ex:
        get_logger(__name__).warning(f'{ex}')
        raise HTTPException(status_code=500, detail='unexpected')
    else:
        # Issue new access token
        sub = payload.get('sub')
        expires_in = int(os.getenv('TOKEN_EXPIRES_IN'))
        claim = access_token_claim(expires_in)
        access_token = issue(claim)

        # Issue new refresh token
        refresh_claim = refresh_token_claim(sub)
        new_refresh_tkn = issue(refresh_claim)
        new_token = bearer_token(access_token, expires_in)
        get_logger(__name__).debug(pretty_dumps(new_token))

        # Set cookie new refresh token ------------------------------------------------
        response = JSONResponse(new_token)
        response.set_cookie(key=os.getenv('REFRESH_TOKEN_COOKIE'), value=json.dumps(new_refresh_tkn), httponly=True, max_age=int(os.getenv('COOKIE_MAX_AGE')))
        get_logger(__name__).debug('cookie has set')
        
        return response

# 院内ユーザー登録
# 登録するユーザーへ招待メールを送る
# 拒否するケース
# case 1 管理者（院内ユーザーを登録できる）アカウントがない
# case 2 医療機関がない
# 招待ユーザーが同じ医療機関に既にいる
async def send_add_user_link(request):
    payload = await request.json()
    get_logger(__name__).info(pretty_dumps(payload))
    # Invite User Information
    # payload = {
    #     invite: {
    #         sub: email,
    #         full_name: full_name,
    #         kana: kana,
    #         license: license,
    #         user_role: role,
    #     },
    #     user: {
    #       id: user.id,
    #       name: user.fullName
    #    },
    #   facility: {
    #       id: facility.id,
    #       name: facility.name
    #   }
    # }
    req_data = dict()
    req_data['user_id'] = payload.get('user').get('id')
    req_data['facility_id'] = payload.get('facility').get('id')
    req_data['sub'] = payload.get('invite').get('sub')
    
    sub = req_data.get('sub')

    path = '/stream/api/v1/accept/user'
    url = path_to_account_url(path)
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=req_data)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail='unexpected')
    
    result = res.json()

    # No account
    if not result.get('user_exists'):  # No owner
        raise HTTPException(status_code=401, detail='unexpected')

    # Invite User already exists
    if result.get('invite_exists'):
        raise HTTPException(status_code=409, detail='conflict')

    # Claim & JWT
    expires_in = int(os.getenv('ADD_USER_EXPIRES_IN'))
    claim = invite_claim(sub, expires_in)  # claim dose not contain full_name etc...
    token = issue(claim)

    # Redis
    payload['jti'] = claim.get('jti')  # key
    db_redis.save_link(payload, expires_in)  # key=jti, value=json.dumps(payload)

    # Create verfication link
    callback = os.getenv('VERYFY_ADD_USER_LINK')
    link = f'{callback}?token={token}&mode=add_user'

    # Send user-add link via gmail
    suffix = 'ADD_USER'
    mail_subject = os.getenv(f'MAIL_SUBJECT_{suffix}')
    mail_title = os.getenv(f'MAIL_TITLE_{suffix}')
    job = os.getenv(f'MAIL_JOB_{suffix}')
    task = BackgroundTask(send_magic, sub, mail_subject, mail_title, job, link)

    response = JSONResponse({'sent': sub}, background=task)

    return response

# 職員登録された人がメールのリンクをタップ
# ユーザーを登録し医療機関に加える
# 院内ユーザーとして登録されたことを redirect
async def verify_add_user_link(request):
    token = request.query_params.get('token')
    mode = request.query_params.get('mode')
    try:
        if mode != 'add_user':
            raise HTTPException(status_code=400, detail='bad-request')
        payload = verify(token, os.getenv('ISS'), os.getenv('AUD'))
        get_logger(__name__).info(pretty_dumps(payload))  # payload=claim of send_invite_link

        invite = db_redis.get_link(payload.get('jti'))  # Retrive invite data
        db_redis.consume_link(payload.get('jti'))

        path = '/stream/api/v1/facility/user'
        url = path_to_account_url(path)
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=invite)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail='unexpected')

    # Return template html as response
    except jwt.InvalidSignatureError:
        get_logger(__name__).warning('InvalidSignatureError')
        return templates.TemplateResponse("error.html", {"request": request})
    except jwt.exceptions.ExpiredSignatureError:
        get_logger(__name__).warning('ExpiredSignatureError')
        return templates.TemplateResponse("expired.html", {"request": request})
    except jwt.InvalidIssuerError:
        get_logger(__name__).warning('InvalidIssuerError')
        return templates.TemplateResponse("error.html", {"request": request})
    except jwt.InvalidAudienceError:
        get_logger(__name__).warning('InvalidAudienceError')
        return templates.TemplateResponse("error.html", {"request": request})
    except ConsumedLink:
        get_logger(__name__).warning('ConsumedLink')
        return templates.TemplateResponse("expired.html", {"request": request})
    except Exception as ex:
        get_logger(__name__).warning(f'{ex}')
        return templates.TemplateResponse("error.html", {"request": request})
    else:
        # Success Welcome
        return templates.TemplateResponse("welcome.html", {"request": request})
    
async def issue_white_token(request):
    payload = await request.json()
    get_logger(__name__).info(pretty_dumps(payload))
    try:
        # Read cookie ---------------------------------------------------
        refresh_tkn = request.cookies.get(os.getenv('REFRESH_TOKEN_COOKIE'))
        get_logger(__name__).debug(f'cookie is {refresh_tkn}')
        if refresh_tkn is None:
            raise NoRefreshToken('no-refresh-token')
        refresh_payload = verify_access_token(json.loads(refresh_tkn))
        get_logger(__name__).debug(pretty_dumps(payload))
        # ----------------------------------------------------------------

        # sub in self_hosting_server=account server
        sub = refresh_payload.get('sub')  # sub in refresh payload = username ie. email address

        # Check if the user exists and has facilities
        path = '/stream/api/v1/accept/account'
        url = path_to_account_url(path)
        req_data = {'sub': sub}
        async with httpx.AsyncClient() as client:
            res = await client.post(url, data=req_data)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail='unexpected')

        data = res.json()
        exists_ = data.get('account_exist')
        num_facilities_ = data.get('num_facilities')
        get_logger(__name__).debug(f'exists_= {exists_}')
        get_logger(__name__).debug(f'num_facilities_= {num_facilities_}')
        if not exists_:
            raise HTTPException(status_code=401, detail='unauthorized')

        expires_in = int(os.getenv('WHITE_TOKEN_EXPIRES_IN'))
        claim = access_token_claim(expires_in)
        access_token = issue(claim)

        new_token = bearer_token(access_token, expires_in)
        get_logger(__name__).debug(pretty_dumps(new_token))

    except jwt.InvalidSignatureError as ex1:
        get_logger(__name__).warning(f'{ex1}')
        raise HTTPException(status_code=401, detail='unauthorized')
    except jwt.exceptions.ExpiredSignatureError as ex2:
        get_logger(__name__).warning(f'{ex2}')
        raise HTTPException(status_code=401, detail='unauthorized')
    except HTTPException as hex:
        raise ex
    except Exception as ex:
        get_logger(__name__).warning(f'{ex}')
        raise HTTPException(status_code=500, detail='unexpected')
    else:
        # Send back
        response = JSONResponse(new_token)
        return response
