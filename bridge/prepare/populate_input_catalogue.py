import uuid
from datetime import datetime
import asyncio
import asyncpg

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


GROUP_DIAGNOSIS = '000'  # 病名
GROUP_FIRST_VISIT = '110'  # 初診
GROUP_FOLLOW_UP_VISIT = '120'  # 再診
# 拡張
GROUP_VITAL_SIGN = 'A100'  # バイタルサイン
GROUP_PHYSICAL_EXAM = 'A200'  # 身体所見
GROUP_PHOTO = 'B100'  # 写真
GROUP_SCHEMA = 'B200'  # シェーマ
GROUP_REF_IMAGE = 'Z100'  # 画像ファイル
GROUP_PDF = 'Z110'  # PDFファイル
# 以下テスト
GROUP_BLOOD_SUGAR_LEVEL = 'C100'
GROUP_DIABETES = 'C110'
GROUP_BONE_DENSITY = 'D100'
GROUP_SMI = 'D110'
GROUP_LCS = 'D120'
GROUP_QOL = 'E100'
# Category
CATEGORY_DEFAULT = 'default'

BODY_TEMPERATURE = {
    'name': '体温',
    'entity': 'bodyTemperature',
    'entity_order': 0,
    'category': CATEGORY_DEFAULT,
    'group': GROUP_VITAL_SIGN,
    'quantity': '1',
    'unit': '',
    'mandatory': '0',
    'items': '体温',
    'claim_items': [
        {'code': 'j100001', 'name': '体温', 'unit': '°C', 'value_type': 'float', 'frac_digits': 1}
    ]
}

BLOOD_PRESSURE = {
    'name': '血圧',
    'entity': 'bloodPressure',
    'entity_order': 1,
    'category': CATEGORY_DEFAULT,
    'group': GROUP_VITAL_SIGN,
    'quantity': '1',
    'unit': '',
    'mandatory': '0 1',
    'items': '最高血圧 最低血圧',
    'claim_items': [
        {'code': 'j100002', 'name': '血圧（最高）', 'unit': 'mmHg', 'value_type': 'int'},
        {'code': 'j100003', 'name': '血圧（最低）', 'unit': 'mmHg', 'value_type': 'int'}
    ]
}

SPO2 = {
    'name': 'SPO2',
    'entity': 'spo2',
    'entity_order': 2,
    'category': GROUP_VITAL_SIGN,
    'group': GROUP_VITAL_SIGN,
    'quantity': '1',
    'unit': '',
    'mandatory': '0',
    'items': 'SPO2',
    'claim_items': [
        {'code': 'j100004', 'name': 'SPO2', 'unit': '%', 'value_type': 'int'}
    ]
}

