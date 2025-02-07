import os
from trycourier import Courier

client = Courier(auth_token=os.getenv("COURIER_AUTH_TOKEN"))

def send_signup_link(receiver, subject, title, job, link):
    resp = client.send_message(
        message={
            "to": {
                "email": f"{receiver}",
            },
            "template": os.getenv("COURIER_TEMPLATE_ID"),
            "data": {
                "subject": f"{subject}",
                "title": f"{title}",
                "job": f"{job}",
                "link": f"{link}",
            },
        }
    )
    return resp['requestId']
