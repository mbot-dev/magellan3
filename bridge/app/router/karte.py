import os
from operator import itemgetter
from itertools import groupby
import simplejson as json
from starlette.responses import JSONResponse
from starlette.background import BackgroundTasks
import httpx
from ..db.database import add_quote, to_safe_dict, insert, update_by_id, delete_by_id, upcert
from ..util.tracer import get_logger, pretty_dumps

# Tables
TBL_KARTE = 'm_karte_entry'
TBL_SOA = 'm_soa'
TBL_P = 'm_bundle'
TBL_ITEM = 'm_claim_item'
TBL_R = 'r_bundle'
TBL_R_ITEM = 'r_item'
TBL_DIAGNOSIS = 'm_diagnosis'
TBL_PVT = 'm_patient_visit'

code_pivot = """select k.id as id,
    k.facility_id as facility_id,
    k.patient_id as patient_id,
    k.created_at as created_at,
    k.status as status,
    b.id as b_id,
    b.karte_id as b_karte_id,
    b.group as b_group,
    c.id as c_id,
    c.bundle_id as c_bundle_id, 
    c.code as c_code,
    c.name as c_name,
    c.dose_type as c_dose_type,
    c.value as c_value,
    c.drop as c_drop
    from (select id, facility_id, patient_id, created_at, status from m_karte_entry where facility_id={} and patient_id={} and status='F' order by created_at desc limit {} offset {})k
    inner join m_bundle b on b.karte_id=k.id
    inner join m_claim_item c on c.bundle_id=b.id"""

def karte_pivot(facility_id, patient_id, limit, offset):
    return f"""
        select k.id as id, 
        k.facility_id as facility_id, 
        k.patient_id as patient_id, 
        k.created_at as created_at, 
        k.status as status,
        b.id as b_id, 
        b.karte_id as b_karte_id, 
        b.group as b_group, 
        b.entity as b_entity, 
        b.name as b_name 
        from (select id, facility_id, patient_id, created_at, status from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset})k
        inner join m_bundle b on b.karte_id=k.id
    """

def entity_pivot(facility_id, patient_id, limit, offset):
    return f"""
        select k.id as id,
        k.facility_id as facility_id,
        k.patient_id as patient_id,
        k.created_at as created_at,
        k.status as status,
        b.id as b_id,
        b.karte_id as b_karte_id,
        b.entity as b_entity,
        b.name as b_name 
        from (select id, facility_id, patient_id, created_at, status from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset})k
        inner join m_bundle b on b.karte_id=k.id
    """

def dual_pivot(facility_id, patient_id, limit, offset):
    return f"""
        select k.id as id,
        k.facility_id as facility_id,
        k.patient_id as patient_id,
        k.created_at as created_at,
        k.status as status,
        b.id as b_id,
        b.karte_id as b_karte_id,
        b.group as b_group 
        from (select id, facility_id, patient_id, created_at, status from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset})k
        inner join m_bundle b on b.karte_id=k.id
    """

def receipt_pivot(facility_id, patient_id, limit, offset):
    return f"""
        select k.id as id,
        k.facility_id as facility_id,
        k.patient_id as patient_id, 
        k.created_at as created_at,
        k.status as status,
        b.id as b_id,
        b.karte_id as b_karte_id,
        b.group as b_group 
        from (select id, facility_id, patient_id, created_at, status from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset})k
        inner join r_bundle b on b.karte_id=k.id
    """

def karte_query(facility_id, patient_id, limit, offset):
    return f"""
        select row_to_json(t) as record from (
            with bundles as (
                select b.*, 
                (select json_agg(c.*) from m_claim_item c where c.bundle_id = b.id) as claim_items 
                from m_bundle b
            )
            select
                k.*,
                (select to_json(pt.dob) from m_patient pt where pt.id = k.patient_id) as dob,
                (select to_json(hi.insurer_name) from m_health_insurance hi where hi.id = k.his_id) as provider,
                (select to_json(u.full_name) from m_user u where u.id = k.physician_id) as physician,
                (select to_json(u.full_name) from m_user u where u.id = k.clerk_id) as clerk,
                (select to_json(soa) from m_soa soa where soa.karte_id = k.id) as soa,
                (select json_agg(b.*) from bundles b where b.karte_id = k.id) as p
                from (select * from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset}) as k
        )t
    """

