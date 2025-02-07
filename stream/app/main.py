import json
import faust
from faust.web import Request, Response, View
from .calc.santei import Santei
from .receipt.monthly_director import MonthlyDirector
from .receipt.clinic_builder  import ClinicBuilder
from .pusher_cl import Pusher
from .util.tracer import get_logger, pretty_dumps

app = faust.App(
    'magellanic_stream',
    broker='kafka://kafka:9092'
)

push_topic = app.topic('push-topic', value_type=bytes)
santei_topic = app.topic('santei-topic', value_type=bytes)
receipt_topic = app.topic('receipt-topic', value_type=bytes)

pusher = Pusher()

@app.agent(push_topic)
async def consume_push_event(stream):
    async for payload in stream:
        evt = json.loads(payload)
        get_logger(__name__).info(pretty_dumps(evt, 'push event'))
        data = [evt.get(name) for name in ['channel', 'event', 'data']]
        pusher.send(*data)


@app.agent(santei_topic)
async def consume_santei_event(stream):
    async for payload in stream:
        event = json.loads(payload)  # dict from json
        data_id = event.get('data_id')
        santei = Santei(data_id)
        result = await santei.process()
        await consume_push_event.send(value=json.dumps(result))


@app.agent(receipt_topic)
async def consume_receipt_event(stream):
    async for payload in stream:
        evt = json.loads(payload)  # dict from json
        builder = ClinicBuilder()
        director = MonthlyDirector(evt.get('facility_id'), evt.get('start'), evt.get('end'), builder)
        await director.construct()
        return


@app.page('/api/v1/push')
class PushHook(View):
    async def post(self, request: Request) -> Response:
        payload = await request.json()
        await consume_push_event.send(value=json.dumps(payload))
        return self.json({'result': 'accepted'})
    

@app.page('/api/v1/santei')
class SanteiHook(View):
    async def post(self, request: Request) -> Response:
        payload = await request.json()
        await consume_santei_event.send(value=json.dumps(payload))
        return self.json({"result": "accepted"})


@app.page('/api/v1/receipt')
class ReceiptHook(View):
    async def post(self, request: Request) -> Response:
        payload = await request.json()
        await consume_receipt_event.send(value=json.dumps(payload))
        return self.json({"result": "accepted"})