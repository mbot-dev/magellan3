import os
from datetime import datetime
import uuid
from starlette.responses import JSONResponse
import httpx
import simplejson as json
from ..db.database import add_quote, update_by_id, insert
from ..util.tracer import get_logger, pretty_dumps

TBL_PATIENT = "m_patient"
TBL_ADDRESS = "m_address"
TBL_INSURANCE = "m_health_insurance"
TBL_PUBLIC = "m_public_health_insurance"
TBL_VISIT = "m_patient_visit"

ATTR_CONTACTS = "contacts"
ATTR_INSURANCES = "health_insurances"
ATTR_PUBLICS = "public_insurances"

DEVELOP = True


def patient_ql(table, facility_id, name, sex1, birthdate):
    return f"""
        select id from {table} where facility_id = {facility_id} and full_name = {name} and gender = {sex1} and dob = {birthdate}
    """


def his_ql(
    table,
    insurer_number,
    insured_card_symbol,
    insured_identification_number,
    insured_branch_number,
    birthdate,
    patient_id,
):
    return f"""
        select h.id from {table} h 
            where h.insurer_number = {insurer_number} 
            and h.insured_card_symbol = {insured_card_symbol} 
            and h.insured_identification_number = {insured_identification_number} 
            and h.insured_branch_number = {insured_branch_number} 
            and h.birthdate = {birthdate} 
            and h.patient_id = {patient_id}
    """


def pvt_ql(sql, facility_id, pvt_date, limit, offset):
    return f"""
        select row_to_json(a) as record from (
            select pvt.*, ({sql}) as patient from m_patient_visit pvt 
            where pvt.facility_id = {facility_id} and pvt.pvt_date_time ~ {pvt_date} 
            order by pvt.pvt_date_time limit {limit} offset {offset}
        ) a
    """


def pt_num_ql(facility_id):
    return f"""
        select num_digits, curr_num from m_pt_number where facility_id = {facility_id}
    """


def add_zero(number, length):
    return str(number).zfill(length)


def get_pool(app):
    return app.state.magellan_pool


def new_uuid():
    return str(uuid.uuid4())


async def nextPtNumber(conn, facility_id):
    sql = pt_num_ql(add_quote(facility_id))
    row = await conn.fetchrow(sql)
    if row:
        num_digits = row["num_digits"]
        curr_num = row["curr_num"]
        next_num = curr_num + 1
        sql = "update m_pt_number set curr_num = $1 where facility_id = $2"
        await conn.execute(sql, next_num, facility_id)
        return add_zero(next_num, num_digits)
    else:
        num_digits = 6
        curr_num = 1
        sql = "insert into m_pt_number (facility_id, num_digits, curr_num) values ($1, $2, $3)"
        await conn.execute(sql, facility_id, num_digits, curr_num)
        return add_zero(curr_num, num_digits)


async def get_lock(request):
    pool = get_pool(request.app)
    facility_id, user_name, pvt_id = [
        request.query_params[name] for name in ["facility_id", "user_name", "pvt_id"]
    ]
    async with pool().acquire() as conn:
        # For developping
        if DEVELOP:
            sql = "update m_patient_visit set locked_by = $1 where id = $2"
            await conn.execute(sql, user_name, pvt_id)
            await send_pvt_event(facility_id, pvt_id)
            return JSONResponse({"lock": True})

        sql = "select locked_by from m_patient_visit where id = $1"
        lock = await conn.fetchval(sql, pvt_id)
        if lock != "":
            return JSONResponse({"lock": False})
        sql = "update m_patient_visit set locked_by = $1 where id = $2"
        await conn.execute(sql, user_name, pvt_id)
        await send_pvt_event(facility_id, pvt_id)
        return JSONResponse({"lock": True})


# ---------------------------------------------------
async def get(request):
    pool = get_pool(request.app)
    facility_id, pvt_date, limit, offset = [
        request.query_params[name]
        for name in ["facility_id", "pvt_date", "limit", "offset"]
    ]
    async with pool().acquire() as conn:
        # Address
        contacts = f"select ma.* from {TBL_ADDRESS} ma where ma.patient_id = pt.id"
        contacts_agg = f"select json_agg(a) from ({contacts}) a"
        # Public Health Insurances
        publics = f"select mp.* from {TBL_PUBLIC} mp where mp.insurance_id = mi.id"
        publics_agg = f"select json_agg(b) from ({publics}) b"
        # Health Insurances
        insurances = f"select mi.*, ({publics_agg}) as public_insurances from {TBL_INSURANCE} mi where mi.patient_id = pt.id"
        insurances_agg = f"select json_agg(c) from ({insurances}) c"
        # Patient
        patient = f"select pt.*, ({contacts_agg}) as contacts, ({insurances_agg}) as health_insurances from {TBL_PATIENT} pt where pt.id = pvt.patient_id"
        patient_agg = f"select row_to_json(d) as patient from ({patient}) d"
        # Visit
        sql = pvt_ql(
            patient_agg,
            add_quote(facility_id),
            add_quote(f"^{pvt_date}"),
            int(limit),
            int(offset),
        )

        rows = await conn.fetch(sql)
        pvt = [json.loads(row.get("record")) for row in rows] if rows else []
        # get_logger(__name__).info(pretty_dumps(pvt))
        return JSONResponse(pvt)


