from starlette.responses import JSONResponse
from ..db import db_master


def get_pool(app):
    return app.state.orion_pool


async def find_desease_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_desease_by_name(pool, name)
    return JSONResponse(result)


async def find_desease_modifier(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_desease_modifier(pool, name)
    return JSONResponse(result)


async def find_desease_by_icd10(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_desease_by_icd10(pool, name)
    return JSONResponse(result)


async def find_procedures_by_kbn_kbnno(request):
    pool = get_pool(request.app)
    params = [request.query_params[name] for name in ["kbn", "kbn_start", "kbn_end"]]
    result = await db_master.find_procedures_by_kbn_kbnno(pool, *params)
    return JSONResponse(result)


async def find_procedures_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_procedure_by_name(pool, name)
    return JSONResponse(result)


async def find_medicine_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_medicine_by_name(pool, name)
    return JSONResponse(result)


async def list_contrast_medium(request):
    pool = get_pool(request.app)
    result = await db_master.list_contrast_medium(pool)
    return JSONResponse(result)


async def find_tool_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_tool_by_name(pool, name)
    return JSONResponse(result)


async def find_master_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_master_by_name(pool, name)
    return JSONResponse(result)


async def find_master_by_code(request):
    pool = get_pool(request.app)
    code = request.query_params["code"]
    result = await db_master.find_master_by_code(pool, code)
    return JSONResponse(result)


async def find_comment_by_name(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.find_comment_by_name(pool, name)
    return JSONResponse(result)


async def find_comment_by_code(request):
    pool = get_pool(request.app)
    code = request.query_params["code"]
    result = await db_master.find_comment_by_code(pool, code)
    return JSONResponse(result)


async def find_address_by_zip_code(request):
    pool = get_pool(request.app)
    zip_code = request.path_params["code"]
    result = await db_master.find_address_by_zip_code(pool, zip_code)
    return JSONResponse(result)


async def list_all_depts(request):
    pool = get_pool(request.app)
    result = await db_master.list_all_depts(pool)
    return JSONResponse(result)


async def find_yoho_naihuku_code_name(request):
    pool = get_pool(request.app)
    admin_code = request.query_params["admin_code"]
    name = request.query_params["name"]
    result = await db_master.find_yoho_naihuku_code_name(pool, admin_code, name)
    return JSONResponse(result)


async def find_yoho_naihuku_code_timing(request):
    pool = get_pool(request.app)
    admin_code = request.query_params["admin_code"]
    timing_code = request.query_params["timing_code"]
    result = await db_master.find_yoho_naihuku_code_timing(
        pool, admin_code, timing_code
    )
    return JSONResponse(result)


async def find_yoho_gaiyo_code_detail(request):
    pool = get_pool(request.app)
    admin_code = request.query_params["admin_code"]
    detail_code = request.query_params["detail_code"]
    result = await db_master.find_yoho_gaiyo_code_detail(pool, admin_code, detail_code)
    return JSONResponse(result)


async def list_short_name(request):
    pool = get_pool(request.app)
    result = await db_master.list_short_name(pool)
    return JSONResponse(result)


async def get_prefecture_code(request):
    pool = get_pool(request.app)
    name = request.query_params["name"]
    result = await db_master.get_prefecture_code(pool, name)
    return JSONResponse(result)

