from datetime import datetime
from starlette.responses import JSONResponse
import simplejson as json
from ..db.database import add_quote, update_by_id, insert, now_as_str

def ts_ql_0(facility_id):
    return f"""
        select row_to_json(a) as record from (
            select ts.*,
            (select json_agg(w.*) from m_week_schedule w join m_time_schedule mt on w.schedule_id = mt.id) as week_days,
            (select json_agg(h.*) from m_holiday h join m_time_schedule mt on h.schedule_id = mt.id) as holidays
            from m_time_schedule ts where ts.facility_id = {facility_id}
        ) a
    """

def ts_ql(facility_id):
    return f"""
        select row_to_json(a) as record from (
            select ts.*,
            (select json_agg(w.*) from m_week_schedule w where w.schedule_id = ts.id) as week_days,
            (select json_agg(h.*) from m_holiday h where h.schedule_id = ts.id) as holidays
            from m_time_schedule ts where ts.facility_id = {facility_id}
        ) a
    """

def st_ql(table, facility_id):
    return f"""
        select row_to_json(t) as record from (
            select * from {table} where facility_id = {facility_id}
        ) t
    """

def get_pool(app):
    return app.state.magellan_pool


async def get_time_schedule(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        sql = ts_ql(add_quote(facility_id))
        row = await conn.fetchrow(sql)  # No(0) result -> None 
        if not row:
            return JSONResponse([])
        result = json.loads(row.get('record'))
        return JSONResponse([result])


async def replace_time_schedule(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            del_ = f'delete from m_time_schedule where facility_id = {add_quote(payload.get("facility_id"))}'
            await conn.execute(del_)
            schedule = dict()
            attr = ['id', 'facility_id', 'regular_am_start', 'regular_am_end', 'regular_pm_start', 'regular_pm_end']
            for key in attr:
                schedule[key] = payload.get(key)
            await insert(conn, 'm_time_schedule', schedule)
            for w in payload.get('week_days'):
                await insert(conn, 'm_week_schedule', w)
            for h in payload.get('holidays'):
                await insert(conn, 'm_holiday', h)
            return JSONResponse({'count': 1})


async def update_facility_info(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    fc_to_update = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            fc_to_update['updated_at'] = now_as_str()
            await update_by_id(conn, 'm_facility', id_, fc_to_update)
            return JSONResponse({'count': 1})
        

async def get_notification(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        facility_quoted = add_quote(facility_id)
        sql = st_ql('m_notification', facility_quoted)
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('record')) for row in rows] if rows is not None else [])


async def update_notification(request):
    pool = get_pool(request.app)
    data = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            if not data or len(data) == 0:
                return JSONResponse({'count': 0})
            facility_id = data[0].get('facility_id')
            del_ = f'delete from m_notification where facility_id = {add_quote(facility_id)}'
            await conn.execute(del_)
            for d in data:
                await insert(conn, 'm_notification', d)
            return JSONResponse({'count': len(data)})


async def get_facility_ids(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        facility_quoted = add_quote(facility_id)
        sql = f'select row_to_json(t) as record from (select * from m_facility_id where facility_id = {facility_quoted}) t'
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('record')) for row in rows] if rows is not None else [])


async def upsert_facility_ids(request):
    pool = get_pool(request.app)
    data = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            del_ = f'delete from m_facility_id where facility_id = {add_quote(data[0].get("facility_id"))}'
            await conn.execute(del_)
            for d in data:
                await insert(conn, 'm_facility_id', d)
            return JSONResponse({'count': 1})