async def post(request):
    pool = get_pool(request.app)
    visit = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(visit))
            # Check if patient exist
            facility_id = add_quote(visit.get("facility_id"))
            pt_id = add_quote(visit.get("patient").get("pt_id"))  # karte no.
            # facility_id & pt_id(KarteNo) -> fetch patient uuid
            sql = f"select p.id from {TBL_PATIENT} p where p.facility_id = {facility_id} and p.pt_id = {pt_id}"
            id_ = await conn.fetchval(sql)
            # New Patient
            if id_ is None:
                # Save patient   visit.patient
                patient = visit.get("patient")
                patient["id"] = str(uuid.uuid4())  # numbering
                await insert(conn, TBL_PATIENT, patient)
                # Addrss
                if bool(patient.get(ATTR_CONTACTS)):
                    for c in patient.get(ATTR_CONTACTS):
                        c["id"] = str(uuid.uuid4())
                        c["patient_id"] = patient.get("id")
                        await insert(conn, TBL_ADDRESS, c)
                # Health insurances
                if bool(patient.get(ATTR_INSURANCES)):
                    for ins in patient.get(ATTR_INSURANCES):
                        ins["id"] = str(uuid.uuid4())
                        ins["patient_id"] = patient.get("id")
                        await insert(conn, TBL_INSURANCE, ins)
                        # Public insurances
                        if bool(ins.get(ATTR_PUBLICS)):
                            for p in ins.get(ATTR_PUBLICS):
                                p["id"] = str(uuid.uuid4())
                                p["insurance_id"] = ins.get("id")
                                await insert(conn, TBL_PUBLIC, p)
                visit["patient_id"] = patient.get("id")
            else:
                visit["patient_id"] = id_
            # Save visit
            await insert(conn, TBL_VISIT, visit)
            # Send event
            await send_pvt_event(visit.get("facility_id"), visit.get("id"))
            return JSONResponse({"id": visit.get("id")})


async def put(request):
    pool = get_pool(request.app)
    obj = await request.json()
    facility_id = obj.pop("facility_id")
    pvt_id = obj.pop("pvt_id")
    async with pool().acquire() as conn:
        async with conn.transaction():
            await update_by_id(conn, "m_patient_visit", pvt_id, obj)
            await send_pvt_event(facility_id, pvt_id)
            return JSONResponse({"count": 1})


async def delete(request):
    pool = get_pool(request.app)
    facility_id = request.path_params["fc_id"]
    pvt_id = request.path_params["pvt_id"]
    async with pool().acquire() as conn:
        async with conn.transaction():
            sql = "delete from m_patient_visit where id = $1"
            await conn.execute(sql, pvt_id)
            await send_pvt_event(facility_id, pvt_id)
            return JSONResponse({"count": 1})


# ---------------------------------------------------
# Face
# ---------------------------------------------------
def dob_from_oqs(birthdate):
    if not birthdate:
        return None
    dob = birthdate.replace("-", "")  # normalize onence
    return f"{dob[0:4]}-{dob[4:6]}-{dob[6:8]}"  # oqs to magellan


async def get_oqs_patient(conn, payload):
    # Search Patient
    facility_id, name, sex1, birthdate = [
        payload.get(k) for k in ["facility_id", "name", "sex1", "birthdate"]
    ]
    sql = patient_ql(
        TBL_PATIENT,
        add_quote(facility_id),
        add_quote(name),
        add_quote(sex1),
        add_quote(dob_from_oqs(birthdate)),
    )
    return await conn.fetchval(sql)


async def save_oqs_patient(conn, payload):
    # Save Patient
    facility_id, name, sex1, birthdate = [
        payload.get(k) for k in ["facility_id", "name", "sex1", "birthdate"]
    ]
    patient_id = new_uuid()
    pt_num = await nextPtNumber(conn, facility_id)  # 患者番号発番
    is_valid = payload.get("qualification_validity") == "1"
    new_pt = {
        "id": patient_id,
        "facility_id": facility_id,
        "pt_id": pt_num,  # 患者番号発番
        "full_name": name,
        "name_of_other": payload.get("name_of_other"),
        "kana": payload.get("name_kana"),
        "name_of_other_kana": payload.get("name_of_other_kana"),
        "gender": sex1,
        "sex2": payload.get("sex2"),
        "dob": dob_from_oqs(birthdate),
        "status": "F" if is_valid else "P",  # P: Pending
    }
    new_address = {
        "id": new_uuid(),
        "patient_id": patient_id,
        "address": payload.get("address"),
        "zip_code": payload.get("post_number"),
    }
    await insert(conn, TBL_PATIENT, new_pt)
    await insert(conn, TBL_ADDRESS, new_address)
    return patient_id


