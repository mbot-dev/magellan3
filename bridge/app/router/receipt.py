import os
from operator import itemgetter
from itertools import groupby
import simplejson as json
from starlette.responses import JSONResponse
from starlette.background import BackgroundTasks
import httpx
from ..db.database import add_quote
from ..util.tracer import get_logger, pretty_dumps

# Tables
TBL_KARTE = 'm_karte_entry'
TBL_P = 'm_bundle'
TBL_ITEM = 'm_claim_item'
TBL_R = 'r_bundle'
TBL_R_ITEM = 'r_item'
TBL_DIAGNOSIS = 'm_diagnosis'

"""
select
     data.*
from
     data
     inner join (
         select
             user_name,
             row_number() over(order by user_name) as id
         from
             data
         group by
             user_name
     ) ident_user
     on data.user_name = ident_user.user_name

     where ident_user.id >= 1 and ident_user.id <= 2
"""

def row_to_json_(sql):
    return f'select row_to_json(a) as record from ({sql}) a'

def json_agg_(sql):
    return f'select json_agg(a) from ({sql}) a'

def to_json_(sql):
    return f'select to_json(a) from ({sql}) a'

def to_in_params(lst):
    return ','.join([add_quote(code) for code in lst])

def select_patients(facility_id, start, end, status, limit, offset):
    return f'select patient_id from m_karte_entry where facility_id={facility_id} and created_at between {start} and {end} and status={status} group by patient_id order by patient_id'

def get_pool(app):
    return app.state.magellan_pool

#--------------------------------------------------------------
def get_month_query(pts):
    pt_agg = to_json_('select pt.id, pt.pt_id, pt.full_name, pt.gender, pt.dob from m_patient pt where pt.id = rb.patient_id')
    pub_agg = json_agg_('select pub.* from m_public_health_insurance pub where pub.insurance_id = his.id')
    his_agg = to_json_(f'select his.provider_number, his.person_symbol, his.person_number, his.relation_to_person, his.rate_out_patient, his.expired_date, ({pub_agg}) as pub from m_health_insurance his where his.id = rb.his_id')
    item_agg = json_agg_('select i.code, i.name, i.rcp_tensu, i.rcp_kaisu, i.rcp_quantity, i.rcp_unit_code, i.rcp_date from r_item i where i.bundle_id = rb.id')
    bundles = f'select rb.patient_id, rb.created_at, rb.rcp_code, rb.rcp_name, rb.rcp_tensu, rb.rcp_kaisu, ({item_agg}) as receipt_items, ({pt_agg}) as patient, ({his_agg}) as his from r_bundle rb inner join ({pts}) pts on rb.patient_id=pts.patient_id order by rb.patient_id, rb.rcp_code, rb.rcp_tensu, rb.rcp_kaisu'
    return row_to_json_(bundles)

async def get_monthly(request):
    pool = get_pool(request.app)
    facility_id, start, end, limit, offset  = [request.query_params[name] for name in ['facility_id', 'start', 'end', 'limit', 'offset']]
    facility_quote = add_quote(facility_id)
    start_quote = add_quote(start)
    end_quote = add_quote(end)
    lmt = int(limit)
    offst = int(offset)
    results = []
    async with pool().acquire() as conn:
        patients = select_patients(facility_quote, start_quote, end_quote, add_quote('F'), lmt, offst)
        sql = get_month_query(patients)
        rows = await conn.fetch(sql)

        receipts = [json.loads(row.get('record')) for row in rows] if rows else []
        get_logger(__name__).info(pretty_dumps(receipts, 'receipts'))
        
        r_grouper = itemgetter('patient_id', 'rcp_code', 'rcp_tensu', 'rcp_kaisu')
        c_sorter = itemgetter('created_at')
        receipts.sort(key=r_grouper)
        for _, mem in groupby(receipts, r_grouper):
            gl = list(mem)
            gl.sort(key=c_sorter)
            d = dict()
            d['index'] = gl[0]  # 1st r_bundle
            entries = [''] * 31  # 31 days, index=0,...,30
            sum_k = 0
            for e in gl:
                day = int(e.get('created_at')[8:10])
                n = int(e.get('rcp_kaisu'))
                entries[day-1] = n if entries[day-1] == '' else entries[day-1] + n  # set kaisu, perform multiple at same day
                sum_k += n
            d['entries'] = entries
            d['kaisu'] = sum_k  # sum of kaisu
            results.append(d)
    
    return JSONResponse(results)

async def relay_monthly_receipt(request):
    data = await request.json()
    tasks = BackgroundTasks()
    tasks.add_task(send_receipt_event, data)
    return JSONResponse({'count': '1'}, background=tasks)

async def send_receipt_event(event_data):
    receipt_url = os.getenv('URL_FOR_RECEIPT_TOPIC')
    headers = {'Content-Type': 'application/json'}
    async with httpx.AsyncClient() as client:
        await client.post(receipt_url, json=event_data, headers=headers)
