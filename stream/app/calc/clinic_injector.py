from itertools import groupby
from pathlib import Path
import csv
from z3 import Bools
from .auto_injector import AutoInjector


class ClinicInjector(AutoInjector):
    """軽量版の依存性注入クラス"""

    FILE_DIR = "app/data"

    bool_names = [
        "初診",
        "時間外",
        "休日",
        "深夜",
        "乳幼児6",
        "小児科",
        "夜早",
        "再診",
        "明",
        "外来管理",
        "院内処方",
        "院外処方",
        "リフィル",
        "向精神多剤",
        "向精神長期",
        "内服7種類以上",
        "乳幼児3",
        "向調連",
        "特処1",
        "特処2",
        "般1",
        "般2",
        "時間外2",
        "休日2",
        "深夜2",
        "乳幼児3_110",
        "乳幼児3_55",
        "乳幼児6_110",
        "乳幼児6_83",
        "乳幼児6_55",
        "耳鼻咽喉科",
        "乳幼児6",
        "bv",
        "判尿",
        "判血",
        "判生1",
        "判生2",
        "判免",
        "判微",
        "判遺",
        "外迅検",
        "緊検",
        "検管1",
        "検査逓減",
    ]

    def __init__(self):
        super().__init__()

    def inject_ctx(self):
        (
            初診,
            時間外,
            休日,
            深夜,
            乳幼児6,
            小児科,
            夜早,
            再診,
            明,
            外来管理,
            院内処方,
            院外処方,
            リフィル,
            向精神多剤,
            向精神長期,
            内服7種類以上,
            乳幼児3,
            向調連,
            特処1,
            特処2,
            般1,
            般2,
            時間外2,
            休日2,
            深夜2,
            乳幼児3_110,
            乳幼児3_55,
            乳幼児6_110,
            乳幼児6_83,
            乳幼児6_55,
            耳鼻咽喉科,
            乳幼児6,
            bv,
            判尿,
            判血,
            判生1,
            判生2,
            判免,
            判微,
            判遺,
            外迅検,
            緊検,
            検管1,
            検査逓減,
        ) = Bools(self.bool_names)
        ctx = [
            初診,
            時間外,
            休日,
            深夜,
            乳幼児6,
            小児科,
            夜早,
            再診,
            明,
            外来管理,
            院内処方,
            院外処方,
            リフィル,
            向精神多剤,
            向精神長期,
            内服7種類以上,
            乳幼児3,
            向調連,
            特処1,
            特処2,
            般1,
            般2,
            時間外2,
            休日2,
            深夜2,
            乳幼児3_110,
            乳幼児3_55,
            乳幼児6_110,
            乳幼児6_83,
            乳幼児6_55,
            耳鼻咽喉科,
            乳幼児6,
            bv,
            判尿,
            判血,
            判生1,
            判生2,
            判免,
            判微,
            判遺,
            外迅検,
            緊検,
            検管1,
            検査逓減,
        ]
        return ctx

    def inject_from(self, karte):
        """
        依存性注入を行う
        """
        bundles = karte.get("p")
        bundles.sort(key=lambda x: x.get("group"))
        items = []
        rp = []
        inj = []
        for b, g in groupby(bundles, lambda x: x.get("group")):
            if b.startswith("0"):
                continue
            elif b.startswith("2"):
                rp += g
            elif b.startswith("3"):
                inj += g
            else:
                items += self.inject_from_group(f"auto_items_{b}.csv", g)
        if len(rp) > 0:
            items += self.inject_from_group("auto_items_200.csv", rp)
        if len(inj) > 0:
            pass
            # items =+ self.inject_from_group('auto_items_300.csv', inj)
        return items, self.bool_names, self.inject_ctx()

    def inject_from_group(self, file, group):
        """
        CSV ファイルから加算診療行為を読み込む
        """
        file_path = Path(f"{self.FILE_DIR}/{file}")
        if not file_path.exists():
            return []
        procedures = []
        for b in group:
            procedures += [
                i
                for i in b.get("claim_items")
                if i.get("code").startswith("1") and len(i.get("code")) == 9
            ]
        additions = []
        with open(file_path, "r") as f:
            for line in csv.reader(f):
                if line[0].startswith("---"):
                    continue
                kbn, code, name, entity = line[:4]
                methods = line[4:]  # And(初診, 時間外) etc
                logic = None
                count_in_file = None
                if len(methods) == 1:
                    test = methods[0].split("^")  # And(外迅検)^gaizinken.csv
                    if len(test) == 2:
                        logic = test[0]  # And(外迅検)
                        count_in_file = test[1]  # gaizinken.csv
                    else:
                        logic = methods[0]  # And(判血)
                else:
                    logic = ",".join(methods)
                """
                カルテの全診療行為の中に同じcodeを持つものがある場合、その診療行為のis_satisfiedを更新する
                """
                proc = [p for p in procedures if p.get("code") == code]
                if len(proc) > 0:
                    for p in proc:
                        p["is_satisfied"] = logic
                    continue
                """
                診療行為がカルテにない場合は追加
                """
                if kbn == "1":
                    inj = dict()
                    inj["code"] = code
                    inj["name"] = name
                    inj["entity"] = entity
                    inj["is_satisfied"] = logic  # And(初診, 時間外) etc
                    if count_in_file:
                        target = self.read_items_from(count_in_file)
                        cnt = len([p for p in procedures if p.get("code") in target])
                        if cnt > 0:
                            """
                            外来迅速検査加算の項目数
                            """
                            inj["quantity"] = str(cnt)  # string
                            additions.append(inj)
                    else:
                        additions.append(inj)
        return additions

    def read_items_from(self, file):
        target = []
        with open(f"{self.FILE_DIR}/{file}", "r") as f:
            for line in csv.reader(f):
                target.append(line[0])
        return target

