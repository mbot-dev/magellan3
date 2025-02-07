from .s_base import SBase
from . import rcp_helper as h
from ..util.tracer import get_logger, pretty_dumps

class S120(SBase):
    group = '120'
    entity = 'baseCharge'
    rcp_code = '12'
    rcp_name = '再診'
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None
    
    def is_second_dept(self, code):
        return code == '112015810'
    
    def create_second_dept_comment(self):
        dept = self.context.get_dept_name()
        cmt = dict()
        cmt['code'] = '830100003'
        cmt['name'] = f'2つ目の診療科(再診料);{dept}'
        cmt['data'] = dept
        return cmt
    
    def normalize(self, base_item):
        ret = self.create_claim_bundle(self)
        items = 'claim_items'
        ret.get(items).append(base_item)
        
        if self.is_second_dept(base_item.get('code')): # 2つ目の診療科のコメントを追加
            ret.get(items).insert(0, self.create_second_dept_comment())
        
        for a in h.get_annotation_serial(base_item, self.annotations):
            ret.get(items).append(a)
            
        return ret

    async def aggregate(self):
        """
        CSV 11 12 13 14 基本項目単位に点数を記録 
        （基）再診料
        （注）明細書発行体制等加算 74 x 1
        （基）外来管理加算        55 X 1 <- 基本項目の加算あり
        通則加算=0
        """
        self.base, self.annotations, self.generals = self.split_procedures_in(self.bundles)
        if len(self.base) == 0:
            raise []
        normalized = list(map(self.normalize, self.base))
        get_logger(__name__).debug(pretty_dumps(normalized, f'Normalized {self.rcp_name}'))
        return normalized