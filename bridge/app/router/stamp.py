import uuid
from starlette.responses import JSONResponse
import simplejson as json
from ..db.database import add_quote, update_by_id, insert, delete_by_id
from ..util.tracer import get_logger, pretty_dumps

def stamp_ql(facility_id, entity):
    return f"""
        select row_to_json(a) as stamp from (
            select s.*, 
            (select json_agg(i.*) from m_stamp_item i where i.stamp_id = s.id) as claim_items
            from m_stamp s where s.facility_id = {facility_id} and s.entity = {entity} order by s.freq
        ) a
    """

def disease_ql(facility_id):
    return f"""
        select row_to_json(d.*) as stamp from m_disease_stamp d where d.facility_id = {facility_id} order by d.freq, d.icd1012
    """

def procedure_ql(facility_id):
    return f"""
        select row_to_json(t.*) as proc from m_using_procedure t where t.facility_id = {facility_id} order by t.entity_order
    """

def input_ql(facility_id):
    return f"""
        select row_to_json(t.*) as input from m_using_input t where t.facility_id = {facility_id} order by t.entity_order
    """

def input_bundle_ql(entity):
    return f"""
        select row_to_json(a) as bundle from (
            select b.*, 
            (select json_agg(i.*) from input_item i where i.input_catalog_id = b.id) as claim_items
            from input_catalogue b where b.entity = {entity}
        ) a
    """

def get_pool(app):
    return app.state.magellan_pool

async def get_stamp_by_entity(request):
    pool = get_pool(request.app)
    facility_id, entity = [request.query_params[name] for name in ['facility_id', 'entity']]
    async with pool().acquire() as conn:
        sql = stamp_ql(add_quote(facility_id), add_quote(entity))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(rec.get('stamp')) for rec in rows])

async def save_stamp(request):
    pool = get_pool(request.app)
    stamp = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).info(pretty_dumps(stamp))
            await insert(conn, 'm_stamp', stamp)
            for item in stamp.get('claim_items'):
                item['stamp_id'] = stamp.get('id')  # make relation here...
                await insert(conn, 'm_stamp_item', item)
            return JSONResponse({'id': stamp.get('id')})

async def update_stamp_name(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    data = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await update_by_id(conn, 'm_stamp', id_, data)  # {id: xxx, stamp_name: nn}
            return JSONResponse({'count': 1})

async def update_stamp_order(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(payload))
            sql = 'update m_stamp set freq = $1 where id = $2'
            for data in payload:
                await conn.execute(sql, data.get('freq'), data.get('id'))
            return JSONResponse({'count': len(payload)})

async def delete_stamp(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, 'm_stamp', id_)  # must cascade delete
            return JSONResponse({'count': 1})

async def get_disease_stamps(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        sql = disease_ql(add_quote(facility_id))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(rec.get('stamp')) for rec in rows])

async def save_disease_stamp(request):
    pool = get_pool(request.app)
    stamp = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(stamp))
            await insert(conn, 'm_disease_stamp', stamp)
            return JSONResponse({'id': stamp.get('id')}) 

async def update_disease_stamp(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await update_by_id(conn, 'm_disease_stamp', id_, payload)  # {id: xxx, stamp_name: nn}
            return JSONResponse({'count': 1}) 

async def update_disease_order(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(payload))
            sql = 'update m_disease_stamp set freq = $1 where id = $2'
            for data in payload:
                await conn.execute(sql, data.get('freq'), data.get('id'))
            return JSONResponse({'count': len(payload)}) 

async def delete_disease_stamp(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, 'm_disease_stamp', id_)  # must cascade delete
            return JSONResponse({'count': 1})

async def get_procedure_catalogue(request):
    pool = get_pool(request.app)
    async with pool().acquire() as conn:
        ql_ = 'select row_to_json(c.*) as catalogue from procedure_catalogue c order by c.entity_order'
        rows = await conn.fetch(ql_)
        return JSONResponse([json.loads(row.get('catalogue')) for row in rows] if rows else [])

async def get_using_procedures(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        sql = procedure_ql(add_quote(facility_id))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(rec.get('proc')) for rec in rows] if rows else [])

async def update_using_procedure(request):
    pool = get_pool(request.app)
    facility_id = request.path_params['facility_id']
    procedures = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            ql_ = 'delete from m_using_procedure where facility_id = $1'
            await conn.execute(ql_, facility_id)
            for proc in procedures:
                await insert(conn, 'm_using_procedure', proc)
            return JSONResponse({'count': len(procedures)})

async def get_input_catalogue(request):
    pool = get_pool(request.app)
    async with pool().acquire() as conn:
        ql_ = 'select row_to_json(ic.*) as catalogue from input_catalogue ic order by ic.entity_order'
        rows = await conn.fetch(ql_)
        return JSONResponse([json.loads(row.get('catalogue')) for row in rows] if rows else [])

async def get_using_inputs(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        sql = input_ql(add_quote(facility_id))
        rows = await conn.fetch(sql)
        return JSONResponse([json.loads(row.get('input')) for row in rows] if rows else [])

async def update_using_input(request):
    pool = get_pool(request.app)
    facility_id = request.path_params['facility_id']
    inputs = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            ql_ = 'delete from m_using_input where facility_id = $1'
            await conn.execute(ql_, facility_id)
            # Replace
            for inp in inputs:
                await insert(conn, 'm_using_input', inp)
            return JSONResponse({'count': len(inputs)})

async def get_input_bundle(request):
    pool = get_pool(request.app)
    entity = request.query_params['entity']
    async with pool().acquire() as conn:
        ql_ = input_bundle_ql(add_quote(entity))
        row = await conn.fetchrow(ql_)
        ret = json.loads(row.get('bundle'))
        get_logger(__name__).debug(pretty_dumps(ret))
        return JSONResponse(ret)

## no api
async def add_input_catalogue(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            for data in payload:
                data['id'] = data.get('id', str(uuid.uuid4()))
                await insert(conn, 'input_catalogue', data)
                for item in data.get('claim_items'):
                    item['id'] = item.get('id', str(uuid.uuid4()))
                    item['input_catalog_id'] = data.get('id')
                    await insert(conn, 'input_item', item)
            return JSONResponse({'count': len(payload)})
