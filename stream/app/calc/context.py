from datetime import datetime
from pathlib import Path
import csv
from flaretool.holiday import JapaneseHolidays
from ..util.tracer import get_logger, pretty_dumps

"""
加算数 1148 select tensu_kbn, kbn_no, code, name, unit, col_068 from master_procedure where hosp_clinic_flg!='1' and in_out_flg !='1' and name ~ '加算' order by tensu_kbn, kbn_no, code;
加算数 1825 select tensu_kbn, kbn_no, code, name, unit, col_068 from master_procedure where name ~ '加算' order by tensu_kbn, kbn_no, code;
"""

DEBUG = False

class Context:
    PATH_GAIZINKEN = Path("app/data/gaizinken.csv")

    week_day_dict = {"mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}

    def is_procedure(self, p):
        return (
            True if p.get("code").startswith("1") and len(p.get("code")) == 9 else False
        )

    def is_medicine(self, m):
        return (
            True if m.get("code").startswith("6") and len(m.get("code")) == 9 else False
        )

    def is_material(self, m):
        return (
            True if m.get("code").startswith("7") and len(m.get("code")) == 9 else False
        )

    def __init__(self, karte):
        super().__init__()
        self.karte = karte
        self.age: int
        self.holiday_of_week = None
        self.amst = None
        self.amed = None
        self.pmst = None
        self.pmed = None
        self.notification: dict
        self.setup()

    def setup(self):
        self.age = self.calculate_age()
        self.notification = dict()

        if self.karte.get("notification") and len(self.karte.get("notification")) > 0:
            for n in self.karte.get("notification"):
                self.notification[n.get("name")] = n.get("code")

        try:
            ts = self.karte.get("time_schedule")
            holidays = ts.get("holidays")
            week_days = ts.get("week_days")

            # 休診日
            for h in holidays:
                test = self.week_day_dict.get(
                    h.get("name")
                )  # h[name]=mon, tue, wed, thu, fri, sat
                if test is not None:  # test = day_of_week 1 to 6
                    self.holiday_of_week = test
                    break

            # カルテが作成された日の標榜時間を取得
            created_weekday = self.datetime_from_created_at().isoweekday() # 1(Mon) to 7(Sun)
            for w in week_days:
                if w.get("day") == created_weekday:  # compare with isoweekday
                    self.amst = datetime.strptime(w.get("am_start"), "%H:%M").time() if w.get("am_start") else None
                    self.amed = datetime.strptime(w.get("am_end"), "%H:%M").time() if w.get("am_end") != "" else None
                    self.pmst = datetime.strptime(w.get("pm_start"), "%H:%M").time() if w.get("pm_start") != "" else None
                    self.pmed = datetime.strptime(w.get("pm_end"), "%H:%M").time() if w.get("pm_end") != "" else None
                    break
            if DEBUG:
                get_logger(__name__).info(f"休日: {holidays}")
                get_logger(__name__).info(f"週日: {week_days}")
                get_logger(__name__).info(f"休診日: {self.holiday_of_week}")
                get_logger(__name__).info(f"カルテ作成曜日: {created_weekday}")
                get_logger(__name__).info(f"午前開始: {self.amst}")
                get_logger(__name__).info(f"午前終了: {self.amed}")
                get_logger(__name__).info(f"午後開始: {self.pmst}")
                get_logger(__name__).info(f"午後終了: {self.pmed}")
        except Exception as e:
            print(e)

    def get_karte(self):
        return self.karte

    def get_karte_id(self):
        return self.get_karte().get("id")

    def get_facility_id(self):
        return self.get_karte().get("facility_id")

    def get_dept_code(self):
        return self.get_karte().get("dept_id")

    def get_dept_name(self):
        return self.get_karte().get("dept_name")

    def get_patient(self):
        return self.get_karte().get("patient")

    def get_patient_id(self):
        return self.get_patient().get("id")

    def get_his(self):
        return self.get_karte().get("his")

    def get_his_id(self):
        return self.get_his().get("id")

    def get_provider_number(self):
        return self.get_his().get("provider_number")

    def get_created_at(self):
        return self.karte.get("created_at")

    def get_updated_at(self):
        return self.karte.get("updated_at")

    def get_status(self):
        return self.karte.get("status")

    def datetime_from_created_at(self):
        return datetime.strptime(self.karte.get("created_at"), "%Y-%m-%dT%H:%M:%S%z")

    def calculate_age(self):
        birth_date = datetime.strptime(self.get_patient().get("dob"), "%Y-%m-%d")
        created_date = datetime.strptime(self.get_created_at(), "%Y-%m-%dT%H:%M:%S%z")
        return (
            created_date.year
            - birth_date.year
            - (
                (created_date.month, created_date.day)
                < (birth_date.month, birth_date.day)
            )
        )

    def time_from_datetime(self, dt):
        return dt.time().replace(second=0, microsecond=0)

    def return_time_from(self, hours, minutes):
        return (
            datetime.now()
            .time()
            .replace(hour=hours, minute=minutes, second=0, microsecond=0)
        )

    # --------------------------------------------------------------------------------------------
    def 乳幼児3(self):
        return self.age < 3

    def 乳幼児6(self):
        return self.age < 6

    # --------------------------------------------------------------------------------------------
    def 日曜日(self):
        dt = self.datetime_from_created_at()
        return dt.isoweekday() == 7

    def 祝日(self):
        dt = self.datetime_from_created_at()
        return True if JapaneseHolidays().get_holiday_name(dt) is not None else False

    def 休日(self):
        return self.日曜日() or self.祝日()

    def 休診日(self):
        if not self.holiday_of_week:
            return False
        dt = self.datetime_from_created_at()
        return dt.isoweekday() == self.holiday_of_week

    def 深夜(self):
        dt = self.datetime_from_created_at()
        return (22 <= dt.hour <= 24) or (0 <= dt.hour <= 6)

    def 夜間(self):
        return False  # Todo

    def 標榜時間(self):
        t = self.time_from_datetime(self.datetime_from_created_at())  # 10:00 ..
        get_logger(__name__).info(f"Karte created at: {t}")
        in_am = False
        in_pm = False
        if self.amst and self.amed:
            in_am = self.amst <= t <= self.amed
        if self.pmst and self.pmed:
            in_pm = self.pmst <= t <= self.pmed
        get_logger(__name__).info(f"標榜時間: {in_am} {in_pm}")
        return in_am or in_pm

    def 時間内(self):
        if self.深夜():
            return False
        if self.休日():
            return False
        if self.休診日():
            return False
        return self.標榜時間()

    def 時間外(self):
        if self.深夜():
            return False
        if self.休日():
            return False
        if self.休診日():
            return True
        return not self.標榜時間()

    def 夜早(self):
        dt = self.datetime_from_created_at()
        return self.時間内() and (6 <= dt.hour <= 8 or 18 <= dt.hour <= 22)

    # --------------------------------------------------------------------------------------------
    def 施設基準(self, name):
        return self.notification.get(name, False)

    def 届出(self, name):
        return self.施設基準(name)

    def 体制(self, name):
        return self.施設基準(name)

    def 小児科(self):
        return self.get_karte().get("dept_id") == "09"

    def 小児外科(self):
        return self.get_karte().get("dept_id") == "09"  # Todo

    def 耳鼻咽喉科(self):
        return self.get_karte().get("dept_id") == "27"

    # --------------------------------------------------------------------------------------------
    def 初診(self):
        bundles = [b for b in self.get_karte().get("p") if b.get("group") == "110"]
        return len(bundles) == 1

    def 再診(self):
        bundles = [b for b in self.get_karte().get("p") if b.get("group") == "120"]
        return len(bundles) == 1

    # --------------------------------------------------------------------------------------------
    def 特定疾患(self):
        disease = []
        bundles = [b for b in self.get_karte().get("p") if b.get("group") == "000"]
        for b in bundles:
            disease += [d for d in b.get("claim_items")]
        return len([d for d in disease if d.get("tokutei_shikkan") == 5]) > 0

    def 文書にて説明(self, name):
        return self.get_karte().get(name, True)
    
    def 疾患(self):
        return False
    
    def 疾患2(self):
        return False

    # --------------------------------------------------------------------------------------------
    def 外来管理(self):
        procedures = []
        for b in self.karte.get("p"):
            procedures += [
                p
                for p in b.get("claim_items")
                if self.is_procedure(p) and p.get("c56_外来管理加算区分") == "1"
            ]
        return len(procedures) == 0

    # --------------------------------------------------------------------------------------------
    def get_rp_bundles(self):
        return [b for b in self.get_karte().get("p") if b.get("group").startswith("2")]

    def get_internal_rp(self):
        return [b for b in self.get_rp_bundles() if b.get("issued_to") == "internal"]

    def get_external_rp(self):
        return [b for b in self.get_rp_bundles() if b.get("issued_to") == "external"]

    def get_orals(self):
        return [b for b in self.get_rp_bundles() if b.get("group").startswith("21")]

    def 院内処方(self):
        internal = self.get_internal_rp()
        external = self.get_external_rp()
        return len(internal) > 0 and len(external) == 0

    def 院外処方(self):
        internal = self.get_internal_rp()
        external = self.get_external_rp()
        return len(external) > 0 and len(internal) == 0

    def リフィル(self):  # 2
        return False

    def 向精神多剤(self):  # 2
        med = []
        for b in self.get_orals():
            med += [
                m
                for m in b.get("claim_items")
                if self.is_medicine(m) and m.get("koseishin") == 5
            ]
        return len(med) >= 3

    def 向精神長期(self):  # 2
        return False

    def 内服7種類以上(self):
        #     med = []
        #     for b in self.get_orals():
        #         med += [m for m in b.get('claim_items') if self.is_medicine(m)]
        #     return len(med) >= 7
        return False

    def 向調連(self):  # 2
        return self.院外処方() and self.体制("向調連")

    def 特処1(self):  # 2
        return self.特定疾患()

    def 特処2(self):  # 2
        orals = self.get_orals()
        # Todo 特定疾患に対する薬剤であることが必要
        over_28 = (
            len(
                [
                    b
                    for b in orals
                    if len(b.get("quantity")) >= 28 and b.get("unit") == "日分"
                ]
            )
            > 0
        )
        return self.特定疾患() and over_28

    def 薬剤師常勤(self):
        return self.体制("薬剤師常勤")

    # --------------------------------------------------------------------------------------------
    def 処置イ(self):
        return True

    def 時間外2(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c43_時間加算区分") == "1"]) > 0
        return self.時間外 and has  # 緊急

    def 休日2(self):
        procedures = self.get_procedures("400")
        has = (
            len([p for p in procedures if p.get("c43_時間加算区分") == "1"]) > 0
        )  # 1 ?
        return self.休日 and has

    def 深夜2(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c43_時間加算区分") == "1"]) > 0  # 1?
        return self.深夜 and has

    def 乳幼児3_110(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c46_処置乳幼児加算区分") == "1"]) > 0
        return self.乳幼児3() and has

    def 乳幼児3_55(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c46_処置乳幼児加算区分") == "2"]) > 0
        return self.乳幼児3() and has

    def 乳幼児6_110(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c46_処置乳幼児加算区分") == "3"]) > 0
        return self.乳幼児6() and has

    def 乳幼児6_83(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c46_処置乳幼児加算区分") == "4"]) > 0
        return self.乳幼児6() and has

    def 乳幼児6_55(self):
        procedures = self.get_procedures("400")
        has = len([p for p in procedures if p.get("c46_処置乳幼児加算区分") == "5"]) > 0
        return self.乳幼児6() and has

    # --------------------------------------------------------------------------------------------
    def get_procedures(self, group):
        p = []
        bundles = [b for b in self.karte.get("p") if b.get("group") == group]
        for b in bundles:
            p += [i for i in b.get("claim_items") if self.is_procedure(i)]
        return p

    def bv(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c50_検査等実施判断区分") == "1"
                ]
            )
            > 0
        )

    def 判尿(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "1"
                ]
            )
            > 0
        )

    def 判血(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "2"
                ]
            )
            > 0
        )

    def 判生1(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "3"
                ]
            )
            > 0
        )

    def 判生2(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "4"
                ]
            )
            > 0
        )

    def 判免(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "5"
                ]
            )
            > 0
        )

    def 判微(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "6"
                ]
            )
            > 0
        )

    def 判遺(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c51_検査等実施判断グループ区分") == "7"
                ]
            )
            > 0
        )
    
    def count_gaizinken(self):
        return len([p for p in self.get_procedures("600") if p.get("code") in self.read_items_from(self.PATH_GAIZINKEN)])

    def 緊検(self):
        return False  # self.体制("院内検査") and (self.時間外() or self.休日() or self.深夜())

    def 検管1(self):
        return False  # self.施設基準("検管1") and self.届出("検管1")

    def 病理医常勤(self):
        return self.体制("病理医常勤")

    def 検査逓減(self):
        return (
            len(
                [
                    p
                    for p in self.get_procedures("600")
                    if p.get("c52_逓減対象区分") == "1"
                    and p.get("actual_count", 0) >= 1
                ]
            )
            > 0
        )

    def read_items_from(self, p):
        target = []
        # p = Path(f"{self.FILE_DIR}/{file_name}")
        if not p.exists():
            return target
        with open(p, "r") as f:
            for line in csv.reader(f):
                target.append(line[0])
        return target