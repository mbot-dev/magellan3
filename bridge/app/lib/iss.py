import os
import jwt
from pathlib import Path


def read_public(public_pem):
    file = open(public_pem, 'rb')
    key = file.read()
    file.close()

    def _inner():
        return key
    return _inner


ALGORITHM = os.getenv('ALGORITHM')
EC_PARAM = os.getenv('EC_PARAM')
BASE_PATH = Path(__file__).resolve().parent.parent
keys = str(BASE_PATH / "keys")
PUBLIC_FILE = f'{keys}/public_{EC_PARAM}.pem'  # path: from project top dir

PUBLIC_KEY = read_public(PUBLIC_FILE)


def verify(token, iss, aud):
    return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM], issuer=iss, audience=aud)


def verify_access_token(token):
    return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM])
