from starlette.responses import JSONResponse
from ..db.database import update_by_id
from ..util.tracer import get_logger, pretty_dumps

def get_pool(app):
    return app.state.magellan_pool

async def upcert_user_settings(request):
    pool = get_pool(request.app)
    payload = await request.json()
    get_logger(__name__).debug(pretty_dumps(payload))
    async with pool().acquire() as conn:
        async with conn.transaction():
            id_ = payload.get('user_id')
            await update_by_id(conn, 'm_user_settings', id_, payload)  # id = user_id
            return JSONResponse({'cnt': 1})