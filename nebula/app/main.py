import jwt
from starlette.exceptions import HTTPException
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route, Mount
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.authentication import AuthenticationMiddleware
from .lib.jwt_auth import JWTAuthBackend
from .lib.iss import verify
from .worker.handler import FileHandler


async def upload_file(request):
    facility_id = request.path_params["facility_id"]
    form = await request.form()
    filename = form["file"].filename
    contents = await form["file"].read()
    h = FileHandler(facility_id)
    result = await h.save_file(filename, contents)
    return JSONResponse(result)


async def upload_pdf(request):
    facility_id = request.path_params["facility_id"]
    form = await request.form()
    filename = form["file"].filename
    contents = await form["file"].read()
    h = FileHandler(facility_id)
    result = await h.save_pdf(filename, contents)
    return JSONResponse(result)


async def upload_capture(request):
    facility_id = request.path_params["facility_id"]
    channel = request.path_params["channel"]
    form = await request.form()
    filename = form["file"].filename
    contents = await form["file"].read()
    h = FileHandler(facility_id)
    result = h.save_capture(filename, channel, contents)
    return JSONResponse(result)


async def delete_file(request):
    params = await request.json()
    facility_id = params.get("facility_id")
    thumbnail = params.get("thumbnail")
    body = params.get("body")
    h = FileHandler(facility_id)
    result = await h.delete_file(thumbnail, body)
    return JSONResponse(result)


async def delete_pdf(request):
    params = await request.json()
    facility_id = params.get("facility_id")
    body = params.get("body")
    h = FileHandler(facility_id)
    result = await h.delete_pdf(body)
    return JSONResponse(result)


async def get_thumbnail(request):
    facility_id = request.path_params["facility_id"]
    pk = request.path_params["pk"]
    h = FileHandler(facility_id)
    return await h.get_thumbnail(pk)


async def download_file(request):
    token = request.query_params["token"]
    try:
        verify(token)
    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="/unauthorized")
    except jwt.exceptions.InvalidSignatureError:
        raise HTTPException(status_code=401, detail="/unauthorized")
    except Exception:
        raise HTTPException(status_code=401, detail="/unauthorized")
    else:
        params = [request.query_params[name] for name in ["facility_id", "pk"]]
        h = FileHandler(params[0])
        return await h.get_body(params[1])


async def download_pdf(request):
    token = request.query_params["token"]
    try:
        verify(token)
    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="/unauthorized")
    except jwt.exceptions.InvalidSignatureError:
        raise HTTPException(status_code=401, detail="/unauthorized")
    except Exception:
        raise HTTPException(status_code=401, detail="/unauthorized")
    else:
        params = [request.query_params[name] for name in ["facility_id", "pk"]]
        h = FileHandler(params[0])
        return await h.get_pdf(params[1])


async def startup():
    pass


async def shutdown():
    pass


routes = [
    # Upload
    Mount(
        "/media/api/v1/upload",
        routes=[
            Route("/file/{facility_id}", upload_file, methods=["POST"]),
            Route("/pdf/{facility_id}", upload_pdf, methods=["POST"]),
            Route("/white/{facility_id}/{channel}", upload_capture, methods=["POST"]),
            Route("/thumbnail/{facility_id}/{pk}", get_thumbnail, methods=["GET"]),
        ],
    ),
    # Delete
    Mount(
        "/media/api/v1/delete",
        routes=[
            Route("/file", delete_file, methods=["PUT"]),
            Route("/pdf", delete_pdf, methods=["PUT"]),
        ],
    ),
    # Download
    Mount(
        "/media/api/v1/dl",
        routes=[
            Route("/body", download_file, methods=["GET"]),
            Route("/pdf", download_pdf, methods=["GET"]),
        ],
    ),
]

middleware = [
    Middleware(AuthenticationMiddleware, backend=JWTAuthBackend()),
    Middleware(CORSMiddleware, allow_origins=["*"]),
]

app = Starlette(
    debug=False,
    routes=routes,
    middleware=middleware,
    on_startup=[startup],
    on_shutdown=[shutdown],
)

