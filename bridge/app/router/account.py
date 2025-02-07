import uuid
from datetime import datetime
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse
import simplejson as json
from ..db.database import add_quote, insert, update_by_id, now_as_str
from ..util.tracer import get_logger

def user_ql_1(status, username):
    return f"""
        select row_to_json(a) as user from (
            select u.id,
            (select json_agg(f.id) from m_facility f join users_facilities assoc on assoc.facility_id = f.id where assoc.user_id = u.id and assoc.status = {status}) as facilities
            from m_user u where u.username = {username}
        ) a
    """

def user_ql_2(status, username):
    return f"""
        select row_to_json(a) as user from (
            select u.*,
            (select row_to_json(s.*) from m_user_settings s where s.id = u.id) as settings,
            (select json_agg(f.*) from m_facility f join users_facilities assoc on assoc.facility_id = f.id where assoc.user_id = u.id and assoc.status = {status}) as facilities
            from m_user u where u.username = {username}
        ) a
    """

def fc_ql(status, facility_id):
    return f"""
        select row_to_json(a) as facility from (
            select f.*,
            (select json_agg(u.*) from m_user u join users_facilities uf on uf.user_id = u.id where uf.facility_id = f.id and uf.status = {status}) as users
            from m_facility f where f.id = {facility_id}
        ) a
    """

def licence_ql(facility_id, license):
    return f"""
        select row_to_json(u.*) as user from m_user u join users_facilities uf on u.id = uf.user_id where uf.facility_id = {facility_id} and u.license = {license}
    """

def dept_ql(facility_id):
    return f"""
        select row_to_json(d.*) as dept from m_department d where d.facility_id = {facility_id} order by d.code
    """

#----------------------------------------------------------------
def get_pool(app):
    return app.state.magellan_pool

#---------------------------------------------------
# Accountr作成が可能かどうかの確認  iss -> stream
#---------------------------------------------------
async def stream_accept_account(request):
    pool = get_pool(request.app)
    form = await request.form()
    sub = form.get('sub')
    async with pool().acquire() as conn:
        sql = user_ql_1(add_quote('active'), add_quote(sub))
        row = await conn.fetchrow(sql)
        return JSONResponse({'account_exist': True if row else False})

