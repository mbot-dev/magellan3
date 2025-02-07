from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from .router.token import send_signup_link, verify_signup_link, refresh_token, send_add_user_link, verify_add_user_link, issue_white_token

routes = [
    Mount('/iss/api/v1', routes = [
        Route('/send_signup_link', send_signup_link, methods=['POST']),
        Route('/verify_signup_link', verify_signup_link, methods=['GET']),
        Route('/refresh_token', refresh_token, methods=['POST']),
        Route('/send_add_user_link', send_add_user_link, methods=['POST']),
        Route('/verify_add_user_link', verify_add_user_link, methods=['GET']),
        Route('/white_token', issue_white_token, methods=['POST'])
    ])
]

async def startup():
    pass

async def shutdown():
    pass

middleware = [
    Middleware(CORSMiddleware, allow_origins=['*'])
]

app = Starlette(
    debug=False, 
    routes=routes,
    middleware=middleware,
    on_startup=[startup],
    on_shutdown=[shutdown]
)