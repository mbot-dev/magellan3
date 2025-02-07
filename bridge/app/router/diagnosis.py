from starlette.responses import JSONResponse
import simplejson as json
from ..db.database import add_quote, update_by_id, insert, delete_by_id

def diag_ql(facility_id, patient_id):
    return f"""
        select row_to_json(t) as diagnosis from (
            select * from m_diagnosis where facility_id = {facility_id} and patient_id = {patient_id} order by date_of_onset desc
        ) t
    """

def active_ql(facility_id, patient_id, outcome):
    return f"""
        select row_to_json(t) as diagnosis from (
            select * from m_diagnosis where facility_id = {facility_id} and patient_id = {patient_id} and outcome = {outcome} order by date_of_onset desc
        ) t
    """

def get_pool(app):
    return app.state.magellan_pool

async def get_diagnosis_list(request):
    pool = get_pool(request.app)
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    async with pool().acquire() as conn:
        sql = diag_ql(add_quote(facility_id), add_quote(patient_id))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('diagnosis')) for row in rows] if rows else [])

async def get_active_diagnosis(request):
    pool = get_pool(request.app)
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    async with pool().acquire() as conn:
        sql = active_ql(add_quote(facility_id), add_quote(patient_id), add_quote(''))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('diagnosis')) for row in rows] if rows else [])

async def save_diagnosis(request):
    pool = get_pool(request.app)
    diagnosis = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await insert(conn, 'm_diagnosis', diagnosis)
            return JSONResponse({'id': diagnosis.get('id')})

async def update_diagnosis(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    diagnosis = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await update_by_id(conn, 'm_diagnosis', id_, diagnosis)
            return JSONResponse({'count': 1})

async def delete_diagnosis(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, 'm_diagnosis', id_,)
            return JSONResponse({'count': 1})

