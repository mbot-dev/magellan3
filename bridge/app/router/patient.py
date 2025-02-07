import uuid
import unicodedata
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException
import simplejson as json
from ..db.database import add_quote, update_by_id, insert
from ..util.tracer import get_logger, pretty_dumps

TBL_ADDRESS = 'm_address'
TBL_INSURANCE = 'm_health_insurance'
TBL_PUBLIC = 'm_public_health_insurance'
TBL_PATIENT = 'm_patient'

ATTR_CONTACTS = 'contacts'
ATTR_INSURANCES = 'health_insurances'
ATTR_PUBLICS = 'public_insurances'

def get_pool(app):
    return app.state.magellan_pool

def detect_char_class(text):
    """
    unicodedata.name(u'6') -> DIGIT SIX
    unicodedata.name(u'A') -> LATIN CAPITAL LETTER A
    unicodedata.name(u'ば') -> HIRAGANA LETTER BA
    unicodedata.name(u'バ') -> KATAKANA LETTER BA
    unicodedata.name(u'馬') -> CJK UNIFIED IDEOGRAPH-99AC
    """
    for ch in text:
        name = unicodedata.name(ch)
        if name.startswith('DIGIT'):
            return 0
        if name.startswith('LATIN'):
            return 1
        if name.startswith('HIRAGANA'):
            return 2
        if name.startswith('KATAKANA'):
            return 3
        if name.startswith('CJK UNIFIED'):
            return 4
        return -1

#----------------------------------------------------------------
async def find_patients(pool, facility_id, search):
    async with pool().acquire() as conn:

        ch_class = detect_char_class(search)
        if ch_class == 0 or ch_class == 1:
            search_column = 'pt_id'
        elif ch_class == 3:
            search_column = 'kana'
        elif ch_class == 4:
            search_column = 'full_name'
        else:
            return []

        facility_qoute = add_quote(facility_id)
        search_qoute = add_quote(f'^{search}')
        
        contacts_agg = 'select json_agg(a.*) from m_address a where a.patient_id = pt.id'  # Address
        publics_agg = 'select json_agg(p.*) from m_public_health_insurance p where p.insurance_id = ins.id'  # Public Health Insurances
        insurances = f'select ins.*, ({publics_agg}) as public_insurances from m_health_insurance ins where ins.patient_id = pt.id'  # Health Insurances publicInsurances
        insurances_agg = f'select json_agg(c) from ({insurances}) c'
        patients = f'select pt.*, ({contacts_agg}) as contacts, ({insurances_agg}) as health_insurances from m_patient pt where pt.facility_id = {facility_qoute} and pt.{search_column} ~ {search_qoute} order by pt.pt_id'
        patients_agg = f'select row_to_json(d) as patient from ({patients}) d'
        
        rows = await conn.fetch(patients_agg)
        return [json.loads(row.get('patient')) for row in rows] if rows else []


async def get_patient(pool, facility_id, patient_id):
    async with pool().acquire() as conn:

        facility_qoute = add_quote(facility_id)
        patient_qoute = add_quote(patient_id)
        # Address
        contacts_agg = 'select json_agg(a.*) from m_address a where a.patient_id = pt.id'
        # Public Health Insurances
        publics_agg = 'select json_agg(p.*) from m_public_health_insurance p where p.insurance_id = ins.id'
        # Health Insurances publicInsurances
        insurances = f'select ins.*, ({publics_agg}) as public_insurances from m_health_insurance ins where ins.patient_id = pt.id'
        insurances_agg = f'select json_agg(c) from ({insurances}) c'
        # Patient
        patient = f'select pt.*, ({contacts_agg}) as contacts, ({insurances_agg}) as health_insurances from m_patient pt where pt.facility_id = {facility_qoute} and pt.id = {patient_qoute}'
        patient_agg = f'select row_to_json(d) as patient from ({patient}) d'

        rows = await conn.fetch(patient_agg)
        return [json.loads(row.get('patient')) for row in rows] if rows else []
    

async def get(request):
    pool = get_pool(request.app)
    facility_id, search = [request.query_params[name] for name in ['facility_id', 'search']]
    if search is not None and search != '':
        results = await find_patients(pool, facility_id, search)
        return JSONResponse(results)
    facility_id, patient_id = [request.query_params[name] for name in ['facility_id', 'patient_id']]
    if patient_id is not None and patient_id != '':
        results = await get_patient(pool, facility_id, patient_id)
        return JSONResponse(results)
    

async def post(request):
    pool = get_pool(request.app)
    patient = await request.json()
    async with pool().acquire() as conn:
         async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(patient))
            patient['id'] = str(uuid.uuid4())  # numbering
            await insert(conn, TBL_PATIENT, patient)
            # Addrss
            if bool(patient.get(ATTR_CONTACTS)):
                for c in patient.get(ATTR_CONTACTS):
                    c['id'] = str(uuid.uuid4())
                    c['patient_id'] = patient.get('id')
                    await insert(conn, TBL_ADDRESS, c)
            # Health insurances
            if bool(patient.get(ATTR_INSURANCES)):
                for ins in patient.get(ATTR_INSURANCES):
                    ins['id'] = str(uuid.uuid4())
                    ins['patient_id'] = patient.get('id')
                    await insert(conn, TBL_INSURANCE, ins)
                    # Public insurances
                    if bool(ins.get(ATTR_PUBLICS)):
                        for p in ins.get(ATTR_PUBLICS):
                            p['id'] = str(uuid.uuid4())
                            p['insurance_id'] = ins.get('id')
                            await insert(conn, TBL_PUBLIC, p)
            
            return JSONResponse({'id': patient.get('id')})


async def put(request):
    pool = get_pool(request.app)
    payload = await request.json()
    async with pool().acquire() as conn:
         async with conn.transaction():
            facility_id, pt_id = [payload.get(name) for name in ['facility_id', 'pt_id']]
            sql = 'select id from m_patient where facility_id = $1 and pt_id = $2'
            id_ = await conn.fetchval(sql, facility_id, pt_id)
            await update_by_id(conn, TBL_PATIENT, id_, payload)
            return JSONResponse({'count': 1})


async def delete(request):
    pool = get_pool(request.app)
    patient_id = [request.path_params[name] for name in ['patient_id']]
    async with pool().acquire() as conn:
         async with conn.transaction():
            sql = 'delete from m_patient where id = $1'
            await conn.execute(sql, patient_id)
            return JSONResponse({'count': 1})
         

async def stream_get_patient(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        id_quote = add_quote(id_)
        # Address
        contacts_agg = f'select json_agg(a.*) from m_address a where a.patient_id = pt.id'
        # Public Health Insurances
        publics_agg = f'select json_agg(p.*) from m_public_health_insurance p where p.insurance_id = ins.id'
        # Health Insurances publicInsurances
        insurances = f'select ins.*, ({publics_agg}) as public_insurances from m_health_insurance ins where ins.patient_id = pt.id'
        insurances_agg = f'select json_agg(c) from ({insurances}) c'
        # Patient
        patients = f'select pt.*, ({contacts_agg}) as contacts, ({insurances_agg}) as health_insurances from m_patient pt where pt.id = {id_quote}'
        patients_agg = f'select row_to_json(d) as patient from ({patients}) d'
        
        row = await conn.fetchrow(patients_agg)
        if not row:
            raise HTTPException(status_code=404, detail='Patient not found')
        result = json.loads(row.get('patient'))
        return JSONResponse(result)
