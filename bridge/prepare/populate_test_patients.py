import random
import uuid
import csv
from datetime import datetime, date
import asyncio
import asyncpg
import json

def my_converter(o):
    if isinstance(o, date):
        return o.__str__()
    if isinstance(o, datetime):
        return o.__str__()


def pretty_dumps(payload):
    if isinstance(payload, dict) or isinstance(payload, list):
        return json.dumps(payload, indent=3, default=my_converter, ensure_ascii=False)
    if isinstance(payload, str):
        return payload
    return f'{payload}'


def random_dob():
    randomlist = random.sample(range(26, 70), 28)
    random_age = sorted(randomlist)
    print(random_age)
    ret = list()
    for age in random_age:
        arr = []
        year = 2022 - age
        arr.append(f'{year}')
        month = random.randint(1, 12)
        if month < 10:
            arr.append(f'0{month}')
        else:
            arr.append(f'{month}')
        date = random.randint(1, 28)
        if date < 10:
            arr.append(f'0{date}')
        else:
            arr.append(f'{date}')
        dob = '-'.join(arr)
        ret.append(dob)
        print(f'{dob}({age})')
    return ret


def random_zip_code():
    first = list()
    second = list()
    for i in range(3):
        n = random.randint(0, 9)
        first.append(f'{n}')
    for i in range(4):
        m = random.randint(0, 9)
        second.append(f'{m}')
    f_ = ''.join(first)
    s_ = ''.join(second)
    return f'{f_}-{s_}'


def random_telephone():
    first = list()
    second = list()
    third = list()
    for i in range(2):
        n = random.randint(0, 9)
        first.append(f'{n}')
    for i in range(3):
        m = random.randint(0, 9)
        second.append(f'{m}')
    for i in range(4):
        l = random.randint(0, 9)
        third.append(f'{l}')
    f_ = ''.join(first)
    s_ = ''.join(second)
    t_ = ''.join(third)
    return f'0{f_}-{s_}-{t_}'


def random_mobile():
    first = list()
    second = list()
    third = list()
    n = random.randint(7, 9)
    first.append(f'0{n}0')
    for i in range(4):
        m = random.randint(0, 9)
        second.append(f'{m}')
    for i in range(4):
        l = random.randint(0, 9)
        third.append(f'{l}')
    f_ = ''.join(first)
    s_ = ''.join(second)
    t_ = ''.join(third)
    return f'{f_}-{s_}-{t_}'



health_1 = {
    "combination_number": "0001",
    "non_display": "N",
    "provider_class": "060",
    "provider_number": "01130012",
    "provider_name": "協会けんぽ",
    "person_symbol": "３４５６１２３",
    "person_number": "１２",
    "person_assistance": "1",
    "relation_to_person": "1",
    "rate_out_patient": "0.3",
    "person_name": "",
    "start_date": "2022-03-20",
    "expired_date": "9999-12-31"
}

health_2 = {
    "combination_number": "0001",
    "non_display": "N",
    "provider_class": "060",
    "provider_number": "138075",
    "provider_name": "国保",
    "person_symbol": "１１１",
    "person_number": "２２２２２",
    "person_assistance": "3",
    "relation_to_person": "1",
    "rate_out_patient": "0.3",
    "person_name": "",
    "start_date": "2022-03-20",
    "expired_date": "9999-12-31"
}

health_3 = {
    "combination_number": "0001",
    "non_display": "N",
    "provider_class": "060",
    "provider_number": "34130013",
    "provider_name": "共済",
    "person_symbol": "１３４４",
    "person_number": "１２３４",
    "person_assistance": "1",
    "relation_to_person": "1",
    "rate_out_patient": "0.3",
    "person_name": "",
    "start_date": "2022-03-20",
    "expired_date": "9999-12-31"
}

his = [health_1, health_2, health_3]

def random_health():
    n = random.randint(0, 2)
    h = his[n]
    return {**h}


async def get_column_spec(conn, table):
    sql = 'select column_name, data_type from information_schema.columns where table_name = $1'
    rows = await conn.fetch(sql, table)
    return [(row.get('column_name'), row.get('data_type')) for row in rows]


async def insert(conn, table, obj):
    column_spec = await get_column_spec(conn, table)
    insert_list = list()
    dollar_list = list()
    values = list()
    index = 1;
    for spec in column_spec:
        # print(spec)
        cn = spec[0]  # column_name
        ct = spec[1]  # column_type
        value = obj.get(cn, None)
        
        if cn == 'group':
            insert_list.append(f'"{cn}"')
        else:
            insert_list.append(cn)

        dollar_list.append(f'${index}')  # $1,$2...

        if ct == 'integer':
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'bigint':
            values.append(int(value)) if value is not None else values.append(0)
        elif ct == 'double precision':
            values.append(float(value)) if value is not None else values.append(0)
        elif ct == 'boolean':
            values.append(bool(value)) if value is not None else values.append(False)
        elif ct.startswith('timestamp'):
            if value is None:
                values.append(datetime.now())
            elif isinstance(value, datetime):
                values.append(value)
            elif isinstance(value, str):
                values.append(datetime.strptime(value, '%Y-%m-%dT%H:%M:%S'))  # str to datetime
        else:
            # jsonb
            values.append(value) if value is not None else values.append('')  # empty ??
        index += 1

    inserts = ','.join(insert_list)
    dollars = ','.join(dollar_list)

    sql = f'insert into {table}({inserts}) values({dollars})'

    return await conn.execute(sql, *values)


def generate_patients(path):
    ret = list()
    dob_list = random_dob()
    with open(path, newline='', encoding='utf-8') as csv_file:
        read_csv = csv.reader(csv_file, delimiter=',')
        index = 0
        f_index = 1
        m_index = 2
        for row in read_csv:
            rec = dict()
            rec['id'] = str(uuid.uuid4())
            rec['full_name'] = row[0]
            rec['kana'] = row[1]
            rec['email'] = row[2]
            rec['gender'] = row[3]
            rec['mobile'] = random_mobile()
            if rec.get('gender') == 'F':
                rec['pt_id'] = f'test_0{f_index}' if f_index < 10 else f'test_{f_index}'
                f_index += 2
            else:
                rec['pt_id'] = f'test_0{m_index}' if m_index < 10 else f'test_{m_index}'
                m_index += 2
            rec['dob'] = dob_list[index]
            rec['facility_id'] = 'digital-users.dev'

            contact = dict()
            contact['id'] = str(uuid.uuid4())
            contact['zip_code'] = random_zip_code()
            contact['address'] = row[4]
            contact['telephone'] = random_telephone()
            contact['patient_id'] = rec.get('id')
            rec['contacts'] = list()
            rec.get('contacts').append(contact)

            his = random_health()
            his['id'] = str(uuid.uuid4())
            his['person_name'] = rec.get('full_name')
            his['patient_id'] = rec.get('id')
            rec['health_insurances'] = list()
            rec.get('health_insurances').append(his)
        
            ret.append(rec)
            index += 1

    print(pretty_dumps(ret))
    return ret


async def main(path, dsn):
    patients = generate_patients(path)
    conn = await asyncpg.connect(dsn)
    async with conn.transaction():
        for pt in patients:
            await insert(conn, 'test_patient', pt)
            for c in pt.get('contacts'):
                await insert(conn, 'test_address', c)
            for h in pt.get('health_insurances'):
                await insert(conn, 'test_health_insurance', h)
    await conn.close()


if __name__ == "__main__":
    path = 'test_patient.csv'
    dsn = "postgresql://large:large_user@large:5432/large"
    asyncio.get_event_loop().run_until_complete(main(path, dsn))
