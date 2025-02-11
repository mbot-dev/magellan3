import os
from time import time
import asyncpg
from ..db.bridge import Bridge
from .context import Context
from .clinic_injector import ClinicInjector
from .container import Container
from .rcp_maker import RcpMaker
from .exceptions import KarteNotFoundException, NotSatisfiedException
from ..util.tracer import get_logger, pretty_dumps

class Santei:

    def __init__(self, k_id):
        """
        k_id: pk of karte to santei
        """
        self.k_id = k_id

    @staticmethod
    async def get_connections():
        """
        Get db connections
        """
        dsn_small = os.getenv('DSN_MASTER', "postgresql://small:small_user@localhost:5432/small")
        dsn_large = os.getenv('DSN_KARTE', "postgresql://large:large_user@localhost:6543/large")
        conn_small = await asyncpg.connect(dsn_small)
        conn_large = await asyncpg.connect(dsn_large)
        return conn_small, conn_large

    async def process(self):
        try:
            small, large = await Santei.get_connections()
            bridge = Bridge(small, large)

            # Get karte to santei
            karte = await bridge.stream_get_karte(self.k_id)
            if karte is None:
                raise KarteNotFoundException()
            get_logger(__name__).info(pretty_dumps(karte, ' Target Karte'))

            # Start
            start = time()
            ctx = Context(karte)
            injector = ClinicInjector()
            rcp_maker = RcpMaker()
            container = Container(ctx, bridge, injector, rcp_maker)  # DI Container
            await container.filter_santei_kaisu()
            await container.add_auto_items()
            await container.solve()
            await container.aggregate()
            # End
            elapsed_time = time() - start
            get_logger(__name__).info(f'elapsed_time: {elapsed_time}[sec]')
            
            # Set pvt status onPayment
            facility_id = karte.get('facility').get('id')
            patient_id = karte.get('patient').get('id')
            pvt_id = karte.get('pvt_id')  # 受付ID
            if pvt_id is not None:
                await bridge.update_pvt_status(pvt_id, 'onPayment')
            
            # Push event
            # push_data = {
            #     'type': 'santei',
            #     'patient_id': patient_id,
            #     'pvt_id': pvt_id,
            # }
            # push_evt = {
            #     'channel': f'pvt-{facility_id}',
            #     'event': 'magellan:pvt-update',
            #     'data': push_data
            # }
            push_data = {
                'type': 'santei',
                'data_id': self.k_id,
            }
            push_evt = {
                'channel': f'santei-{self.k_id}',
                'event': 'magellan:santei-update',
                'data': push_data
            }
            return push_evt
        
        except KarteNotFoundException as kn:
            get_logger(__name__).warning(f'{kn}')
            return None
        except NotSatisfiedException as ne:
            get_logger(__name__).warning(f'{ne}')
            return None
        except Exception as e:
            get_logger(__name__).warning(f'{e}')
            return None
        finally:
            await small.close()
            await large.close()
