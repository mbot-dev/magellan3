import uuid
import pandas as pd
import simplejson as json
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse
from ..db.database import add_quote, insert
from ..util.tracer import get_logger, pretty_dumps

DEBUG = False

pivot_sql = """select m.id as id,
    m.fc_id as fc_id,
    m.pt_id as pt_id,
    m.sampling_date as sampling_date,
    m.lab_code as lab_code,
    t.test_code as test_code,
    t.test_name as test_name,
    t.result_value as result_value
    from (select id, fc_id, pt_id, sampling_date, lab_code 
    from m_lab_module where fc_id={} and pt_id={} order by sampling_date desc limit {} offset {}) m
    inner join m_lab_test t on t.module_id = m.id
"""

module_ql = """
    select row_to_json(a) as module from (
        select m.*,
        (select json_agg(i.*) from m_lab_test i where i.module_id = m.id) as test_items 
        from m_lab_module m where m.fc_id = {} and m.pt_id = {} order by m.sampling_date limit {} offset {}
    ) a
"""

stream_ql = """
    select row_to_json(a) as module from (
        select m.*,
        (select json_agg(i.*) from m_lab_test i where i.module_id = m.id) as test_items,
        ({}) as facility,
        ({}) as patient
        from m_lab_module m where m.id = {}
    ) a
"""

def get_pool(app):
    return app.state.magellan_pool

#---------------------------------------------------
async def get_shape(conn, fc_id: str, pt_id: str):
    cnt_sql = f'select count(1) from m_lab_module where fc_id = $1 and pt_id = $2'
    cnt = await conn.fetchval(cnt_sql, fc_id, pt_id)
    if not bool(cnt):
        return {'num_tests': 0}
    first_sql = f'select min(sampling_date) from m_lab_module where fc_id = $1 and pt_id = $2'
    first = await conn.fetchval(first_sql, fc_id, pt_id)
    last_sql = f'select max(sampling_date) from m_lab_module where fc_id = $1 and pt_id = $2'
    last = await conn.fetchval(last_sql, fc_id, pt_id)
    return {
        'num_tests': cnt,
        'first_test': first,
        'last_test': last
    }

async def get_lab_pivot(conn, fc_id, pt_id, limit, offset, dsc):
    sql = pivot_sql.format(add_quote(fc_id), add_quote(pt_id), limit, offset)
    rows = await conn.fetch(sql)
    df = pd.DataFrame(rows, columns=list(rows[0].keys()))  # Thanks
    if df is None or df.shape[0] == 0:
        return None
    
    """
    # df['result_value'] = df['result_value'].apply(pd.to_numeric, errors='coerce')
    """
    pivot = pd.pivot_table(df,
                        index=['lab_code', 'test_code', 'test_name'],  # No unit
                        columns='sampling_date',
                        values='result_value',
                        aggfunc='count',
                        fill_value=0)
    # to dict
    dic = pivot.reset_index().to_dict(orient='split')  # row, column ともにascされる
    rows = list()
    columns = dic['columns'][3:]
    columns.reverse()
    num_dates = len(columns)  # test_code test_name unit
    for row in dic.get('data'):
        row_list = list()
        lab_code = row[0]
        test_code = row[1]
        # rowHeader
        idx = {
            'lab_code': lab_code,
            'test_code': test_code,
            'test_name': row[2]
        }
        row_list.append(idx)
        # r[3]... -> c, c, c,... reverse
        if dsc:
            # Desc
            for i in range(3 + num_dates - 1, 2, -1):
                ent = {
                    'lab_code': lab_code,
                    'test_code': test_code,
                    'count': row[i]
                }
                row_list.append(ent)
        else:
            # ASC
            for i in range(3, 3 + num_dates):  # i=5..<num_dates
                ent = {
                    'lab_code': lab_code,
                    'test_code': test_code,
                    'count': row[i]
                }
                row_list.append(ent)

        rows.append(row_list)  # p -> [rowList], columns->[datetime]

    return columns, rows

async def get_lab_test_pivot(request):
    return JSONResponse(None)
    # pool = get_pool(request.app)
    # fc_id, pt_id, limit_str, offset_str, client_order = [request.query_params[name] for name in ['fc_id', 'pt_id', 'limit', 'offset', 'client_order']]
    # limit = int(limit_str)
    # offset = int(offset_str)
    # dsc = (client_order == 'desc')
    # result = dict()
    # async with pool().acquire() as conn:
    #     # offset = 0 -> count num test
    #     if offset == 0:
    #         shape = await get_shape(conn, fc_id, pt_id)
    #         num_tests = shape.get('num_tests')
    #         if num_tests == 0:
    #             return None
    #         result['shape'] = shape
    #         columns_rows = await get_lab_pivot(conn, fc_id, pt_id, num_tests, 0, dsc)
    #         result['columns'] = columns_rows[0]
    #         result['rows'] = columns_rows[1]
    #         if DEBUG: {
    #             get_logger(__name__).info(pretty_dumps(result))
    #         }

    #     # modules
    #     sql = module_ql.format(add_quote(fc_id), add_quote(pt_id), limit, offset)
    #     rows = await conn.fetch(sql)
    #     modules = [json.loads(row.get('module')) for row in rows] if rows is not None else []
    #     result['result_list'] = modules
    #     if DEBUG: {
    #         get_logger(__name__).info(pretty_dumps(result))
    #     }

    #     if not dsc:
    #         result['result_list'].reverse()
        
    #     return JSONResponse(result)