VITAL_SIGN = {
    'name': 'バイタルサイン（セット）',
    'entity': 'vitalSign',
    'entity_order': 3,
    'category': GROUP_VITAL_SIGN,
    'group': GROUP_VITAL_SIGN,
    'quantity': '1',
    'unit': '',
    'mandatory': '1 2',
    'items': '体温 血圧 SPO2',
    'claim_items': [
        {'code': 'j100001', 'name': '体温', 'unit': '°C', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j100002', 'name': '血圧（最高）', 'unit': 'mmHg', 'value_type': 'int'},
        {'code': 'j100003', 'name': '血圧（最低）', 'unit': 'mmHg', 'value_type': 'int'},
        {'code': 'j100004', 'name': 'SPO2', 'unit': '%', 'value_type': 'int'}
    ]
}

BODY_WEIGHT = {
    'name': '体重',
    'entity': 'bodyWeight',
    'entity_order': 4,
    'category': CATEGORY_DEFAULT,
    'group': GROUP_PHYSICAL_EXAM,
    'quantity': '1',
    'unit': '',
    'mandatory': '0',
    'items': '体重',
    'claim_items': [
        {'code': 'j200002', 'name': '体重', 'unit': 'kg', 'value_type': 'float', 'frac_digits': 1}
    ]
}

HEIGHT_WEIGHT = {
    'name': '身長・体重・BMI',
    'entity': 'physicalExam',
    'entity_order': 5,
    'category': GROUP_PHYSICAL_EXAM,
    'group': GROUP_PHYSICAL_EXAM,
    'quantity': '1',
    'unit': '',
    'mandatory': '0 1',
    'items': '身長 体重 BMI（自動計算）',
    'claim_items': [
        {'code': 'j200001', 'name': '身長', 'unit': 'cm', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j200002', 'name': '体重', 'unit': 'kg', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j200003', 'name': 'BMI', 'unit': '', 'value_type': 'float', 'frac_digits': 2, 'equation': 'bmi', 'equation_params': '0 1', 'eval_func': 'bmiCategory', 'eval_params': '2'}
    ]
}

SMART_SHOT = {
    'name': '写真',
    'category': CATEGORY_DEFAULT,
    'group': GROUP_PHOTO,
    'entity': 'smartShot',
    'entity_order': 6,
    'items': 'カメラ撮影画像',
}

SCHEMA = {
    'name': 'シェーマ参考図',
    'category': GROUP_SCHEMA,
    'group': GROUP_SCHEMA,
    'entity': 'schema',
    'entity_order': 7,
    'items': 'シェーマ挿入',
}

IMAGE_FILE = {
    'name': '画像ファイル',
    'category': CATEGORY_DEFAULT,
    'group': GROUP_REF_IMAGE,
    'entity': 'imageFile',
    'entity_order': 8,
    'items': '画像ファイル添付',
}

PDF = {
    'name': 'PDFファイル',
    'category': CATEGORY_DEFAULT,
    'group': GROUP_PDF,
    'entity': 'pdf',
    'entity_order': 9,
    'items': 'PDFファイル添付',
}

BLOOD_SUGAR_LEVEL = {
    'name': '血糖値',
    'entity': 'bloodSugarLevel',
    'category': GROUP_BLOOD_SUGAR_LEVEL,
    'group': GROUP_BLOOD_SUGAR_LEVEL,
    'quantity': '1',
    'entity_order': 10,
    'unit': '',
    'mandatory': '0 1 2',
    'items': '血糖値',
    'claim_items': [
        {'code': 'j400001', 'name': '空腹時血糖値', 'unit': 'mg/dL', 'value_type': 'int'},
        {'code': 'j400002', 'name': '随時血糖値', 'unit': 'mg/dL', 'value_type': 'int'},
        {'code': 'j400003', 'name': '75gブドウ糖負荷試験', 'unit': 'mg/dL', 'value_type': 'int'}
    ]
}

DIABETES_INDEX = {
    'name': '糖尿病指標',
    'entity': 'diabetes',
    'entity_order': 11,
    'category': GROUP_DIABETES,
    'group': GROUP_DIABETES,
    'quantity': '1',
    'unit': '',
    'mandatory': '0 1 2',
    'items': 'HbA1ｃ GA 1,5-AG 尿糖値',
    'claim_items': [
        {'code': 'j410001', 'name': 'HbA1ｃ', 'unit': '%', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j410002', 'name': 'GA', 'unit': '%', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j410003', 'name': '1,5-AG', 'unit': 'μg/mL', 'value_type': 'float', 'frac_digits': 1},
        {'code': 'j410004', 'name': '尿糖値', 'unit': 'mg/dL', 'value_type': 'int'}
    ]
}

BONE_DENSITY = {
    'name': '骨密度',
    'entity': 'boneDensity',
    'entity_order': 12,
    'category': GROUP_BONE_DENSITY,
    'group': GROUP_BONE_DENSITY,
    'quantity': '1',
    'unit': '',
    'mandatory': '0',
    'items': 'DXAまたはQUS',
    'claim_items': [
        {'code': 'j500001', 'name': '骨密度DXA', 'unit': '%YAM', 'value_type': 'int'},
        {'code': 'j500002', 'name': '骨密度QUS', 'unit': '%YAM', 'value_type': 'int'}
    ]
}

LCS = {
    'name': '下肢筋力',
    'entity': 'lcs',
    'entity_order': 13,
    'category': GROUP_LCS,
    'group': GROUP_LCS,
    'quantity': '1',
    'unit': '',
    'mandatory': '0 1',
    'items': '左右の下肢筋力',
    'claim_items': [
        {'code': 'j520001', 'name': '下肢筋力右脚', 'unit': 'N', 'value_type': 'int'},
        {'code': 'j520002', 'name': '下肢筋力左脚', 'unit': 'N', 'value_type': 'int'}
    ]
}


async def main(dsn):
    inputs = list()
    inputs.append(BODY_TEMPERATURE)
    inputs.append(BLOOD_PRESSURE)
    inputs.append(SPO2)
    inputs.append(VITAL_SIGN)
    inputs.append(BODY_WEIGHT)
    inputs.append(HEIGHT_WEIGHT)
    inputs.append(SMART_SHOT)
    inputs.append(SCHEMA)
    inputs.append(IMAGE_FILE)
    inputs.append(PDF)
    inputs.append(BLOOD_SUGAR_LEVEL)
    inputs.append(DIABETES_INDEX)
    inputs.append(BONE_DENSITY)
    inputs.append(LCS)

    conn = await asyncpg.connect(dsn)
    async with conn.transaction():

        for inp in inputs:
            inp['id'] = str(uuid.uuid4())
            await insert(conn, 'input_catalogue', inp)
            items = inp.get('claim_items', [])
            for it in items:
                it['id'] = str(uuid.uuid4())
                it['input_catalog_id'] = inp.get('id')
                await insert(conn, 'input_item', it)
    
    await conn.close()


if __name__ == "__main__":
    dsn = "postgresql://large:large_user@large:5432/large"
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main(dsn))
    except KeyboardInterrupt:
        pass
    