def dual_query(facility_id, patient_id, limit, offset):
    return f"""
        select row_to_json(t) as record from (
            with bundles as (
                select b.*, 
                (select json_agg(c.*) from m_claim_item c where c.bundle_id = b.id) as claim_items 
                from m_bundle b where b.group between '000' and '999'
            ), r_bundles as (
                select r.*, 
                (select json_agg(i.*) from r_item i where i.bundle_id = r.id) as receipt_items 
                from r_bundle r
            )
            select
                k.*,
                (select to_json(pt.dob) from m_patient pt where pt.id = k.patient_id) as dob,
                (select to_json(hi.insurer_name) from m_health_insurance hi where hi.id = k.his_id) as provider,
                (select to_json(u.full_name) from m_user u where u.id = k.physician_id) as physician,
                (select to_json(u.full_name) from m_user u where u.id = k.clerk_id) as clerk,
                (select to_json(soa) from m_soa soa where soa.karte_id = k.id) as soa,
                (select json_agg(b.*) from bundles b where b.karte_id = k.id) as p,
                (select json_agg(rb.*) from r_bundles rb where rb.karte_id = k.id) as r
                from (select * from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset}) as k
        )t
    """

def receipt_query(facility_id, patient_id, limit, offset):
    return f"""
        select row_to_json(t) as record from (
            with bundles as (
                select b.*, 
                (select json_agg(c.*) from m_claim_item c where c.bundle_id = b.id) as claim_items 
                from m_bundle b where b.group = '000'
            ), r_bundles as (
                select r.*, 
                (select json_agg(i.*) from r_item i where i.bundle_id = r.id) as receipt_items 
                from r_bundle r
            )
            select
                k.*,
                (select to_json(pt.dob) from m_patient pt where pt.id = k.patient_id) as dob,
                (select to_json(hi.insurer_name) from m_health_insurance hi where hi.id = k.his_id) as provider,
                (select to_json(u.full_name) from m_user u where u.id = k.physician_id) as physician,
                (select to_json(u.full_name) from m_user u where u.id = k.clerk_id) as clerk,
                (select json_agg(b.*) from bundles b where b.karte_id = k.id) as p,
                (select json_agg(rb.*) from r_bundles rb where rb.karte_id = k.id) as r
                from (select * from m_karte_entry where facility_id={facility_id} and patient_id={patient_id} and status='F' order by created_at desc limit {limit} offset {offset}) as k
        )t
    """

def shape_ql(facility_id, patient_id):
    return f"""
        select count(1), min(created_at), max(created_at) from m_karte_entry where facility_id = {facility_id} and patient_id = {patient_id} and status = 'F'
    """

def get_pool(app):
    return app.state.magellan_pool

async def get_shape(conn, facility_id, patient_id):
    sql = shape_ql(add_quote(facility_id), add_quote(patient_id))
    row = await conn.fetchrow(sql)
    return {
        'num_karte': row[0],
        'first_karte': row[1],
        'last_karte': row[2],
    }

