import os
import jwt


def read_public(public_pem):
    file = open(public_pem, 'rb')
    key = file.read()
    file.close()

    def _inner():
        return key
    return _inner


ALGORITHM = os.getenv('ALGORITHM')
EC_PARAM = os.getenv('EC_PARAM')
KEY_PATH = os.getenv('KEY_PATH')
PUBLIC_FILE = f'./app/keys/public_{EC_PARAM}.pem'  # path: from project top dir

PUBLIC_KEY = read_public(PUBLIC_FILE)


def verify(token, iss=None, aud=None):
    if iss is not None and aud is not None:
        return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM], issuer=iss, audience=aud)
    return jwt.decode(token, PUBLIC_KEY(), algorithms=[ALGORITHM])


