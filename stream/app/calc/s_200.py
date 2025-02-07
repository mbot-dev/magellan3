from itertools import groupby
from operator import itemgetter
import shortuuid
from .s_base import SBase
from . import rcp_helper as h
from .rcp_const import RECEIPT_CODE_NAME
from ..util.tracer import get_logger, pretty_dumps

class S200(SBase):
    group = ''
    entity = 'rp'
    rcp_code = ''
    rcp_name = ''
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None
    
    def create_teigen_comment(self):
        """薬剤料逓減コメント"""
        item = dict()
        item['id'] = shortuuid.uuid()
        item['status'] = 'F'
        item['code'] = '820000047'
        item['name'] = '（減）'
        item['type'] = 'CO'
        item['tensu'] = '0'
        return item
    
    def create_teigen_code(self):
        """薬剤料逓減コード"""
        item = dict()
        item['id'] = shortuuid.uuid()
        item['status'] = 'F'
        item['code'] = '630010002'
        item['name'] = '薬剤逓減（９０／１００）　内服薬'
        item['type'] = 'IY'
        item['tensu_type'] = '7'
        item['tensu'] = '90'  # private ルール
        return item
    
    def normalize_medicines(self, bundle):
        items = 'claim_items'
        medicines = [m for m in bundle.get(items) if h.is_medicine(m)]
        comments = [c for c in bundle.get(items) if h.is_comment(c)]
        ret = self.create_claim_bundle(self)
        ret['quantity'] = bundle.get('quantity') # 日数 or 回数 or 1
        ret['unit'] = bundle.get('unit')  # 日 or 回 or 1
        ret['prn'] = h.is_prn(bundle)
        ret['oral'] = h.is_oral(bundle)
        ret['topical'] = h.is_topical(bundle)
        ret[items].extend(comments)
        ret[items].extend(medicines)
        return ret
    
    def create_oral_bundles(self, orals):
        self.rcp_code = '21'
        self.rcp_name = RECEIPT_CODE_NAME.get('21')
        normalized_orals = [self.normalize_medicines(b) for b in orals]
        
        if self.context.内服7種類以上():
            """
            内服７種以上の場合の逓減
            コメントを最初に追加
            逓減コード自体をバンドルにして normalize_orals に追加
            Pending 和とレセプトコード付番の関係で全体を一まとめにする必要がある teigenB = [co, n1, n2,,t]
            """
            co = self.create_teigen_comment()
            # normalize_orals.insert(0, co) # 逓減コメント
            t_bundle = self.create_claim_bundle(self)
            t_item = self.create_teigen_code() 
            t_bundle['claim_items'].append(t_item)
            # normalize_orals.append(t_item) # 逓減コード（医薬品コード）
        
        return normalized_orals
    
    def create_prn_bundles(self, prns):
        self.rcp_code = '22'
        self.rcp_name = RECEIPT_CODE_NAME.get('22')
        normalized_prn = [self.normalize_medicines(b) for b in prns]
        return normalized_prn
    
    def create_topical_bundles(self, topicals):
        self.rcp_code = '23'
        self.rcp_name = RECEIPT_CODE_NAME.get('23')
        normalized_topicals = [self.normalize_medicines(b) for b in topicals]
        return normalized_topicals
    
    def crete_other_bundle(self, bundle):
        c = bundle.get('group')[0, 2]
        n = RECEIPT_CODE_NAME.get(c)
        self.rcp_code = c
        self.rcp_name = n

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
        # 院内処方のみ
        if not self.context.院内処方():
            return []
        
        normalized = []
        
        grouper = itemgetter('group')
        self.bundles.sort(key=grouper)
        for g, mem in groupby(self.bundles, grouper):
            members = list(mem)
            self.group = g
            if g.startswith('21'):
                normalized.extend(self.create_oral_bundles(members))
            elif g.startswith('22'):
                normalized.extend(self.create_prn_bundles(members))
            elif g.startswith('23'):
                normalized.extend(self.create_topical_bundles(members))
            else:
                self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)
                for b in members:
                    normalized.append(self.crete_other_bundle(b))
        
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        get_logger(__name__).debug(pretty_dumps(normalized, f'Normalized {self.rcp_name}'))
        return normalized