#--------------------------------------------------------------
async def get_entity_pivot(conn, facility_id, patient_id, limit, offset, dsc):
    sql = entity_pivot(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    dates = list(set([x['created_at'] for x in rows]))
    dates = sorted(dates, reverse=dsc)
    row_grouper = itemgetter('b_entity')
    col_grouper = itemgetter('created_at')
    rows.sort(key=row_grouper) # must needs to sort
    pivot = dict()
    for key, mem in groupby(rows, row_grouper):
        pivot[key] = dict()
        gl = list(mem)
        gl.sort(key=col_grouper)
        for dt, dg in groupby(gl, col_grouper):
            pivot[key][dt] = [d['b_id'] for d in list(dg)]
    
    get_logger(__name__).debug(pretty_dumps(pivot))
    return dates, pivot

async def get_karte_list(conn, facility_id, patient_id, limit, offset):
    sql = karte_query(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    return [json.loads(row.get('record')) for row in rows]

async def get_entity_history(pool, facility_id, patient_id, lmt, offst, client_order):
    limit = int(lmt)
    offset = int(offst)
    dsc = (client_order == 'desc')
    result = dict()
    async with pool().acquire() as conn:
        if offset == 0:
            shape = await get_shape(conn, facility_id, patient_id)
            num_karte = shape.get('num_karte')
            if num_karte == 0:
                result['shape'] = shape
                return result
            result['shape'] = shape
            # Get all p or max(num_karte, 100) ...
            dates, pivot = await get_entity_pivot(conn, facility_id, patient_id, num_karte, 0, dsc)
            result['entryDates'] = dates
            result['pivot'] = pivot
        
        # Tail (desc limit offset)
        karte_list = await get_karte_list(conn, facility_id, patient_id, limit, offset)
        # asc -> karte_list.reverse()
        if not dsc:
            karte_list.reverse()

        result['karte_list'] = karte_list

        return result

#-----------------------------------------------------------------
async def get_dual_pivot(conn, facility_id, patient_id, limit, offset, dsc):
    sql = dual_pivot(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    dates = list(set([x['created_at'] for x in rows]))
    dates = sorted(dates, reverse=dsc)
    row_grouper = itemgetter('b_group')
    col_grouper = itemgetter('created_at')
    rows.sort(key=row_grouper)
    pivot = dict()
    for key, mem in groupby(rows, row_grouper):
        pivot[key] = dict()
        gl = list(mem)
        gl.sort(key=col_grouper)
        for dt, dg in groupby(gl, col_grouper):
            pivot[key][dt] = [d['b_id'] for d in list(dg)]
    
    get_logger(__name__).debug(pretty_dumps(pivot))
    return dates, pivot

async def get_dual_list(conn, facility_id, patient_id, limit, offset):
    sql = dual_query(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    return [json.loads(row.get('record')) for row in rows]

async def get_dual_history(pool, facility_id, patient_id, lmt, offst, client_order):
    limit = int(lmt)
    offset = int(offst)
    dsc = True if client_order == 'desc' else False
    result = dict()
    async with pool().acquire() as conn:
        if offset == 0:
            shape = await get_shape(conn, facility_id, patient_id)
            num_karte = shape.get('num_karte')
            if num_karte == 0:
                result['shape'] = shape
                return result
            result['shape'] = shape
            # Get all p or max(num_karte, 100) ...
            dates1, karte_pivot = await get_dual_pivot(conn, facility_id, patient_id, num_karte, 0, dsc)
            _, receipt_pivot = await get_receipt_pivot(conn, facility_id, patient_id, num_karte, 0, dsc)
            result['entryDates'] = dates1
            result['pivot'] = karte_pivot
            result['receipt_pivot'] = receipt_pivot
        
        # Tail (desc limit offset)
        dual_list = await get_dual_list(conn, facility_id, patient_id, limit, offset)
        # asc -> karte_list.reverse()
        if not dsc:
            dual_list.reverse()

        result['karte_list'] = dual_list

        return result

#--------------------------------------------------------------
async def get_karte_pivot(conn, facility_id, patient_id, limit, offset, dsc):
    sql = karte_pivot(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    dates = list(set([x['created_at'] for x in rows]))
    dates = sorted(dates, reverse=dsc)
    row_grouper = itemgetter('b_group', 'b_entity', 'b_name')
    col_grouper = itemgetter('created_at')
    rows.sort(key=row_grouper) # must needs to sort
    pivot = dict()
    for (g, e, n), mem in groupby(rows, row_grouper):
        key = f'{g}:{e}:{n}'
        pivot[key] = dict()
        gl = list(mem)
        gl.sort(key=col_grouper)
        for dt, dg in groupby(gl, col_grouper):
            pivot[key][dt] = [d['b_id'] for d in list(dg)]
    
    get_logger(__name__).debug(pretty_dumps(pivot))
    return dates, pivot

async def get_receipt_pivot(conn, facility_id, patient_id, limit, offset, dsc):
    sql = receipt_pivot(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    dates = list(set([x['created_at'] for x in rows]))
    dates = sorted(dates, reverse=dsc)
    row_grouper = itemgetter('b_group')
    col_grouper = itemgetter('created_at')
    rows.sort(key=row_grouper)
    pivot = dict()
    for key, mem in groupby(rows, row_grouper):
        pivot[key] = dict()
        gl = list(mem)
        gl.sort(key=col_grouper)
        for dt, dg in groupby(gl, col_grouper):
            pivot[key][dt] = [d['b_id'] for d in list(dg)]
    
    get_logger(__name__).debug(pretty_dumps(pivot))
    return dates, pivot

async def get_receipt_list(conn, facility_id, patient_id, limit, offset):
    sql = receipt_query(add_quote(facility_id), add_quote(patient_id), limit, offset)
    rows = await conn.fetch(sql)
    return [json.loads(row.get('record')) for row in rows]

async def get_receipt_history(pool, facility_id, patient_id, lmt, offst, client_order):
    limit = int(lmt)
    offset = int(offst)
    dsc = True if client_order == 'desc' else False
    result = dict()
    async with pool().acquire() as conn:
        if offset == 0:
            shape = await get_shape(conn, facility_id, patient_id)
            num_karte = shape.get('num_karte')
            if num_karte == 0:
                result['shape'] = shape
                return result
            result['shape'] = shape
            # Get all p or max(num_karte, 100) ...
            dates1, karte_pivot = await get_karte_pivot(conn, facility_id, patient_id, num_karte, 0, dsc)
            _, receipt_pivot = await get_receipt_pivot(conn, facility_id, patient_id, num_karte, 0, dsc)
            result['entryDates'] = dates1
            result['pivot'] = karte_pivot
            result['receipt_pivot'] = receipt_pivot
        
        # Tail (desc limit offset)
        receipt_list = await get_receipt_list(conn, facility_id, patient_id, limit, offset)
        # asc -> karte_list.reverse()
        if not dsc:
            receipt_list.reverse()

        result['karte_list'] = receipt_list

    return result

#--------------------------------------------------------------
async def get(request):
    pool = get_pool(request.app)
    render = request.query_params['render']
    params = [request.query_params[name] for name in ['facility_id', 'patient_id', 'limit', 'offset', 'client_order']]
    
    data = None;
    
    if render == 'mosaic':
        data = await get_entity_history(pool, *params)
        
    if render == 'dual':
        data = await get_dual_history(pool, *params)
    
    if render == 'receipt':
        data = await get_receipt_history(pool, *params)

    return JSONResponse(data)

#--------------------------------------------------------------
async def save(pool, karte):
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(karte))
            # Karte
            await insert(conn, TBL_KARTE, karte)
            # SOA
            await insert(conn, TBL_SOA, karte.get('soa'))
            # Bundle
            for bdl in karte.get('p'):
                await insert(conn, TBL_P, bdl)
                # Claim Item
                for ci in bdl.get('claim_items'):
                    await insert(conn, TBL_ITEM, ci)
            
            # Update Diagnosis  group = 0000
            diag_list = [x for x in karte.get('p', []) if x.get('group') == '000']
            for diag in diag_list:
                safe_ctx = await to_safe_dict(conn, TBL_DIAGNOSIS, diag)
                
                for cl in diag.get('claim_items', []):
                    safe_item = await to_safe_dict(conn, TBL_DIAGNOSIS, cl)
                    
                    # Merge to create a record
                    safe_diag = safe_ctx | safe_item    

                    # Find rows with the same code
                    facility_id = safe_diag.get('facility_id')
                    patient_id = safe_diag.get('patient_id')
                    code = safe_diag.get('code')
                    sql = f'select d.id, d.outcome from {TBL_DIAGNOSIS} d where d.facility_id = $1 and d.patient_id = $2 and d.code = $3 order by d.date_of_onset desc'
                    row = await conn.fetchrow(sql, facility_id, patient_id, code)
                    
                    if row is None:
                        # No diagnosis
                        await insert(conn, TBL_DIAGNOSIS, safe_diag)

                    elif row is not None and row.get('outcome') != '':
                        # Outcome has already set. Save as new diagnosis.
                        await insert(conn, TBL_DIAGNOSIS, safe_diag)  # save as new
                       
                    elif row is not None and row.get('outcome') == '':
                        # Not set outcome. Update this record
                        await update_by_id(conn, TBL_DIAGNOSIS, row.get('id'), safe_diag)  # update
                        get_logger(__name__).debug('Updated the diagnosis')

async def update(pool, karte):
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(karte))
            # 修正元カルテの out date 処理
            outdate_id = karte.get('outdate_id')  # 旧 ID
            status = 'O'  # outdate status
            # Outdate karte
            karte_ql = f'update {TBL_KARTE} set status = $1 where id = $2'
            await conn.execute(karte_ql, status, outdate_id)
            # Outdate soa
            soa_ql = f'update {TBL_SOA} s set status = $1 from {TBL_KARTE} k where s.karte_id = k.id and k.id = $2'
            await conn.execute(soa_ql, status, outdate_id)
            # Outdate bundle
            bdl_ql = f'update {TBL_P} b set status = $1 from {TBL_KARTE} k where b.karte_id = k.id and k.id = $2'  # Foreign Key
            await conn.execute(bdl_ql, status, outdate_id)
            # Outdate item
            item_ql = f'update {TBL_ITEM} i set status = $1 from {TBL_P} b where i.bundle_id = b.id and b.karte_id = $2'
            await conn.execute(item_ql, status, outdate_id)
            # Outdate r_bundle
            r_bdl_ql = f'update {TBL_R} r set status = $1 from {TBL_KARTE} k where r.karte_id = k.id and k.id = $2'
            await conn.execute(r_bdl_ql, status, outdate_id)
            # Outdate r_item
            r_item_ql = f'update {TBL_R_ITEM} ri set status = $1 from {TBL_R} r where ri.bundle_id = r.id and r.karte_id = $2'
            await conn.execute(r_item_ql, status, outdate_id)

async def post(request):
    pool = get_pool(request.app)
    karte = await request.json()
    
    # Save karte
    await save(pool, karte) 
    
    # Outdate karte
    if karte.get('outdate_id'):
        await update(pool, karte) # Update karte
    
    # Send streaming santei event
    event_data = {'data_id': karte.get('id')}
    tasks = BackgroundTasks()
    tasks.add_task(send_santei_event, event_data)
    return JSONResponse({'count': '1'}, background=tasks)

async def delete(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            await delete_by_id(conn, TBL_KARTE, id_)  # must cascade
            return JSONResponse({'count': 1})

#-------------------------------------------------------------
async def send_santei_event(event_data):
    topic_url = os.getenv('URL_FOR_SANTEI_TOPIC')
    headers = {'Content-Type': 'application/json'}
    async with httpx.AsyncClient() as client:
        await client.post(topic_url, json=event_data, headers=headers)