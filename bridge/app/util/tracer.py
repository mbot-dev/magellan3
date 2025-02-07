import os
import logging
from datetime import date, datetime
import simplejson as json

logging.basicConfig(
    format='%(asctime)s %(name)s %(lineno)d %(levelname)s %(message)s',
    datefmt='%Y-%m-%d:%H:%M:%S',
    level=int(os.getenv('LOG_LEVEL', '20'))
)


def my_converter(o):
    if isinstance(o, date):
        return o.__str__()
    if isinstance(o, datetime):
        return o.__str__()


def pretty_dumps(payload, title=None):
    if isinstance(payload, dict) or isinstance(payload, list):
        data = json.dumps(payload, indent=3, default=my_converter, ensure_ascii=False)
    elif isinstance(payload, str):
        data = payload
    else:
        data = f'{payload}'
    if title is not None:
        return f'\n------------------------------------\n{title}\n------------------------------------\n{data}\n'
    else:
        return data


def get_logger(category):
    return logging.getLogger(category)

