from .s_base import SBase
from . import rcp_helper as h
from .rcp_const import RECEIPT_CODE_NAME

class S300(SBase):
    group = ''
    entity = 'injection'
    rcp_code = ''
    rcp_name = ''
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None

    def normalize(self, bundle):
        c = bundle.get('group')[0:2]
        n = RECEIPT_CODE_NAME.get(c)
        self.rcp_code = c
        self.rcp_name = n
        self.group = bundle.get('group')

        items = 'claim_items'
        base_items = [i for i in bundle.get(items) if h.is_toreru(i) and h.is_kihon_item(i)]
        medicines = [m for m in bundle.get(items) if h.is_medicine(m)]
        materials = [m for m in bundle.get(items) if h.is_material(m)]
        comments = [c for c in bundle.get(items) if h.is_comment(c)]

        ret = self.create_claim_bundle(self)
        ret[items].extend(comments)

        procedures = []
        for p in base_items:
            procedures.append(p)
            for a in h.get_annotation_serial(p, self.annotations):
                procedures.append(a)
            if h.is_tsusoku_kasan_taisho(p):
                for g in self.generals:
                    procedures.append(g)
            
        ret[items].extend(procedures)
        ret[items].extend(medicines)
        ret[items].extend(materials)
        return ret

    async def aggregate(self):
        self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)
        normalized = list(map(self.normalize, self.bundles))
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        return normalized
