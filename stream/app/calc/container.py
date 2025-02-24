from itertools import groupby, combinations
from operator import itemgetter
from z3 import Solver, Bool, Not, And, If, sat, is_true
from .z3_parser import Z3Parser
from .s_base import SBase
from .s_110 import S110
from .s_120 import S120
from .s_130 import S130
from .s_140 import S140
from .s_200 import S200
from .s_300 import S300
from .s_400 import S400
from .s_500 import S500
from .s_600_p import S600_p
from .s_600_l import S600_l
from .s_700 import S700
from .s_800 import S800
from .s_800_rp import S800_rp
from .exceptions import MasterNotFoundException, NotSatisfiedException
from . import rcp_helper as h
from ..util.tracer import get_logger, pretty_dumps
from .utils import (
    get_day_window,
    get_month_window,
    get_week_window,
    now_as_date,
    find_index,
)


class Container(SBase):
    def __init__(self, context, bridge, injector, rcp_maker) -> None:
        super().__init__(context)
        self.bridge = bridge
        self.injector = injector
        self.rcp_maker = rcp_maker
        self.parser = Z3Parser()
        self.children = []

    def class_from_group(self, group, entity):
        if group == "110":
            return S110
        if group == "120":
            return S120
        if group == "130":
            return S130
        if group == "140":
            return S140
        if group.startswith("2"):
            return S200
        if group.startswith("3"):
            return S300
        if group == "400":
            return S400
        if group == "500":
            return S500
        if group == "600":
            return S600_l if entity == "labTest" else S600_p
        if group == "700":
            return S700
        if group == "800":
            return S800_rp if entity == "rp" else S800
        return None

    async def filter_santei_kaisu(self, procedures=None):
        """
        算定回数フィルター
        """
        if procedures is None:
            procedures = self.get_procedures()
        await self.set_procedures_tensu_(procedures)
        await self.set_medicines_tensu_(self.get_medicines())
        await self.set_materials_tensu_(self.get_materials())
        await self.set_constraints_(procedures)
        await self.set_kaisu_limit_(procedures)
        await self.set_actual_count_(procedures)
        await self.set_teigen_ac_(procedures)
        return procedures

    async def add_auto_items(self):
        """
        Dependency Injection
        """
        auto_add, names = self.injector.inject_from(self.context.get_karte())
        if len(auto_add) == 0 or len(names) == 0:
            return
        get_logger(__name__).info(pretty_dumps(auto_add, "auto_add items"))
        get_logger(__name__).info(pretty_dumps(names, "variable names"))
        # Solve by Z3
        accept_to_add = []
        bools = [
            Bool("s_%s" % c.get("code")) for c in auto_add
        ]  # Assign boolenan variable to all auto_add
        s = Solver()
        # Parse logic text of auto_add
        for b, p in zip(bools, auto_add):
            logic_text = p.get("is_toreru")
            z3_logic = self.parser.parse(logic_text)
            s.add(If(z3_logic, b, Not(b)))
        # Set context value
        for nm in names:
            nl = nm.split("_")
            n = nl[0]
            b = Bool(nm)
            v = None
            if len(nl) == 1:
                v = getattr(self.context, n)()
            elif len(nl) == 2 and (nl[1] == "体制" or nl[1] == "届出"):
                v = getattr(self.context, nl[1])(n)
            else:
                v = getattr(self.context, nm)()  # 乳幼児3_55 etc
            get_logger(__name__).info(f"{n}: {v}")
            s.add(b if v else Not(b))
        # Check satisfiability
        if s.check() == sat:
            m = s.model()
            for b, p in zip(bools, auto_add):
                get_logger(__name__).info(f"{p.get('name')}: {is_true(m[b])}")
                if is_true(m[b]):
                    accept_to_add.append(p)
            get_logger(__name__).info(pretty_dumps(accept_to_add, "自動算定項目"))
        else:
            get_logger(__name__).warning(f"自動算定: {s.check()}")
            raise NotSatisfiedException()
        """
        算定回数フィルターを通す
        """
        accept_to_add = await self.filter_santei_kaisu(procedures=accept_to_add)
        get_logger(__name__).info(
            pretty_dumps(accept_to_add, "自動算定項目(フィルター後)")
        )
        """
        自動算定項目のうち、算定回数制限をパスした項目と主たるもののバンドルを作成しカルテに追加する
        """
        for a in [
            p
            for p in accept_to_add
            if p.get("under_limit", True) or p.get("is_main_item", True)
        ]:
            bundle = self.bundle_from_injected_item(a)  # claim class code
            bundle["injected"] = True
            bundle["claim_items"].append(a)
            self.context.get_karte().get("p").append(bundle)
        get_logger(__name__).debug(
            pretty_dumps(self.context.get_karte().get("p"), "My P")
        )

    async def solve(self):
        entries = []
        for p in self.get_procedures():
            under_limit = p.get("under_limit", True)
            if not under_limit:
                get_logger(__name__).info(f"{p.get('name')} 算定回数オーバー取れない")
                p["算定"] = "取れない"
                continue
            if p.get("has_ct"):
                get_logger(__name__).info(f"{p.get('name')} 制約あり")
                entries.append(p)
            else:
                get_logger(__name__).info(f"{p.get('name')} 取れる")
                p["算定"] = "取れる"

        if len(entries) == 0:
            return

        get_logger(__name__).info([p.get("name") for p in entries])

        if len(entries) == 1:
            entries[0]["算定"] = "取れる"
            return

        p = []
        q = []
        b = []
        sorter = itemgetter("code")
        entries.sort(key=sorter)
        b = [Bool("s_%s" % p.get("name")) for p in entries]
        now = now_as_date()
        # Combinations
        for p1, p2 in combinations(entries, 2):
            code1 = p1.get("code")
            name1 = p1.get("name")
            tensu1 = p1.get("tensu")
            b1 = b[find_index(entries, "name", name1)]  # b[0], b[3]...

            code2 = p2.get("code")
            name2 = p2.get("name")
            tensu2 = p2.get("tensu")
            b2 = b[find_index(entries, "name", name2)]

            added_to_proposition = False

            # 背反1日の制約
            if p1.get("nand_day") == 1:
                nand = await self.bridge.get_nand_day_code12(now, code1, code2)
                ex_type = nand[0].get("exclusive_type") if len(nand) > 0 else 0
                if ex_type != 0:
                    get_logger(__name__).debug(
                        pretty_dumps(nand, f"背反1日: {code1} {code2} 区分: {ex_type}")
                    )
                    p.append(self.return_proposition(ex_type, b1, b2, tensu1, tensu2))
                    added_to_proposition = True

            # 背反同一月内の制約
            if p1.get("nand_month") == 1:
                nand = await self.bridge.get_nand_month_code12(now, code1, code2)
                ex_type = nand[0].get("exclusive_type") if len(nand) > 0 else 0
                if ex_type != 0:
                    get_logger(__name__).debug(
                        pretty_dumps(
                            nand, f"背反同一月内: {code1} {code2} 区分: {ex_type}"
                        )
                    )
                    p.append(self.return_proposition(ex_type, b1, b2, tensu1, tensu2))
                    added_to_proposition = True

            # 背反同時の制約
            if p1.get("nand_same") == 1:
                nand = await self.bridge.get_nand_same_code12(now, code1, code2)
                ex_type = nand[0].get("exclusive_type") if len(nand) > 0 else 0
                if ex_type != 0:
                    get_logger(__name__).debug(
                        pretty_dumps(nand, f"背反同時: {code1} {code2} 区分: {ex_type}")
                    )
                    p.append(self.return_proposition(ex_type, b1, b2, tensu1, tensu2))
                    added_to_proposition = True

            # 背反1週間の制約
            if p1.get("nand_week") == 1:
                nand = await self.bridge.get_nand_week_code12(now, code1, code2)
                ex_type = nand[0].get("exclusive_type") if len(nand) > 0 else 0
                if ex_type != 0:
                    get_logger(__name__).debug(
                        pretty_dumps(
                            nand, f"背反1週間: {code1} {code2} 区分: {ex_type}"
                        )
                    )
                    p.append(self.return_proposition(ex_type, b1, b2, tensu1, tensu2))
                    added_to_proposition = True

            # 背反関係なし -> どちらも取れる
            if not added_to_proposition:
                q.append(b1)
                q.append(b2)

        get_logger(__name__).info(p)
        get_logger(__name__).info(q)

        # 充足可能性を確認
        s = Solver()
        s.add(And(p))
        s.add(And(q))
        if s.check() == sat:
            m = s.model()
            for i in range(len(entries)):
                name = entries[i].get("name")
                toreru = is_true(m[b[i]])
                get_logger(__name__).info(f"{name}: {toreru}")
                entries[i]["算定"] = "取れる" if toreru else "取れない"
            get_logger(__name__).info(pretty_dumps(self.get_procedures(), "算定結果"))
        else:
            get_logger(__name__).warning("充足可能性なし")
            raise NotSatisfiedException()

    def return_proposition(self, ex_type, b1, b2, ten1, ten2):
        """
        命題を返す
        """
        if ex_type == 1:  # code1 をとる
            return And(b1, Not(b2))
        if ex_type == 2:  # code2 をとる
            return And(Not(b1), b2)
        if ex_type == 3:  # どちらかをとる -> 点数の多い方をとる
            return And(b1, Not(b2)) if ten1 >= ten2 else And(Not(b1), b2)
        raise ValueError("背反区分が不正です")

    async def aggregate(self):
        """
        カルテのP(bundles)をグルーピングし診療行為クラス S110, S129,,,S800に分配する
        """
        claim_bundles = self.context.get_karte().get("p")
        grouper = itemgetter("group", "entity")
        claim_bundles.sort(key=grouper)
        for (group, entity), member in groupby(claim_bundles, grouper):
            if group == "000":  # 病名
                continue
            child_bundles = list(member)
            get_logger(__name__).info(f"group: {group} {len(child_bundles)}")
            mapped_class = self.class_from_group(group, entity)
            self.children.append(mapped_class(self.context, child_bundles))

        # 各診療行為クラスに正規化（基本項目に加算がつく形、診療行為と医薬品及び特定器材をセットの形にする ）を提出させる
        normalized = []
        for child in self.children:
            get_logger(__name__).info(f"child: {child}")
            normalized += await child.aggregate()
        # normalized配列からレセプトを作成し保存する
        get_logger(__name__).info(pretty_dumps(normalized, "Normalized"))
        rcp = [self.rcp_maker.calculate(n) for n in normalized]
        receipt_data = dict()
        receipt_data["p"] = rcp

        keys = [
            "rcp_rec_type",
            "rcp_code",
            "rcp_cover_cost",
            "code",
            "name",
            "rcp_quantity",
            "rcp_tensu",
            "rcp_kaisu",
            "rcp_unit_code",
            "rcp_unit_price",
            "rcp_date",
        ]
        for bdl in receipt_data.get("p"):
            for item in bdl.get("receipt_items"):
                line = [f"{item.get(k)}" for k in keys]
                line = ",".join(line)
                get_logger(__name__).info(line)
        try:
            get_logger(__name__).info("starting Save")
            get_logger(__name__).info(pretty_dumps(receipt_data, "Save"))
            await self.bridge.save_receipt(receipt_data)
            get_logger(__name__).info("end Save")
        except Exception as e:
            get_logger(__name__).info("---------------------------------")
            get_logger(__name__).info("Error Save")
            get_logger(__name__).error(e)
            get_logger(__name__).info("---------------------------------")
            raise e

    async def set_constraints_(self, procedures):
        """
        補助マスターから制約を設定する
        """
        target = [p for p in procedures if p.get("has_ct") is None]
        if len(target) == 0:
            return
        res = await self.bridge.get_constraints_in([p.get("code") for p in target])
        if len(res) != len(target):
            # 補助マスター件数 = 診療行為件数
            get_logger(__name__).error(
                f"補助マスター件数{len(res)} = 診療行為件数{len(target)}"
            )
            raise MasterNotFoundException()
        get_logger(__name__).debug(pretty_dumps(res, "制約"))
        sorter = itemgetter("code")
        target.sort(key=sorter)
        res.sort(key=sorter)
        for p, r in zip(target, res):
            p.update(
                {
                    k: r.get(k)
                    for k in [
                        "inclusion1",
                        "group1",
                        "inclusion2",
                        "group2",
                        "inclusion3",
                        "group3",
                        "nand_day",
                        "nand_month",
                        "nand_same",
                        "nand_week",
                        "calc_count",
                    ]
                }
            )
            p["has_inclusion"] = (
                sum([r.get("inclusion1"), r.get("inclusion2"), r.get("inclusion3")]) > 0
            )
            p["has_ct"] = (
                sum(
                    [
                        r.get("nand_day"),
                        r.get("nand_month"),
                        r.get("nand_same"),
                        r.get("nand_week"),
                    ]
                )
                > 0
            )

    async def set_kaisu_limit_(self, procedures):
        """
        算定回数制限を設定する
        複数の算定単位を持つ診療行為がある（例 算定単位=患者あたり及び月あたり）
        よってマスター項目に登録されている件数と診療行為の件数が一致しない場合がある 750rows
        算定単位は最大２個
        """
        target = [p for p in procedures if p.get("calc_count") != 0]  # 回数制限あり
        if len(target) == 0:
            return
        res = await self.bridge.get_calc_count_in([p.get("code") for p in target])
        get_logger(__name__).debug(pretty_dumps(res, "算定回数制限"))
        sorter = itemgetter("code")
        target.sort(key=sorter)
        res.sort(key=sorter)
        for p in target:
            entries = [r for r in res if r.get("code") == p.get("code")]
            if len(entries) == 0:
                continue
            for index, r in enumerate(entries):
                unit_code = r.get("unit_code")
                upper_limit = r.get("upper_limit")
                if index == 0:
                    p["unit_code"] = unit_code
                    p["upper_limit"] = upper_limit
                elif index == 1:
                    p["unit_code_2"] = unit_code
                    p["upper_limit_2"] = upper_limit

    async def set_actual_count_(self, procedures):
        """
        実績回数を設定する
        """
        target = [
            p
            for p in procedures
            if p.get("unit_code") != "0" or p.get("unit_code") != ""
        ]  # check
        target2 = [p for p in procedures if p.get("unit_code_2")]
        if len(target) == 0 and len(target2) == 0:
            return
        fc_id = self.context.get_facility_id()
        pt_id = self.context.get_patient_id()
        dt = self.context.get_created_at()
        get_logger(__name__).debug(f"fc_id, pt_id, dt: {fc_id}, {pt_id}, {dt}")
        index = 0
        for t in [target, target2]:
            grouper = (
                itemgetter("unit_code") if index == 0 else itemgetter("unit_code_2")
            )
            t.sort(key=grouper)
            for unit, g in groupby(t, grouper):
                unit_g = list(g)
                get_logger(__name__).info(f"unit_code: {unit} {len(unit_g)}")

                if unit == "121":  # 1日あたり
                    zisseki = await self.get_day_ac_(fc_id, pt_id, dt, unit_g)
                    self.set_under_limit_(unit_g, zisseki, index)
                    continue
                if unit == "131":  # 1月あたり
                    zisseki = await self.get_month_ac_(fc_id, pt_id, dt, unit_g)
                    self.set_under_limit_(unit_g, zisseki, index)
                    continue
                if unit == "133":  # 入院中
                    continue
                if unit == "141":  # 一連
                    continue
                if unit == "53":  # 患者あたり
                    zisseki = await self.get_patient_ac_(fc_id, pt_id, unit_g)
                    self.set_under_limit_(unit_g, zisseki, index)
                    continue
                if unit == "138":  # 1週間あたり
                    zisseki = await self.get_week_ac_(fc_id, pt_id, dt, unit_g)
                    self.set_under_limit_(unit_g, zisseki, index)
                    continue
                if unit == "28":  # 単位 リハビリ ul=all 1
                    continue
                if unit == "56":  # 手術当たり
                    continue
                if unit == "132":  # 入院初日
                    continue
                if unit == "144":  # 3月
                    continue
                if unit == "135":  # 初回
                    zisseki = await self.get_patient_ac_(
                        fc_id, pt_id, unit_g
                    )  # -> 患者あたり ToDo
                    self.set_under_limit_(unit_g, zisseki, index)
                    continue
                if unit == "159":  # 初診時....
                    continue
                if unit == "147":  # 12月
                    continue
                if unit == "134":  # 退院時
                    continue
                if unit == "150":  # 検査当たり
                    continue
                if unit == "143":  # 2月
                    continue
                if unit == "146":  # 6月
                    continue
                if unit == "126":  # 箇所
                    continue
                if unit == "107":  # 臓器
                    continue
                if unit == "110":  # 肢
                    continue
                if unit == "151":  # １疾患当たり
                    continue
                if unit == "109":  # 部位
                    continue
                if unit == "145":  # 4月
                    continue
                if unit == "112":  # 種目
                    continue
                if unit == "142":  # ２週
                    continue
                if unit == "119":  # 側 手術
                    continue
                if unit == "148":  # 5年
                    continue
                if unit == "117":  # 歯
                    continue
                if unit == "160":  # １分娩当たり
                    continue
                if unit == "111":  # 局所
                    continue
                if unit == "149":  # 妊娠中
                    continue
                if unit == "122":  # 椎間
                    continue
                if unit == "140":  # 神経
                    continue
                if unit == "10":  # 個
                    continue
                if unit == "123":  # 筋
                    continue
            index += 1

    async def get_patient_ac_(self, fc_id, pt_id, unit_g):
        res = await self.bridge.count_patient_procedures(
            fc_id, pt_id, [p.get("code") for p in unit_g]
        )
        get_logger(__name__).info(pretty_dumps(res, "患者の実績"))
        return res

    async def get_day_ac_(self, fc_id, pt_id, dt, unit_g):
        """
        今日の実績
        """
        start, end = get_day_window(dt)
        get_logger(__name__).debug(f"start, end: {start}, {end}")
        res = await self.bridge.count_procedures_in(
            fc_id, pt_id, start, end, [p.get("code") for p in unit_g]
        )
        get_logger(__name__).debug(pretty_dumps(res, "今日の実績"))
        return res

    async def get_month_ac_(self, fc_id, pt_id, dt, unit_g):
        """
        今月の実績
        """
        start, end = get_month_window(dt)
        res = await self.bridge.count_procedures_in(
            fc_id, pt_id, start, end, [p.get("code") for p in unit_g]
        )
        get_logger(__name__).debug(pretty_dumps(res, "今月の実績"))
        return res

    async def get_week_ac_(self, fc_id, pt_id, dt, unit_g):
        """
        今週の実績
        """
        start, end = get_week_window(dt)
        res = await self.bridge.count_procedures_in(
            fc_id, pt_id, start, end, [p.get("code") for p in unit_g]
        )
        get_logger(__name__).debug(pretty_dumps(res, "今週の実績"))
        return res

    def set_under_limit_(self, unit_g, zisseki, index):
        """
        実績設定
        """
        if len(zisseki) == 0:
            return
        target = self.list_in_list(unit_g, zisseki, "code")  # len(unit_g) != len(ac)
        sorter = itemgetter("code")
        target.sort(key=sorter)
        zisseki.sort(key=sorter)
        for p, z in zip(target, zisseki):
            actual_count = z.get("actual_count")
            upper_limit = p.get("upper_limit")
            under_limit = actual_count < upper_limit
            get_logger(__name__).info(
                f"actual_count, upper_limit, under_limit: {actual_count}, {upper_limit}, {under_limit}"
            )
            if index == 0:
                p["actual_count"] = actual_count
                p["under_limit"] = under_limit
            else:
                p["actual_count"] = actual_count  # over write
                p["under_limit"] = under_limit and p.get(
                    "under_limit"
                )  # どちらもTrueの場合True

    async def set_teigen_ac_(self, procedures):
        """
        逓減項目の実績
        ToDo: 月しか考慮していない
        """
        target = [p for p in procedures if h.is_teigen_procedure(p)]
        if len(target) == 0:
            return
        fc_id = self.context.get_facility_id()
        pt_id = self.context.get_patient_id()
        dt = self.context.get_created_at()
        start, end = get_month_window(dt)
        res = await self.bridge.count_procedures_in(
            fc_id, pt_id, start, end, [p.get("code") for p in target]
        )
        get_logger(__name__).debug(pretty_dumps(res, "逓減項目の実績"))
        for p in target:
            for r in res:
                if p.get("code") == r.get("code"):
                    p["actual_count"] = r.get("actual_count")
                    p["under_limit"] = True  # 逓減されるだけで算定は可
                    break

    async def set_procedures_tensu_(self, procedures):
        """
        診療行為の点数を設定する
        """
        target = [p for p in procedures if p.get("tensu") is None]
        if len(target) == 0:
            return
        sorter = itemgetter("code")
        target.sort(key=sorter)
        res = await self.bridge.get_tensu_in([p.get("code") for p in target])
        if len(res) != len(target):
            get_logger(__name__).info("----------------------------------------------")
            get_logger(__name__).error(f"tensu={len(res)} procedure={len(target)}")
            get_logger(__name__).error(pretty_dumps(target, "診療行為"))
            get_logger(__name__).error(pretty_dumps(res, "点数 Response"))
            get_logger(__name__).info("----------------------------------------------")
            raise MasterNotFoundException()
        get_logger(__name__).debug(pretty_dumps(res, "診療行為点数"))
        for p, r in zip(target, res):
            p.update(
                {
                    k: r.get(k)
                    for k in [
                        "unit_code",
                        "unit",
                        "tensu_type",
                        "tensu",
                        "claim_class",
                        "c16_包括対象検査",
                        "c20_画像等手術支援加算",
                        "c30_きざみ識別",
                        "c31_きざみ下限値",
                        "c32_きざみ上限値",
                        "c33_きざみ単位",
                        "c34_きざみ点数",
                        "c35_きざみエラー処理",
                        "c38_注加算コード",
                        "c39_注加算通番",
                        "c43_時間加算区分",
                        "c46_処置乳幼児加算区分",
                        "c47_極低出生体重児加算区分",
                        "c50_検査等実施判断区分",
                        "c51_検査等実施判断グループ区分",
                        "c52_逓減対象区分",
                        "c53_脊髄誘発電位測定等加算区分",
                        "c54_頸部郭清術併施加算区分",
                        "c55_自動縫合器加算区分",
                        "c56_外来管理加算区分",
                        "c62_通則加算所定点数対象区分",
                        "c63_包括逓減区分",
                        "c64_超音波内視鏡加算区分",
                        "c67_自動吻合器加算区分",
                        "c68_告示等識別区分_1",
                        "c82_超音波凝固切開装置等加算区分",
                        "tensu_kbn",
                        "kbn_no",
                        "kbn_eda",
                        "c114_副鼻腔手術用内視鏡加算",
                        "c115_副鼻腔手術用骨軟部組織切除機器加算",
                        "c116_長時間麻酔管理加算",
                        "c119_凍結保存同種組織加算",
                        "c121_創外固定器加算",
                        "c122_超音波切削機器加算",
                    ]
                }
            )

    async def set_medicines_tensu_(self, medicines):
        """
        医薬品の点数を設定する
        """
        target = [m for m in medicines if m.get("tensu") is None]
        if len(target) == 0:
            return
        sorter = itemgetter("code")
        target.sort(key=sorter)
        res = await self.bridge.get_medicine_tensu_in([m.get("code") for m in target])
        for m in target:
            for r in res:
                if m.get("code") == r.get("code"):
                    m["unit_code"] = r.get("unit_code")
                    m["unit"] = r.get("unit")
                    m["tensu_type"] = r.get("tensu_type")
                    m["tensu"] = r.get("tensu")
                    break

    async def set_materials_tensu_(self, materials):
        """
        特定器材の点数を設定する
        バンドル間で重複している物を考慮 ? for m fot t
        """
        target = [m for m in materials if m.get("tensu") is None]
        if len(target) == 0:
            return
        sorter = itemgetter("code")
        target.sort(key=sorter)
        res = await self.bridge.get_material_tensu_in([m.get("code") for m in target])
        for m, r in zip(target, res):
            m.update(
                {
                    k: r.get(k)
                    for k in [
                        "unit_code",
                        "unit",
                        "tensu_type",
                        "tensu",
                        "c21_酸素区分",
                        "c22_特定器材種別",
                        "c23_酸素上限",
                        "c24_フィルム上限点数",
                    ]
                }
            )
