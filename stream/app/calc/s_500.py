from .s_base import SBase
from . import rcp_helper as h

class S500(SBase):
    group = '500'
    entity = 'surgery'
    rcp_code = '50'
    rcp_name = '手術'
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None

    def normalize(self, bundle):
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
        """
        １バンドル複数の基本項目
        注加算は注加算グループコードと通番
        通則加算は...基本項目 or 基本項目+注加算　へつく
        上記ルールは全く通用しないものがある
        注の項目（7）で、グループが 0 -> 70件
        150268970   ２以上の手術の５０％併施加算    6（点数タイプ）   50.00（点数）   0（注加算グループ）   0（注加算通番）   7（告示等識別区分）
        160000190   検査逓減                     6   10.00   0   0   7
        150268970   ２以上の手術の５０％併施加算　適用ルールが不明　主たる手術ではない方へ適用する？
        区分K -> 逓減対象区分052!=0はない
        """
        self.base, self.annotations, self.generals = self.split_procedures_in(self.group)
        normalized = list(map(self.normalize, self.group))
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        return normalized
    