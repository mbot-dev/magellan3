from .s_base import SBase
from . import rcp_helper as h
from ..util.tracer import get_logger, pretty_dumps

class S700(SBase):
    group = '700'
    entity = 'image'
    rcp_code = '70'
    rcp_name = '画像診断'
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None

    def bundle_from_items(self, items):
        b = self.create_claim_bundle(self)
        for it in items:
            b['claim_items'].append(it)
            for a in h.get_annotation_serial(it, self.annotations):
                b['claim_items'].append(a)
            if h.is_tsusoku_kasan_taisho(it):
                for g in self.generals:
                    b['claim_items'].append(g)
        return b

    def normalize(self, fluoroscopic, kihon_kasan, x_ray, enhanse, nuclear, ct, may_be_film, medicines):
        ret = []
        if len(fluoroscopic):
            b = self.bundle_from_items(fluoroscopic)
            ret.append(b)
        if len(x_ray) > 0:
            b = self.bundle_from_items(x_ray)
            ret.append(b)
        if len(enhanse) > 0:
            b = self.bundle_from_items(enhanse)
            ret.append(b)
        if len(nuclear) > 0:
            b = self.bundle_from_items(nuclear)
            ret.append(b)
        if len(ct) > 0:
            b = self.bundle_from_items(ct)
            ret.append(b)
        if len(kihon_kasan) > 0:
            b = self.bundle_from_items(kihon_kasan)
            ret.append(b)
        for f in may_be_film:
            # フィルム単位で記録
            b = self.create_claim_bundle(self)
            b['claim_items'].append(f)
            ret.append(b)
        if len(medicines) > 0:
            b = self.create_claim_bundle(self)
            b['claim_items'].extend(medicines)
            ret.append(b)
        return ret
        
    async def aggregate(self):
        """
        部位が必要 CO 82(選択), 83(編集), 89(修飾語) -> 部位でグルーピングが必要 -> UIで行う
        点数区分=E000 & 基本項目=1 -> 透視診断 or 基本項目の加算 -> 単独で点数表示が必要
        --------------------
        X線診断料=E001
        X線撮影料=E002
        フィルム
        -------------------- 組み合わせる
        造影剤注入手技=E003
        造影剤
        -------------------- 組み合わせる（造影剤は単独可）
        核医学診断料=E100
        CT検査料=E200
        """
        self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)
        it_000 = [i for i in self.base if i.get('kbn_no') == '000'] # 基本項目 & E000
        it_fluoroscopic = [i for i in it_000 if h.is_fluoroscopic(i)] # 透視診断
        it_kihon_kasan = [i for i in it_000 if h.is_e00_addition(i)] # 基本項目の加算
        it_x_ray = [i for i in self.base if h.is_x_ray(i)] # X線診断 X線撮影
        it_enhanse = [i for i in self.base if h.is_image_enhance(i)] # 造影剤注入手技
        it_nuclear = [i for i in self.base if h.is_nuclear_medicine(i)] # 核医学診断
        it_ct = [i for i in self.base if h.is_ct(i)] # CT検査
        may_be_film = [i for b in self.bundles for i in b.get('claim_items') if h.is_material(i)] # フィルム
        medicines = [i for b in self.bundles for i in b.get('claim_items') if h.is_medicine(i)] # 造影剤

        normalized = self.normalize(it_fluoroscopic, it_kihon_kasan, it_x_ray, it_enhanse, it_nuclear, it_ct, may_be_film, medicines)
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        get_logger(__name__).debug(pretty_dumps(normalized))
        return normalized
