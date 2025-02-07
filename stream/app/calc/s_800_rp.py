from .s_base import SBase
from . import rcp_helper as h

class S800_rp(SBase):
    group = '800'
    rcp_code = '80'
    rcp_name = 'その他'
    entity = 'rp'
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None

    def normalize(self, bundle):
        items = 'claim_items'
        base_items = [i for i in bundle.get(items) if h.is_toreru(i) and h.is_kihon_item(i)]

        ret = self.create_claim_bundle(self)
        procedures = []
        for p in base_items:
            procedures.append(p)
            for a in h.get_annotation_serial(p, self.annotations):
                procedures.append(a)
            if h.is_tsusoku_kasan_taisho(p):
                for g in self.generals:
                    procedures.append(g)
            
        ret[items].extend(procedures)
        return ret
    
    async def aggregate(self):
        if not self.context.院外処方():
            return []
        self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)  
        normalized = list(map(self.normalize, self.bundles))
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        return normalized
