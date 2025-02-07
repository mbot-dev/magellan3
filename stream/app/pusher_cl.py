import os
import pusher

class Pusher:
    def __init__(self):
        app_id=os.getenv('PUSHER_APP_ID')
        key=os.getenv('PUSHER_KEY')
        secret=os.getenv('PUSHER_SECRET')
        cluster=os.getenv('PUSHER_CLUSTER')
        self.client = pusher.Pusher(app_id=app_id, key=key, secret=secret, cluster=cluster)

    def authenticate(self, channel, socket_id):
        return self.client.authenticate(
            channel=channel,
            socket_id=socket_id
        )

    def send(self, channel, event, data):
        self.client.trigger(channel, event, data)
