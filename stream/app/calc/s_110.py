from .s_base import SBase
from . import rcp_helper as h
from ..util.tracer import get_logger, pretty_dumps


class S110(SBase):
    group = "110"
    entity = "baseCharge"
    rcp_code = "11"
    rcp_name = "初診"

    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.base = None
        self.annotations = None
        self.generals = None

    def is_second_dept(self, code):
        return code == "111011810"

    def create_second_dept_comment(self):
        dept = self.context.get_dept_name()
        cmt = dict()
        cmt["code"] = "830100002"
        cmt["name"] = f"2つ目の診療科(初診料);{dept}"
        cmt["data"] = dept
        return cmt

    def normalize(self, base_item):
        ret = self.create_claim_bundle(self)
        items = "claim_items"
        ret.get(items).append(base_item)

        if self.is_second_dept(base_item.get("code")):  # 2つ目の診療科のコメントを追加
            ret.get(items).insert(0, self.create_second_dept_comment())

        for a in h.get_annotation_serial(base_item, self.annotations):
            ret.get(items).append(a)

        return ret

    async def aggregate(self):
        """
        CSV 11 12 13 14 基本項目ごとに点数を記録
        基本項目=1, 注加算>0 通則=0
        """
        get_logger(__name__).debug(pretty_dumps(self.bundles, "110 Bundles"))
        self.base, self.annotations, self.generals = self.split_procedures_in(
            self.bundles
        )
        if len(self.base) != 1:
            get_logger(__name__).info("110 base is not 1")
            return []
        normalized = list(map(self.normalize, self.base))
        get_logger(__name__).debug(
            pretty_dumps(normalized, f"Normalized {self.rcp_name}")
        )
        return normalized
