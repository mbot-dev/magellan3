import os
import uuid
from datetime import datetime
from starlette.responses import JSONResponse
import httpx
import simplejson as json
from ..db.database import insert, add_quote
from ..util.tracer import get_logger, pretty_dumps

TBL_PATIENT = 'm_patient'
TBL_ADDRESS = 'm_address'
TBL_INSURANCE = 'm_health_insurance'
TBL_PATIENT_VISIT = 'm_patient_visit'

def patient_ql(table, facility_id, name, sex1, birthdate):
    return f"""
        select row_to_json(t) as record from (
            select * from {table} where facility_id = {facility_id} and name = {name} and sex1 = {sex1} and birthdate = {birthdate}
        ) t
    """

def his_ql(table, insurer_number, insured_card_symbol, insured_identification_number, insured_branch_number, birthdate):
    return f"""
        select row_to_json(t) as record from (
            select * from {table} where insurer_number = {insurer_number} and insured_card_symbol = {insured_card_symbol} and insured_identification_number = {insured_identification_number} and insured_branch_number = {insured_branch_number} ans birthdate = {birthdate}
        ) t
    """

async def post_face(request):
    pool = request.app.state.magellan_pool
    payload = await request.json()
    get_logger(__name__).info(pretty_dumps(payload, 'Face Data'))
    
    async with pool().acquire() as conn:
        # Search His
        insurer_number, insured_card_symbol, insured_identification_number, insured_branch_number, birthdate = [payload.get(k) for k in ['insurer_number', 'insured_card_symbol', 'insured_identification_number', 'insured_branch_number', 'birthdate']]
        sql = his_ql(TBL_INSURANCE, add_quote(insurer_number), add_quote(insured_card_symbol), add_quote(insured_identification_number), add_quote(insured_branch_number), add_quote(birthdate))
        row = await conn.fetchrow(sql)
        his = row.get('record') if row else None  # * every attributes
        
        # Search Patient
        facility_id, name, sex1, birthdate  = [payload.get(k) for k in ['facility_id', 'name', 'sex1', 'birthdate']]
        sql = patient_ql(TBL_PATIENT, add_quote(facility_id), add_quote(name), add_quote(sex1), add_quote(birthdate))
        row = await conn.fetchrow(sql)
        patient = row.get('record') if row else None  # * every attributes

        facility_id = payload.get('facility_id')
        patient_id = patient.get('id') if patient else None
        his_id = his.get('id') if his else None
        insurer_name = his.get('insurer_name') if his else payload.get('insurer_name')

        if not his:
            # His Not Found
            if not patient:
                # Patient Not Found -> New Patient
                patient_id = str(uuid.uuid4())  # 
                new_pt = {
                    'id': patient_id,
                    'facility_id': facility_id,
                    'pt_id': str(uuid.uuid4()),  # 患者番号 ToDo Uniqueue
                    'full_name': name,
                    'name_of_other': payload.get('name_of_other'),
                    'kana': payload.get('name_kana'),
                    'name_of_other_kana': payload.get('name_of_other_kana'),
                    'gender': sex1,
                    'sex2': payload.get('sex2'),
                    'dob': birthdate,
                }
                new_address = {
                    'id': str(uuid.uuid4()),
                    'patient_id': patient_id,
                    'address': payload.get('address'),
                    'zip_code': payload.get('post_number'),
                }
                # New His
                his_id = str(uuid.uuid4())
                payload['id'] = his_id  # his id
                payload['patient_id'] = patient_id  # relation
                await insert(conn, TBL_PATIENT, new_pt)
                await insert(conn, TBL_ADDRESS, new_address)
                await insert(conn, TBL_INSURANCE, payload)
            else:
                # Patient exist But Not Found HIS -> New HIS?  ToDo
                his_id = str(uuid.uuid4())  # New Id
                payload['id'] = his_id
                payload['patient_id'] = patient_id
                await insert(conn, TBL_INSURANCE, payload)
        
        # New Visit
        pvt_id = str(uuid.uuid4())
        now = datetime.now()
        visit = dict()
        visit['id'] = pvt_id  # id
        visit['facility_id'] = facility_id  # facility_id
        visit['patient_id'] = patient_id  # patient_id
        visit['pvt_date_time'] = now.strftime('%Y-%m-%dT%H:%M:%S')  # visit time  payload.get('qualification_confirmation_date')
        visit['full_name'] = payload.get('name')
        visit['kana'] = payload.get('name_kana')
        visit['gender'] = payload.get('sex1')
        visit['dob'] = payload.get('birthdate')
        visit['his_id'] = his_id
        visit['his_provider_name'] = insurer_name
        visit['qualification_confirmation_date'] = payload.get('qualification_confirmation_date')  # 資格確認日
        visit['qualification_validity'] = payload.get('qualification_validity')  # 資格有効性
        await insert(conn, TBL_PATIENT_VISIT, visit)
    
    # Send event
    await send_pvt_event(facility_id, pvt_id)
    return JSONResponse({'count': 1})

async def send_pvt_event(facility_id, pvt_id):
    event_data = {
        'channel': f'pvt-{facility_id}',
        'event': 'magellan:pvt-update',
        'data': {
            'type': 'face',
            'pvt_id': pvt_id
        }
    }
    topic_url = os.getenv('URL_FOR_PUSH_TOPIC')
    headers = {'Content-Type': 'application/json'}
    async with httpx.AsyncClient() as client:
        await client.post(topic_url, json=event_data, headers=headers)