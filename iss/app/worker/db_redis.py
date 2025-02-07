import os
import json
import redis
from ..router.custome_exception import ConsumedLink

redis = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'), port=6379)


# link = jwt claim
# expires_in -> expires_in後にkeyを自動削除
def save_link(link, expires_in, full_name=None, kana=None, medical_license=None, physician_id=None, facility_id=None):
    key = link.get('jti')
    if physician_id is None:  # login
        redis.set(key, json.dumps(link))
    else:
        new_link = {**link, **{'full_name': full_name, 'kana': kana, 'license': medical_license, 'physician_id': physician_id, 'facility_id': facility_id}}
        redis.set(key, json.dumps(new_link))
    # 便利!
    redis.expire(key, expires_in)


# link = jwt claim
def get_link(key):
    if not redis.exists(key):
        raise ConsumedLink('consumed-link')
    saved = redis.get(key)
    return json.loads(saved)


# link = jwt claim
def consume_link(key):
    if not redis.exists(key):
        raise ConsumedLink('consumed-link')
    redis.delete(key)


def save_signup_link(key, link, expires_in):
    if redis.exists(key):
        raise ConsumedLink('consumed-link')
    redis.set(key, json.dumps(link))
    redis.expire(key, expires_in)


def get_signup_link(key):
    if not redis.exists(key):
        raise ConsumedLink('consumed-link')
    saved = redis.get(key)
    redis.delete(key)
    return json.loads(saved)


def save_login_link(key, link, expires_in):
    redis.set(key, json.dumps(link))
    redis.expire(key, expires_in)


def get_login_link(key):
    if not redis.exists(key):
        raise ConsumedLink('consumed-link')
    saved = redis.get(key)
    redis.delete(key)
    return json.loads(saved)


# Save webauthun challenge
def save_challenge(key, challenge, expires_in):
    if redis.exists(key):
        raise ConsumedLink('consumed-link')
    redis.set(key, challenge)
    redis.expire(key, expires_in)


# Get webauthun challenge
def get_challenge(key):
    if not redis.exists(key):
        raise ConsumedLink('consumed-link')
    saved = redis.get(key)
    redis.delete(key)
    return saved

