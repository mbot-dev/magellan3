from .s_base import SBase
from . import rcp_helper as h
from ..util.tracer import get_logger

class S600_p(SBase):
    group = '600'
    entity = 'physiology'
    rcp_code = '60'
    rcp_name = '検査'
    
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
            if h.is_teigen_taisho(p):
                """
                逓減対象となる診療行為　col_052=1　のもの
                検査逓減コード自体は col_068=7 & col_052=1（注加算かつ逓減対象）
                この値を持つのは検査逓減自体 と　２回目以降減算（ＣＴ、ＭＲＩ）のみ
                注加算診療行為の中で col_052=1 のものを検索している
                検査逓減コードは autoInjection する
                """
                teigen = h.find_teigen_item_in(self.annotations)
                if teigen:
                    procedures.append(teigen)
                    get_logger(__name__).debug(f'逓減対象: {p.get("name")} -> 検査逓減({teigen.get("code")})挿入')

            if h.is_tsusoku_kasan_taisho(p):
                for g in self.generals:
                    procedures.append(g)

        ret[items].extend(procedures)
        ret[items].extend(medicines)
        ret[items].extend(materials)
        return ret

    async def aggregate(self):
        """
        生体検査
        送信されるバンドル: 診療行為、医薬品、特定器材のセット
        注入されるバンドル: 加算関係
        通則加算: 160148670 | 超音波内視鏡検査加算 のみ（2024/06/17現在）
        entity=physiology を処理する
        """
        self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)
        
        normalized = list(map(self.normalize, self.bundles))
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        return normalized

    