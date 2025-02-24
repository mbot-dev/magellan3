from datetime import datetime
import simplejson as json
from ..util import conv
from ..util.tracer import get_logger, pretty_dumps;

##################
# NO More Repeat
##################

DEBUG = False

def print_rows(rows):
    if DEBUG:
        for row in rows:
            print(row)

async def fetch_all_as_json(conn, sql):
    ql_ = f'select row_to_json(t) as master from ({sql}) t'
    get_logger(__name__).debug(sql)
    rows = await conn.fetch(ql_)
    result = [json.loads(row.get('master')) for row in rows] if rows else []
    get_logger(__name__).debug(pretty_dumps(result))
    return result

def now_as_yukoymd():
    now = datetime.now()
    return now.strftime('%Y%m%d')

def add_quote(string):
    return f'\'{string}\''

async def find_desease_by_name(pool, name):
    async with pool().acquire() as conn:
        now = now_as_yukoymd()
        sql = """select 
                    col_01 as update_flg, 
                    code, 
                    change_to, 
                    name, 
                    icd_10_1_2013, 
                    icd_10_2_2013, 
                    single_use, 
                    tokutei_shikkan, 
                    discontinued_at 
                from master_disease where name ~ {} and discontinued_at >= {}
            """.format(add_quote(name), add_quote(now))
        return await fetch_all_as_json(conn, sql)

async def find_desease_modifier(pool, name):
    async with pool().acquire() as conn:
        now = now_as_yukoymd()
        sql = """select 
                    col_01 as update_flg, 
                    code, name, 
                    discontinued_at from master_modifier 
                where name ~ {} and discontinued_at >= {}
                """.format(add_quote(name), add_quote(now))
        return await fetch_all_as_json(conn, sql)

async def find_desease_by_icd10(pool, name):
    async with pool().acquire() as conn:
        now = now_as_yukoymd()
        icd10 = f'^{name}'
        sql = """select 
                    col_01 as update_flg, 
                    code, 
                    change_to, 
                    name, 
                    icd_10_1_2013, 
                    icd_10_2_2013, 
                    single_use, 
                    tokutei_shikkan, 
                    discontinued_at from master_disease 
                where icd_10_1_2013 ~ {} and discontinued_at >= {}
                """.format(add_quote(icd10), add_quote(now))
        return await fetch_all_as_json(conn, sql)

async def find_procedures_by_kbn_kbnno(pool, kbn, kbn_start, kbn_end):
    """点数区分と区分番号で検索する　(A ~ N, 001 ..)"""
    async with pool().acquire() as conn:
        now = now_as_yukoymd()
        sql = """select col_001,code,name,unit_code,unit,tensu_type,tensu,in_out_flg,claim_class,
        col_016,
        hosp_clinic_flg,
        col_020,
        col_030,
        col_038,
        col_039,
        col_046,
        col_047,
        col_050,
        col_051,
        col_052,
        col_053,
        col_054,
        col_055,
        col_056,
        col_063,
        col_064,
        col_067,
        col_068,
        col_082,
        tensu_kbn,kbn_no,kbn_eda,discontinued_at,
        col_114,
        col_115,
        col_116,
        col_119,
        col_121,
        col_122 
        from master_procedure 
        where tensu_kbn = {} and (kbn_no between {} and {}) and discontinued_at >= {} order by tensu_kbn, kbn_no, kbn_eda, code
        """.format(add_quote(kbn), add_quote(kbn_start), add_quote(kbn_end), add_quote(now))
        return await fetch_all_as_json(conn, sql)
    
# Text search Procedure
async def find_procedure_by_name(pool, name):
    async with pool().acquire() as conn:
        keyword = conv.to_medicine_keyword(name)
        now = now_as_yukoymd()
        sql = """select col_001,code,name,unit_code,unit,tensu_type,tensu,in_out_flg,claim_class,col_016,hosp_clinic_flg,
        col_020,col_030,col_038,col_039,col_046,col_047,col_052,col_053,col_054,col_055,col_056,col_063,col_064,col_067,col_068,
        col_082,tensu_kbn,kbn_no,kbn_eda,discontinued_at,col_114,col_115,col_116,col_119,col_121,col_122 
        from master_procedure 
        where name ~ {} and discontinued_at >= {} order by tensu_kbn, kbn_no, kbn_eda, code
        """.format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)

