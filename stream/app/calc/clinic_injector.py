from itertools import groupby
from pathlib import Path
import csv
from .auto_injector import AutoInjector
from ..util.tracer import get_logger


class ClinicInjector(AutoInjector):
    """
    軽量版の依存性注入クラス
    """

    FILE_DIR = "app/data"

    def __init__(self):
        super().__init__()

    def inject_from(self, karte):
        """
        依存性注入を行う
        """
        bundles = karte.get("p")
        bundles.sort(key=lambda x: x.get("group"))
        auto_injections = []
        variables = set()
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
                items = self.inject_from_group(f"auto_{b}.csv", g)
                if items and len(items) == 2:
                    auto_injections += items[0]
                    variables = variables.union(items[1])
        if len(rp) > 0:
            items = self.inject_from_group("auto_200.csv", rp)
            if items and len(items) == 2:
                auto_injections += items[0]
                variables = variables.union(items[1])
        if len(inj) > 0:
            items = self.inject_from_group("auto_300.csv", inj)
            if items and len(items) == 2:
                auto_injections += items[0]
                variables = variables.union(items[1])

        return auto_injections, variables

    def inject_from_group(self, file, group):
        """
        CSV ファイルから加算診療行為を読み込む
        """
        file_path = Path(f"{self.FILE_DIR}/{file}")
        if not file_path.exists():
            return None

        procedures = []
        for b in group:
            procedures += [
                i
                for i in b.get("claim_items")
                if i.get("code").startswith("1") and len(i.get("code")) == 9
            ]
        injections = []
        variables = set()

        with open(file_path, "r") as f:
            for line in csv.reader(f):
                if line[0].startswith("---"):
                    continue
                entity = line[0]
                code = line[1]
                name = line[2]
                logic = line[3]
                """
                論理式の中の変数を抽出する
                """
                flats = (
                    logic.replace("And(", "")
                    .replace("Or(", "")
                    .replace("Not(", "")
                    .replace(")", "")
                    .split(",")
                )
                for v in flats:
                    variables.add(v)
                """
                カルテの全診療行為の中に同じcodeを持つものがある場合、その診療行為のis_toreruを更新する
                """
                proc = [p for p in procedures if p.get("code") == code]
                if len(proc) > 0:
                    for p in proc:
                        p["is_toreru"] = logic
                    continue
                """
                診療行為がカルテにない場合は追加 -> Auto Injection
                """
                inj = dict()
                inj["code"] = code
                inj["name"] = name
                inj["entity"] = entity
                inj["is_toreru"] = logic  # And(初診, 時間外) etc
                """
                外来迅速検査加算（に限らないけど）の項目数をカウントする
                """
                if len(line) > 4:
                    target = self.read_items_from(line[4])
                    cnt = len([p for p in procedures if p.get("code") in target])
                    if cnt > 0:
                        """
                        外来迅速検査加算の項目数
                        """
                        inj["quantity"] = str(cnt)  # string
            
                injections.append(inj)

        get_logger(__name__).debug(f"Auto Injection: {injections}")
        get_logger(__name__).debug(f"Variables: {variables}")
        return injections, variables

    def read_items_from(self, file):
        target = []
        path_to_file = Path(f"{self.FILE_DIR}/{file}")
        with open(path_to_file, "r") as f:
            for line in csv.reader(f):
                target.append(line[0])
        return target
