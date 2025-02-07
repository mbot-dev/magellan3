from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException
import simplejson as json
from ..db.database import add_quote, insert, update_by_id, delete_by_id

by_pt_ql = """
    select row_to_json(a) as record from (
        select e.*,
        (select row_to_json(d.*) from m_document d where d.entry_id = e.id) as doc
        from m_document_entry e where e.facility_id = {} and e.patient_id = {} order by e.issued_at desc
    ) a
"""

def get_pool(app):
    return app.state.magellan_pool

#---------------------------------------------------
async def get_document_list_by_facility(request):
    pool = get_pool(request.app)
    facility_id = request.query_params['facility_id']
    async with pool().acquire() as conn:
        ql_ = 'select row_to_json(e.*) as record form m_document_entry e where e.facility_id = $1 order by e.issued_at'
        rows = await conn.fetch(ql_, facility_id)
        return JSONResponse([json.loads(row.get('record')) for row in rows] if rows else [])

async def get_document_list_by_patient(request):
    pool = get_pool(request.app)
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    async with pool().acquire() as conn:
        ql_ = by_pt_ql.format(add_quote(facility_id), add_quote(patient_id))
        rows = await conn.fetch(ql_)
        return JSONResponse([json.loads(row.get('record')) for row in rows] if rows else [])

async def get_document(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        ql_ = 'select row_to_json(d.*) as record from m_document d where d.id = $1'
        row = await conn.fetchrow(ql_, id_)
        if not row:
            raise HTTPException(status_code=404, detail='Document not found')
        result = json.loads(row.get('record'))
        return JSONResponse(result)

async def save_document(request):
    pool = get_pool(request.app)
    doc = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            await insert(conn, 'm_document_entry', doc)
            doc_to_save = {
                'id': doc.get('id'),  # same as below -> remove when new
                'content': doc,
                'entry_id': doc.get('id')
            }
            await insert(conn, 'm_document', doc_to_save)
            return JSONResponse({'id': doc.get('id')})

async def update_document(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    doc = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            update_by_id(conn, 'm_document', id_, doc)
            return 1
    return JSONResponse({'count': cnt})

async def delete_document(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, 'm_document', id_)
            return JSONResponse({'count': 1})
