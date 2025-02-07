import os
import pusher


def p_client(app_id, key, secret, cluster):
    client = pusher.Pusher(app_id=app_id, key=key, secret=secret, cluster=cluster)

    def _inner():
        return client
    return _inner


pusher_client = p_client(
    app_id=os.getenv('PUSHER_APP_ID'),
    key=os.getenv('PUSHER_KEY'),
    secret=os.getenv('PUSHER_SECRET'),
    cluster=os.getenv('PUSHER_CLUSTER'))


def authenticate(channel, socket_id):
    return pusher_client().authenticate(
        channel=channel,
        socket_id=socket_id
    )


def send_event(channel, event, data):
    pusher_client().trigger(channel, event, data)

