import os
import time
import secrets
import jwt
from pathlib import Path
import shortuuid


def read_public(public_pem):
    file = open(public_pem, 'rb')
    key = file.read()
    file.close()

    def _inner():
        return key
    return _inner


def read_private(private_pem):
    file = open(private_pem, 'rb')
    key = file.read()
    file.close()

    def _inner():
        return key
    return _inner


ALGORITHM = os.getenv('ALGORITHM')
EC_PARAM = os.getenv('EC_PARAM')
BASE_PATH = Path(__file__).resolve().parent.parent
keys = str(BASE_PATH / "keys")
PRIVATE_FILE = f'{keys}/private_{EC_PARAM}.pem'  # path: from project top dir
PUBLIC_FILE = f'{keys}/public_{EC_PARAM}.pem'  # path: from project top dir

PRIVATE_KEY = read_private(PRIVATE_FILE)
PUBLIC_KEY = read_public(PUBLIC_FILE)


def issue(claim):
    return jwt.encode(claim, PRIVATE_KEY(), algorithm=ALGORITHM)    # .decode('UTF-8')


def verify(token, iss, aud):
    return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM], issuer=iss, audience=aud)


def verify_access_token(token):
    return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM])


def magic_claim(sub, expires_in):
    now = int(time.time())
    claim = {
        'sub': sub,
        'jti': shortuuid.uuid(),
        'iss': os.getenv('ISS'),
        'aud': os.getenv('AUD'),
        'iat': now,
        'exp': now + expires_in,
        'nonce': secrets.token_urlsafe()
    }
    return claim


def invite_claim(sub, expires_in):
    now = int(time.time())
    claim = {
        'sub': sub,
        'jti': shortuuid.uuid(),
        'iss': os.getenv('ISS'),
        'aud': os.getenv('AUD'),
        'iat': now,
        'exp': now + expires_in
    }
    return claim


def magic_change_name_claim(sub, new_sub, expires_in):
    now = int(time.time())
    claim = {
        'sub': sub,
        'new_sub': new_sub,
        'jti': shortuuid.uuid(),
        'iss': os.getenv('ISS'),
        'aud': os.getenv('AUD'),
        'iat': now,
        'exp': now + expires_in
    }
    return claim


def access_token_claim(expires_in):
    claim = {
        'jti': shortuuid.uuid(),
        'exp': int(time.time()) + expires_in
    }
    return claim


def refresh_token_claim(sub):
    claim = {
        'sub': sub,
        'exp': int(time.time()) + int(os.getenv('REFRESH_EXPIRES_IN')),
        'nonce': secrets.token_urlsafe()
    }
    return claim


def bearer_token(access_token, expires_in):
    token = {
        'access_token': access_token,
        'expires_in': expires_in,
        'token_type': 'bearer'
    }
    return token


def express_token(access_token, facility_id, expires_in):
    token = {
        'access_token': access_token,
        'expires_in': expires_in,
        'token_type': 'bearer',
        'facility_id': facility_id
    }
    return token


