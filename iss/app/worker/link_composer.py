import os
from pathlib import Path
from ..util.tracer import get_logger, pretty_dumps


def read_text_template(txt_file):
    file = open(txt_file, 'r')
    content = file.read()
    file.close()

    def _inner():
        return content
    return _inner


def read_invite_template(txt_file):
    file = open(txt_file, 'r')
    content = file.read()
    file.close()

    def _inner():
        return content
    return _inner


def read_html_template(html_file):
    file = open(html_file, 'r')
    content = file.read()
    file.close()

    def _inner():
        return content
    return _inner


def read_html_invite_template(html_file):
    file = open(html_file, 'r')
    content = file.read()
    file.close()

    def _inner():
        return content
    return _inner

# Template dir
BASE_PATH = Path(__file__).resolve().parent.parent
templates_dir = str(BASE_PATH / "templates")

TEXT_TEMPLATE_LOGIN = read_text_template(f'{templates_dir}/send_magic')
TEXT_TEMPLATE_SIGNUP = read_text_template(f'{templates_dir}/send_signup')
TEXT_TEMPLATE_INVITE = read_text_template(f'{templates_dir}/send_invite')
TEXT_TEMPLATE_CHANGE_NAME = read_text_template(f'{templates_dir}/send_change_name')
TEXT_TEMPLATE_PING = read_text_template(f'{templates_dir}/ping')
TEXT_TEMPLATE_CALL = read_text_template(f'{templates_dir}/call')

HTML_TEMPLATE_LOGIN = read_html_template(f'{templates_dir}/send_magic.html')
HTML_TEMPLATE_SIGNUP = read_html_template(f'{templates_dir}/send_signup.html')
HTML_TEMPLATE_INVITE = read_html_template(f'{templates_dir}/send_invite.html')
HTML_TEMPLATE_CHANGE_NAME = read_html_template(f'{templates_dir}/send_change_name.html')
HTML_TEMPLATE_PING = read_html_template(f'{templates_dir}/ping.html')
HTML_TEMPLATE_CALL = read_html_template(f'{templates_dir}/call.html')


def compose_signup(callback, token):
    return f'{callback}?token={token}'

def compose_login(callback, token, sign_up=False):
    args = f'token={token}&sign_up=true' if sign_up else f'token={token}'
    get_logger(__name__).debug(args)
    if sign_up:
        txt = TEXT_TEMPLATE_SIGNUP()
        html = HTML_TEMPLATE_SIGNUP()
    else:
        txt = TEXT_TEMPLATE_LOGIN()
        html = HTML_TEMPLATE_LOGIN()

    # Injection
    txt = txt.replace('{{callback_url}}', callback)
    txt = txt.replace('{{args}}', args)
    html = html.replace('{{callback_url}}', callback)
    html = html.replace('{{args}}', args)
    html = html.replace('{{token}}', token)
    return txt, html


def compose_invite(callback, physician, facility, token):
    txt = TEXT_TEMPLATE_INVITE()
    txt = txt.replace('{{facility}}', facility)
    txt = txt.replace('{{physician}}', physician)
    txt = txt.replace('{{callback_url}}', callback)
    txt = txt.replace('{{token}}', token)
    # html message
    html = HTML_TEMPLATE_INVITE()
    html = html.replace('{{facility}}', facility)
    html = html.replace('{{physician}}', physician)
    html = html.replace('{{callback_url}}', callback)
    html = html.replace('{{token}}', token)
    return txt, html


def compose_change_name(callback, token, step):
    args = f'token={token}&step={step}'
    get_logger(__name__).debug(args)
    txt = TEXT_TEMPLATE_CHANGE_NAME()
    html = HTML_TEMPLATE_CHANGE_NAME()
    # Injection
    txt = txt.replace('{{callback_url}}', callback)
    txt = txt.replace('{{args}}', args)
    html = html.replace('{{callback_url}}', callback)
    html = html.replace('{{args}}', args)
    html = html.replace('{{token}}', token)
    return txt, html


def compose_ping(callback, physician, facility, token):
    txt = TEXT_TEMPLATE_PING()
    txt = txt.replace('{{facility}}', facility)
    # txt = txt.replace('{{physician}}', physician)
    txt = txt.replace('{{callback_url}}', callback)
    txt = txt.replace('{{token}}', token)
    # html message
    html = HTML_TEMPLATE_PING()
    html = html.replace('{{facility}}', facility)
    # html = html.replace('{{physician}}', physician)
    html = html.replace('{{callback_url}}', callback)
    html = html.replace('{{token}}', token)
    return txt, html


def compose_call(guest_url, guest_jwt, appoint_time, physician, facility):
    txt = TEXT_TEMPLATE_CALL()
    txt = txt.replace('{{facility}}', facility)
    txt = txt.replace('{{physician}}', physician)
    txt = txt.replace('{{appoint_time}}', appoint_time)
    txt = txt.replace('{{guest_url}}', guest_url)
    # txt = txt.replace('{{guest_jwt}}', guest_jwt)
    html = HTML_TEMPLATE_CALL()
    html = html.replace('{{facility}}', facility)
    html = html.replace('{{physician}}', physician)
    html = html.replace('{{appoint_time}}', appoint_time)
    html = html.replace('{{guest_url}}', guest_url)
    html = html.replace('{{guest_jwt}}', guest_jwt)
    return txt, html