# Medicine
# 向精神薬 psychotropic drug 
async def find_medicine_by_name(pool, name):
    async with pool().acquire() as conn:
        keyword = name # conv.to_medicine_keyword(name)
        now = now_as_yukoymd()
        sql = """select col_01 as update_flg,code,name,unit_code,unit,tensu_type,tensu,koseishin,dose_type,yj_code,discontinued_at 
        from  master_medicine 
        where name ~ {} and discontinued_at >= {} order by code
        """.format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)

# Constrast medium   
async def list_contrast_medium(pool):
    async with pool().acquire() as conn:
        now = now_as_yukoymd()
        sql = """select col_01 as update_flg,code,name,unit_code,unit,tensu_type,tensu,koseishin,col_20 as contrast, dose_type,yj_code,discontinued_at 
        from  master_medicine 
        where col_20 != {} and discontinued_at >= {} order by code
        """.format(add_quote('0'), add_quote(now))
        return await fetch_all_as_json(conn, sql)

# Tool
async def find_tool_by_name(pool, name):
    async with pool().acquire() as conn:
        keyword = name # conv.to_medicine_keyword(name)
        now = now_as_yukoymd()
        sql = """select col_01 as update_flg,code,name,col_08 as unit_code,unit,tensu_type,tensu,discontinued_at 
        from master_tool 
        where name ~ {} and discontinued_at >= {} order by code
        """.format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)
    
# Procedure, Medicine, Tool
async def find_master_by_name(pool, name):
    async with pool().acquire() as conn:
        keyword = add_quote(conv.to_medicine_keyword(name))   # add_quote(name) why?
        now = add_quote(now_as_yukoymd())
        ret = []

        sql_proc = 'select col_001 as update_flg, code, name, unit_code, unit, tensu_type, tensu, in_out_flg, hosp_clinic_flg, claim_class, col_068, tensu_kbn, kbn_no, discontinued_at from master_procedure where name ~ {} and discontinued_at >= {} order by code'\
            .format(keyword, now)
        proc_rows = await fetch_all_as_json(conn, sql_proc)
        ret.extend(proc_rows)

        sql_med = 'select col_01 as update_flg, code, name, unit_code, unit, tensu_type, tensu, koseishin, dose_type, yj_code, discontinued_at from  master_medicine where name ~ {} and discontinued_at >= {} order by code'\
            .format(keyword, now)
        med_rows = await fetch_all_as_json(conn, sql_med)
        ret.extend(med_rows)

        sql_tool = 'select col_01 as update_flg, code, name, unit_code, unit, tensu_type, tensu, discontinued_at from master_tool where name ~ {} and discontinued_at >= {} order by code'\
            .format(keyword, now)
        tool_rows = await fetch_all_as_json(conn, sql_tool)
        ret.extend(tool_rows)

        return ret
    
async def find_master_by_code(pool, code):
    async with pool().acquire() as conn:
        keyword = add_quote(f'^{code}')
        now = add_quote(now_as_yukoymd())
        ret = []

        if code.startswith('1'):
            sql_proc = 'select col_001 as update_flg, code, name, unit_code, unit, tensu_type, tensu, in_out_flg, hosp_clinic_flg, claim_class, col_068, tensu_kbn, kbn_no, discontinued_at from master_procedure where code ~ {} and discontinued_at >= {} order by code'\
                .format(keyword, now)
            proc_rows = await fetch_all_as_json(conn, sql_proc)
            ret.extend(proc_rows)

        elif code.startswith('6'):
            sql_med = 'select col_01 as update_flg, code, name, unit_code, unit, tensu_type, tensu, dose_type, yj_code, discontinued_at from  master_medicine where code ~ {} and discontinued_at >= {} order by code'\
                .format(keyword, now)
            med_rows = await fetch_all_as_json(conn, sql_med)
            ret.extend(med_rows)

        elif code.startswith('7'):
            sql_tool = 'select col_01 as update_flg, code, name, unit_code, unit, tensu_type, tensu, discontinued_at from master_tool where code ~ {} and discontinued_at >= {} order by code'\
                .format(keyword, now)
            tool_rows = await fetch_all_as_json(conn, sql_tool)
            ret.extend(tool_rows)

        return ret