async def get_oqs_his(conn, payload, patient_id):
    # Search His
    (
        insurer_number,
        insured_card_symbol,
        insured_identification_number,
        insured_branch_number,
        birthdate,
    ) = [
        payload.get(k)
        for k in [
            "insurer_number",
            "insured_card_symbol",
            "insured_identification_number",
            "insured_branch_number",
            "birthdate",
        ]
    ]
    sql = his_ql(
        TBL_INSURANCE,
        add_quote(insurer_number),
        add_quote(insured_card_symbol),
        add_quote(insured_identification_number),
        add_quote(insured_branch_number),
        add_quote(birthdate),
        add_quote(patient_id),
    )
    return await conn.fetchval(sql)


async def save_oqs_his(conn, payload, patient_id):
    # Set status outdate current his  ToDo in case not exist his
    sql = f"update {TBL_INSURANCE} set out_date = $1 where patient_id = $2"
    await conn.execute(sql, True, patient_id)
    # Save New His
    his_id = new_uuid()
    payload["id"] = his_id  # his id
    payload["patient_id"] = patient_id  # relation
    payload["out_date"] = False
    await insert(conn, TBL_INSURANCE, payload)
    return his_id


async def post_face(request):
    """
    保険証が有効でない場合の処理
    新規患者の場合: 患者情報、保険情報、住所情報を登録する
    既存患者の場合: 該当保険証を更新する
    来院情報: status=pending で登録
    PVT の検索: 患者、住所、保険証の join
    受付業務: キャンセル、10割負担、貸し などの処理
    """
    pool = request.app.state.magellan_pool
    payload = await request.json()
    get_logger(__name__).info(pretty_dumps(payload, "Face Data"))

    async with pool().acquire() as conn:
        visit = dict()
        visit["id"] = new_uuid()
        visit["qualification_validity"] = payload.get("qualification_validity")
        visit["status"] = (
            "waiting" if visit.get("qualification_validity") == "1" else "pending"
        )

        visit["new_patient"] = False
        visit["new_his"] = False

        patient_id = await get_oqs_patient(conn, payload)
        if patient_id:
            visit["patient_id"] = patient_id
        else:
            patient_id = await save_oqs_patient(conn, payload)
            visit["patient_id"] = patient_id
            visit["new_patient"] = True

        his_id = await get_oqs_his(conn, payload, patient_id)
        if his_id:
            visit["his_id"] = his_id
        else:
            his_id = await save_oqs_his(conn, payload, patient_id)
            visit["his_id"] = his_id
            visit["new_his"] = True

        now = datetime.now()
        visit["facility_id"] = payload.get("facility_id")  # facility_id
        visit["patient_id"] = patient_id  # patient_id
        visit["pvt_date_time"] = now.strftime("%Y-%m-%dT%H:%M:%S%z")
        visit["full_name"] = payload.get("name")
        visit["kana"] = payload.get("name_kana")
        visit["gender"] = payload.get("sex1")
        visit["dob"] = dob_from_oqs(payload.get("birthdate"))
        visit["his_id"] = his_id
        visit["his_provider_name"] = payload.get("insurer_name")
        visit["qualification_confirmation_date"] = payload.get(
            "qualification_confirmation_date"
        )  # 資格確認日
        await insert(conn, TBL_VISIT, visit)

    # Send event
    await send_pvt_event(visit.get("facility_id"), visit.get("id"))
    return JSONResponse({"count": 1})


async def put_face(request):
    obj = await request.json()
    facility_id = obj.pop("facility_id")
    pvt_id = obj.pop("pvt_id")
    get_logger(__name__).info(pretty_dumps(obj, "Face Data"))
    await send_pvt_event(facility_id, pvt_id)
    return JSONResponse({"count": 1})


# -----------------------------------------------------------------
# Background task to end streaming server event
# -----------------------------------------------------------------
async def send_pvt_event(facility_id, pvt_id):
    event_data = {
        "channel": f"pvt-{facility_id}",
        "event": "magellan:pvt-update",
        "data": {"type": "pvt", "pvt_id": pvt_id},
    }
    topic_url = os.getenv("URL_FOR_PUSH_TOPIC")
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        await client.post(topic_url, json=event_data, headers=headers)
