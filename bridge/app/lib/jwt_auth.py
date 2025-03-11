from starlette.authentication import (
    AuthenticationBackend, AuthenticationError, SimpleUser,
    AuthCredentials
)
import jwt
from .iss import verify_access_token
from ..util.tracer import get_logger

class JWTAuthBackend(AuthenticationBackend):
    
    async def authenticate(self, request):
        
        get_logger(__name__).debug(request.url.path)

        if request.url.path.startswith('/stream/api/v1'):
            return

        if "Authorization" not in request.headers:
            raise AuthenticationError('Authorization header must be required')
        
        auth = request.headers["Authorization"]
        
        parts = auth.split()
        if parts[0].lower() != "bearer":
            raise AuthenticationError('Authorization header must start with Bearer')
        elif len(parts) == 1:
            raise AuthenticationError('Authorization token not found')
        elif len(parts) > 2:
            raise AuthenticationError('Authorization header be Bearer token')

        token = parts[1]
        
        try:
            payload = verify_access_token(token)
        except jwt.exceptions.ExpiredSignatureError:
            raise AuthenticationError('expired-token')
        except jwt.exceptions.InvalidSignatureError:
            raise AuthenticationError('invalid-token')
        else:
            return AuthCredentials(["authenticated"]), SimpleUser(payload.get('sub', 'user'))

    