# Dose
async def find_admin_by_name(pool, name):
    get_logger(__name__).debug(name);
    async with pool().acquire() as conn:
        keyword = name # conv.to_medicine_keyword(name)
        # print(keyword)
        now = now_as_yukoymd()
        sql = 'select * from master_administration where name ~ {} and discontinued_at >= {} order by code'\
            .format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)
    
# Comment
async def find_comment_by_name(pool, name):
    get_logger(__name__).debug(name);
    async with pool().acquire() as conn:
        keyword = name # conv.to_medicine_keyword(name)
        # print(keyword)
        now = now_as_yukoymd()
        sql = 'select * from master_comment where name ~ {} and discontinued_at >= {} order by code'\
            .format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)

async def find_comment_by_code(pool, code):
    get_logger(__name__).debug(code);
    async with pool().acquire() as conn:
        keyword = f'^{code}'
        # print(keyword)
        now = now_as_yukoymd()
        sql = 'select * from master_comment where code ~ {} and discontinued_at >= {} order by code'\
            .format(add_quote(keyword), add_quote(now))
        return await fetch_all_as_json(conn, sql)

async def find_address_by_zip_code(pool, zip_code):
    async with pool().acquire() as conn:
        sql = 'select * from tbl_zip_code where zip_code = {}'.format(add_quote(zip_code))
        res = await fetch_all_as_json(conn, sql)
        if not res:
            return {}
        address = res[0]
        prefecture = address.get('prefecture')
        prefecture = prefecture.replace('県', '').replace('府', '').replace('都', '')
        prefecture = f'^{prefecture}'
        sql2 = 'select code from tbl_prefecture_code where name ~ {}'.format(add_quote(prefecture))
        code = await fetch_all_as_json(conn, sql2)
        address['prefecture_code'] = code[0].get('code')
        return address

async def list_all_depts(pool):
    async with pool().acquire() as conn:
        sql = 'select * from tbl_dept_code order by code'
        return await fetch_all_as_json(conn, sql)

#--------------------------------------------------
# Yoho Naihuku
#--------------------------------------------------
async def find_yoho_naihuku_code_name(pool, admin_code, name):
    async with pool().acquire() as conn:
        sql = 'select * from master_administration where admin_code = {} and name ~ {} order by code'\
            .format(add_quote(admin_code), add_quote(name))
        return await fetch_all_as_json(conn, sql)

async def find_yoho_naihuku_code_timing(pool, admin_code, timing_code):
    async with pool().acquire() as conn:
        sql = 'select * from master_administration where admin_code = {} and timing_code = {} order by code'\
            .format(add_quote(admin_code), add_quote(timing_code))
        return await fetch_all_as_json(conn, sql)
    
async def find_yoho_gaiyo_code_detail(pool, admin_code, detail_code):
    async with pool().acquire() as conn:
        sql = 'select * from master_administration where admin_code = {} and detail_code = {} order by code'\
            .format(add_quote(admin_code), add_quote(detail_code))
        return await fetch_all_as_json(conn, sql)

# Short name
async def list_short_name(pool):
    async with pool().acquire() as conn:
        sql = 'select seq, short_name, apply_to, auto_flg from tbl_short_name order by seq'
        return await fetch_all_as_json(conn, sql)

# Notification
async def list_notification(pool):
    async with pool().acquire() as conn:
        sql = 'select * from tbl_notification order by code'
        return await fetch_all_as_json(conn, sql)

async def get_prefecture_code(pool, name):
    async with pool().acquire() as conn:
        pref = f'^{name}'
        sql = 'select code from tbl_prefecture_code where name ~ {}'.format(add_quote(pref))
        return await fetch_all_as_json(conn, sql)
    