async def save_lab_test(request):
    pool = get_pool(request.app)
    module = await request.json()
    async with pool().acquire() as conn:
        async with conn.transaction():
            get_logger(__name__).debug(pretty_dumps(module))
            # facility_id = module.get('facility_id')
            fc_id = module.get('fc_id')  # not instituion replaced with facility_id on lab parser
            pt_id = module.get('pt_id')
            pt_gender = module.get('pt_gender')
            pt_dob = module.get('pt_dob')
            pt_kana = module.get('pt_kana')
            pt_name = module.get('pt_name')
            order_id = module.get('order_id')
            # is Patient exists
            ql_ = 'select p.* from m_patient p where p.facility_id = $1 and p.pt_id = $2';
            row = await conn.fetchrow(ql_, fc_id, pt_id)  # facility_id = fc_id
            if row is None:
                return {
                    'error': {
                        'status_code': 404, 
                        'detail': '該当患者無し'
                    }
                }
            # Compare data
            dic = dict(row)  # cast(rec)  asyncpg
            db_pt_id = dic.get('pt_id')
            db_name = dic.get('full_name')
            db_kana = dic.get('kana')
            db_dob = dic.get('dob')
            db_gender = dic.get('gender')
            # Same gender?
            if pt_gender is not None and db_gender != pt_gender:
                return {
                    'error': {
                        'status_code': 403, 
                        'detail': '/gender_unmatch'
                    }
                }
            # Same dob?
            if pt_dob is not None and db_dob != pt_dob:
                return {
                    'error': {
                        'status_code': 403, 
                        'detail': '/dob_unmatch'
                    }
                }
            # Same kana?
            if pt_kana is not None:
                kana_cmp = ''.join(db_kana.split())
                pt_kana_cmp = ''.join(pt_kana.split())
                if kana_cmp != pt_kana_cmp:
                    return {
                        'error': {
                            'status_code': 403, 
                            'detail': '/kana_unmatch'
                        }
                    }
            # Same name?
            if pt_name is not None:
                name_cmp = ''.join(db_name.split())
                pt_name_cmp = ''.join(pt_name.split())
                if name_cmp != pt_name_cmp:
                    return {
                        'error': {
                            'status_code': 403, 
                            'detail': '/name_unmatch'
                        }
                    }

            # 同じ order_id のレコードを削除する cascade  fc_id=facility_id
            delete_ql = 'delete from m_lab_module where fc_id = $1 and order_id = $2'
            await conn.execute(delete_ql, fc_id, order_id)
            # 登録する
            module['id'] = module.get('id', str(uuid.uuid4()))
            # Replace by db value
            # module['patient_id'] = db_id
            module['pt_id'] = db_pt_id
            module['pt_name'] = db_name
            module['pt_kana'] = db_kana
            module['pt_dob'] = db_dob
            module['pt_gender'] = db_gender
            await insert(conn, 'm_lab_module', module)

            for test_item in module.get('test_items'):
                test_item['id'] = test_item.get('id', str(uuid.uuid4()))
                test_item['pt_id'] = db_pt_id
                test_item['pt_name'] = db_name
                test_item['pt_kana'] = db_kana
                test_item['pt_dob'] = db_dob
                test_item['pt_gender'] = db_gender
                test_item['module_id'] = module.get('id')
                await insert(conn, 'm_lab_test', test_item)

            result = {'id': module.get('id')}
            if result.get('error') is not None:
                error = result.get('error')
                raise HTTPException(**error)
            
            return JSONResponse(result)

async def delete_lab_test(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        async with conn.transaction():
            sql = 'delete from m_lab_module where id = $1'
            await conn.execute(sql, id_)
            return JSONResponse({'cnt': 1})

async def get_abnormal_lab_test(request):
    pool = get_pool(request.app)
    id_ = request.query_params['module_id']
    async with pool().acquire() as conn:
        ql_ = 'select row_to_json(t.*) as test from m_lab_test t where t.module_id = $1 and t.abnormal_flg != $2 t.abnormal_flg != $3'
        rows = await conn.fetch(ql_, id_, '', 'N')
        return JSONResponse([json.loads(row.get('test')) for row in rows] if rows else [])

async def stream_get_test(request):
    pool = get_pool(request.app)
    id_ = request.path_params['id']
    async with pool().acquire() as conn:
        facility_agg = 'select row_to_json(f.*) from m_facility f where f.id = m.fc_id'
        patient_agg = 'select row_to_json(p.*) from m_patient p where p.facility_id = m.fc_id and p.pt_id = m.pt_id'
        ql_ = stream_ql.format(facility_agg, patient_agg, add_quote(id_))
        row = await conn.fetchrow(ql_)
        if not row:
            raise HTTPException(status_code=404, detail='Module not found')
        result = json.loads(row.get('module'))
        return JSONResponse(result)