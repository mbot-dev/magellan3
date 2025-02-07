from starlette.responses import JSONResponse
import simplejson as json
from ..db.database import add_quote, delete_by_id, upcert

def risk_ql(table, facility_id, patient_id):
    return f"""
        select row_to_json(t) as risk from (
            select * from {table} where facility_id = {facility_id} and patient_id = {patient_id} order by created_at
        ) t
    """

def memo_ql(facility_id, patient_id):
    return f"""
        select row_to_json(t) as memo from (
            select id, content from m_summary_memo where facility_id = {facility_id} and patient_id = {patient_id}
        ) t
    """

def get_pool(app):
    return app.state.magellan_pool

#---------------------------------------------------
async def get_summary_memo(request):
    pool = get_pool(request.app)
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    async with pool().acquire() as conn:
        sql = memo_ql(add_quote(facility_id), add_quote(patient_id))
        row = await conn.fetchrow(sql)
        if not row:
            return JSONResponse([])
        result = json.loads(row.get('memo'))
        return JSONResponse([result])

async def upcert_summary_memo(request):
    pool = get_pool(request.app)
    data = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await upcert(conn, 'm_summary_memo', data)
            return JSONResponse({'id': data.get('id')})

async def get_risk(request):
    pool = get_pool(request.app)
    entity = request.path_params['entity']
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    table = f'm_{entity}'
    async with pool().acquire() as conn:
        sql = risk_ql(table, add_quote(facility_id), add_quote(patient_id))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('risk')) for row in rows] if rows else [])

async def upcert_risk(request):
    pool = get_pool(request.app)
    entity = request.path_params['entity']
    data = await request.json()
    table = f'm_{entity}'
    async with pool().acquire() as conn:
        async with conn.transaction():
            await upcert(conn, table, data)
            return JSONResponse({'id': data.get('id')})

async def delete_risk(request):
    pool = get_pool(request.app)
    entity = request.path_params['entity']
    id_ = request.path_params['id']
    table = f'm_{entity}'
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, table, id_)
            return JSONResponse({'count': 1})