#---------------------------------------------------
# User 追加が可能かどうかの確認 iss -> stream
#---------------------------------------------------
async def stream_accept_add_user(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        ret = dict()
        user_id, facility_id, sub = [payload.get(key) for key in ['user_id', 'facility_id', 'sub']]

        sql = 'select count(1) from users_facilities where user_id = $1 and facility_id = $2'
        cnt = await conn.fetchval(sql, user_id, facility_id)
        ret['user_exists'] = bool(cnt)  # owner exists or not

        sql = f'select id from m_user where username = $1'
        id_ = await conn.fetchval(sql, sub)  # sub exists or not

        if not id_:
            ret['invite_exists'] = False  # Not sub exists
        else:
            sql = 'select count(1) from users_facilities where user_id = $1 and facility_id = $2'
            cnt = await conn.fetchval(sql, id_, facility_id)
            ret['invite_exists'] = bool(cnt)  # Association exists or not
            
        return JSONResponse(ret)

#---------------------------------------------------
# User を Facility に追加する   iss -> user click -> stream
#---------------------------------------------------
async def stream_add_user(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            now = now_as_str()
            new_user = payload.get('invite')
            new_user['id'] = new_user.get('id', str(uuid.uuid4()))
            new_user['username'] = new_user.get('sub')
            new_user['created_at'] = now
            new_user['updated_at'] = now
            await insert(conn, 'm_user', new_user)
            assoc = {
                'user_id': new_user.get('id'),
                'facility_id': payload.get('facility').get('id'),
                'user_role': 'user',
                'status': 'active',
                'created_at': now,
                'updated_at': now
            }
            await insert(conn, 'users_facilities', assoc)
            return JSONResponse({'count': 1})
    
#---------------------------------------------------
# User のログインして名を変更する  iss -> stream
#---------------------------------------------------
async def stream_change_username(request):
    pass

#---------------------------------------------------
# Omline 診療が可能かどうかの確認 iss -> stream
#---------------------------------------------------
async def stream_accept_call(request):
    # pool = get_pool(request.app)
    # form = await request.form()
    # params = [form.get(name) for name in ['user_id', 'facility_id']]
    # result = await db_account.accept_call(pool, *params)
    # return JSONResponse(result)
    pass

#----------------------------------------------------------------
# DB に新規Account を作成する
#----------------------------------------------------------------
async def sign_up(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            signup_user = payload.get('user')
            username = signup_user.get('username')  # sub=email
            facility = payload.get('facility')
            depts = payload.get('depts')
            # Check if username already exists
            sql = 'select username from m_user where username = $1'
            exist = await conn.fetchval(sql, username)
            if exist:
                raise HTTPException(status_code=409, detail=f'{username} already exists')
            # Set ID and relations
            signup_user['id'] = str(uuid.uuid4())
            facility['id'] = str(uuid.uuid4())
            for d in depts:
                d['id'] = str(uuid.uuid4())
                d['facility_id'] = facility.get('id')
            signup_user['created_at'] = now_as_str()  # %z = +0900
            signup_user['updated_at'] = signup_user.get('created_at')
            signup_user['status'] = 'testing'  # ToDo
            facility['created_at'] = signup_user.get('created_at')
            facility['updated_at'] = facility.get('created_at')
            facility['owner'] = signup_user.get('id')
            facility['status'] = 'active'
            # Set Association
            assoc = {
                'user_id': signup_user.get('id'), 
                'facility_id': facility.get('id'),
                'user_role': 'admin',
                'status': 'active',
                'created_at': signup_user.get('created_at'),
                'updated_at': signup_user.get('created_at')
            }
            # Insert
            await insert(conn, 'm_user', signup_user)
            await insert(conn, 'm_facility', facility)
            await insert(conn, 'users_facilities', assoc)
            for d in depts:
                await insert(conn, 'm_department', d)
            
            # Copy all test patients to m_patient
            contacts_agg = 'select json_agg(a.*) from m_address a where a.patient_id = pt.id'
            insurances_agg = f'select json_agg(i.*) from m_health_insurance i where i.patient_id = pt.id'
            patients = f'select pt.*, ({contacts_agg}) as contacts, ({insurances_agg}) as health_insurances from m_patient pt'
            patients_agg = f'select row_to_json(d) as patient from ({patients}) d'
            pt_rows = await conn.fetch(patients_agg)
            test_patients = [json.loads(row.get('patient')) for row in pt_rows]
            for tp in test_patients:
                tp['id'] = str(uuid.uuid4())
                tp['facility_id'] = facility.get('id')
                await insert(conn, 'm_patient', tp)
                for ta in tp.get('contacts'):
                    ta['id'] = str(uuid.uuid4())
                    ta['patient_id'] = tp.get('id')
                    await insert(conn, 'm_address', ta)
                for ti in tp.get('health_insurances'):
                    ti['id'] = str(uuid.uuid4())
                    ti['patient_id'] = tp.get('id')
                    await insert(conn, 'm_health_insurance', ti)
            
            # Copy all procedure_catalogue to m_using_procedure
            ql_ = 'select row_to_json(c.*) as catalogue from procedure_catalogue c order by c.entity_order'
            rows = await conn.fetch(ql_)
            catalogues = [json.loads(row.get('catalogue')) for row in rows]
            for proc in catalogues:
                proc['id'] = str(uuid.uuid4())
                proc['facility_id'] = facility.get('id')
                await insert(conn, 'm_using_procedure', proc)
            # Copy input_catalogue to using m_using_input
            ql2_ = 'select row_to_json(ic.*) as catalogue from input_catalogue ic where ic.category = $1'
            rows2 = await conn.fetch(ql2_, 'default')
            catalogues2 = [json.loads(row.get('catalogue')) for row in rows2]
            for inp in catalogues2:
                inp['id'] = str(uuid.uuid4())
                inp['facility_id'] = facility.get('id')
                await insert(conn, 'm_using_input', inp)
            # Return user by login
            sql = user_ql_2(add_quote('active'), add_quote(username))  # with settings
            row = await conn.fetchrow(sql)
            if not row:
                raise HTTPException(status_code=404, detail=f'{username} is not found')
            ret = json.loads(row.get('user'))
            # 医療機関（facility） も検索され、配列になっている
            # 医師を選択するため、医療機関内の医師を検索する
            # 医療機関内の診療科も検索する
            for f in ret.get('facilities'):
                sql = licence_ql(add_quote(f.get('id')), add_quote('doctor'))
                rows = await conn.fetch(sql)
                f['doctors'] = [json.loads(row.get('user')) for row in rows] if rows else []
                sql = dept_ql(add_quote(f.get('id')))
                rows = await conn.fetch(sql)
                f['departments'] = [json.loads(row.get('dept')) for row in rows] if rows else []
            
            return JSONResponse(ret)

#----------------------------------------------------------------
# Login
#----------------------------------------------------------------
async def login(request):
    pool = get_pool(request.app)
    payload = await request.json()
    username = payload.get('username')
    async with pool().acquire() as conn:
        sql = user_ql_2(add_quote('active'), add_quote(username))  # with settings
        row = await conn.fetchrow(sql)
        if not row:
            raise HTTPException(status_code=404, detail=f'{username} is not found')
        user = json.loads(row.get('user'))
        # 医療機関（facility） も検索され、配列になっている
        # 医師を選択するため、医療機関内の医師を検索する
        # 医療機関内の診療科も検索する
        for f in user.get('facilities'):
            sql = licence_ql(add_quote(f.get('id')), add_quote('doctor'))
            rows = await conn.fetch(sql)
            f['doctors'] = [json.loads(row.get('user')) for row in rows] if rows else []
            sql = dept_ql(add_quote(f.get('id')))
            rows = await conn.fetch(sql)
            f['departments'] = [json.loads(row.get('dept')) for row in rows] if rows else []
        
        return JSONResponse(user)

#----------------------------------------------------------------
# Facilityのユーザーリストを取得する
#----------------------------------------------------------------
async def list_users_in_facility(request):
    pool = get_pool(request.app)
    facility_id, user_status = [request.query_params[key] for key in ['facility_id', 'user_status']]
    async with pool().acquire() as conn:
        sql = fc_ql(add_quote(user_status), add_quote(facility_id))
        row = await conn.fetchrow(sql)
        if not row:
            raise HTTPException(status_code=404, detail=f'facility_id {facility_id} is not found')
        facility = json.loads(row.get('facility'))
        users = facility.get('users')
        users = users if users else []
        return JSONResponse(users)

async def update_user_info(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    user_to_update = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            user_to_update['updated_at'] = now_as_str()
            await update_by_id(conn, 'm_user', id_, user_to_update)
            return JSONResponse({'count': 1})

async def update_user_status(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            facility_id, user_id, new_status = [payload.get(key) for key in ['facility_id', 'user_id', 'new_status']]
            now = now_as_str()
            assoc_ql = 'update users_facilities set status = $1, updated_at = $2 where user_id = $3 and facility_id = $4'
            await conn.execute(assoc_ql, new_status, now, user_id, facility_id)
            return JSONResponse({'count': 1})