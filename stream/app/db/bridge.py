import json
from .database import insert


class ProcedureNotFoundException(Exception):
    def __init__(self, code, name):
        self.code = code
        self.message = f"{name}({code}) はマスターテーブルに存在しません。"
        super().__init__(self.message)


class DiscontinuedException(Exception):
    def __init__(self, code, name):
        self.code = code
        self.message = f"{name}({code}) は有効期限切れです。"
        super().__init__(self.message)


class Bridge:
    def add_quote(self, string):
        return f"'{string}'"

    def to_in_params(self, lst):
        return ",".join([self.add_quote(code) for code in lst])

    def __init__(self, small, large):
        self.small = small
        self.large = large

    async def fetch_all_as_json(self, conn, sql):
        """
        検索結果を json で返す(Postgres　構文)
        """
        ql_ = f"select row_to_json(t) as record from ({sql}) t"
        rows = await conn.fetch(ql_)
        # row_to_json(t) as 'record'---↓
        return (
            [json.loads(row.get("record")) for row in rows] if rows is not None else []
        )

    async def get_constraints_in(self, code_lst):
        """
        補助テーブルから制約を取得する
        """
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, name, inclusion1, group1, inclusion2, group2, inclusion3, group3, 
            nand_day, nand_month, nand_same, nand_week, admission_charge, calc_count, 
            onset_at, discontinued_at from tbl_helper where code in ({lst})
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_inclusion_in(self, group, code_lst):
        """
        包括制約を取得する
        """
        g = self.add_quote(group)
        lst = self.to_in_params(code_lst)
        sql = f"""
            select group_code, code, name, special_case 
            from tbl_nand_inclusion where group_code = {g} and code in ({lst})
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_nand_day_code12(self, date, code1, code2):
        """
        背反１日を取得する
        """
        cd1 = self.add_quote(code1)
        cd2 = self.add_quote(code2)
        dt = self.add_quote(date)
        sql = f"""
            select code1, name1, code2, name2, exclusive_type, special_case
            from tbl_nand_day 
            where code1 = {cd1} and code2 = {cd2} and discontinued_at >= {dt}
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_nand_month_code12(self, date, code1, code2):
        """
        背反同月を取得する
        """
        cd1 = self.add_quote(code1)
        cd2 = self.add_quote(code2)
        dt = self.add_quote(date)
        sql = f"""
            select code1, name1, code2, name2, exclusive_type, special_case
            from tbl_nand_month 
            where code1 = {cd1} and code2 = {cd2} and discontinued_at >= {dt}
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_nand_same_code12(self, date, code1, code2):
        """
        背反同時を取得する
        """
        cd1 = self.add_quote(code1)
        cd2 = self.add_quote(code2)
        dt = self.add_quote(date)
        sql = f"""
            select code1, name1, code2, name2, exclusive_type, special_case 
            from tbl_nand_same 
            where code1 = {cd1} and code2 = {cd2} and discontinued_at >= {dt}
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_nand_week_code12(self, date, code1, code2):
        """
        背反週を取得する
        """
        cd1 = self.add_quote(code1)
        cd2 = self.add_quote(code2)
        dt = self.add_quote(date)
        sql = f"""
            select code1, name1, code2, name2, exclusive_type, special_case 
            from tbl_nand_week 
            where code1 = {cd1} and code2 = {cd2} and discontinued_at >= {dt}
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_calc_count_in(self, code_lst):
        """
        算定回数制限を取得する
        """
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, name, unit_code, unit_name, upper_limit, special_case 
            from tbl_calculation_count 
            where code in ({lst})
        """
        return await self.fetch_all_as_json(self.small, sql)

    # ------------------------------------------------------------
    # 点数検索
    # １：金額
    # ３：点数（プラス）
    # ４：購入価格（点数）
    # ５：％加算
    # ６：％減算
    # ７：減点診療行為
    # ８：点数（マイナス）
    # 包括対象検査 hokastu_taisyo
    # ------------------------------------------------------------
    async def get_tensu_in(self, code_lst):
        """
        診療行為の点数を取得する
        """
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code,name,unit_code,unit,tensu_type,tensu,claim_class,
            col_016 as c16_包括対象検査,
            col_020 as c20_画像等手術支援加算,
            col_030 as c30_きざみ識別,
            col_031 as c31_きざみ下限値,
            col_032 as c32_きざみ上限値,
            col_033 as c33_きざみ単位,
            col_034 as c34_きざみ点数,
            col_035 as c35_きざみエラー処理,
            col_038 as c38_注加算コード,
            col_039 as c39_注加算通番,
            col_043 as c43_時間加算区分,
            col_046 as c46_処置乳幼児加算区分,
            col_047 as c47_極低出生体重児加算区分,
            col_050 as c50_検査等実施判断区分, 
            col_051 as c51_検査等実施判断グループ区分, 
            col_052 as c52_逓減対象区分,
            col_053 as c53_脊髄誘発電位測定等加算区分,
            col_054 as c54_頸部郭清術併施加算区分,
            col_055 as c55_自動縫合器加算区分,
            col_056 as c56_外来管理加算区分,
            col_062 as c62_通則加算所定点数対象区分,
            col_063 as c63_包括逓減区分,
            col_064 as c64_超音波内視鏡加算区分,
            col_067 as c67_自動吻合器加算区分,
            col_068 as c68_告示等識別区分_1,
            col_082 as c82_超音波凝固切開装置等加算区分,
            tensu_kbn, kbn_no, kbn_eda,
            col_114 as c114_副鼻腔手術用内視鏡加算,
            col_115 as c115_副鼻腔手術用骨軟部組織切除機器加算,
            col_116 as c116_長時間麻酔管理加算,
            col_119 as c119_凍結保存同種組織加算,
            col_121 as c121_創外固定器加算,
            col_122 as c122_超音波切削機器加算 
            from master_procedure 
            where code in ({lst}) order by code
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_medicine_tensu_in(self, code_lst):
        """
        医薬品の点数を取得する
        """
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, name, unit_code, unit, tensu_type, tensu, koseishin, dose_type 
            from master_medicine 
            where code in ({lst}) order by code
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def get_material_tensu_in(self, code_lst):
        """
        特定器材の点数を取得する
        """
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, name, unit_code, unit, tensu_type, tensu,
            col_21 as c21_酸素区分,
            col_22 as c22_特定器材種別,
            col_23 as c23_酸素上限,
            col_24 as c24_フィルム上限点数 
            from master_tool 
            where code in ({lst}) order by code
        """
        return await self.fetch_all_as_json(self.small, sql)

    async def stream_get_karte(self, id_):
        id_quote = self.add_quote(id_)
        group = self.add_quote("999")  # 病名を含む
        sql = f"""
            select row_to_json(t) as record from (
            with bundles as (
                select b.karte_id, b.facility_id, b.patient_id, b.his_id, b.provider_number, b.created_at, b.updated_at, b.status, 
                b.group, b.entity, b.name, b.quantity, b.unit, b.issued_to, b.oral, b.prn, b.topical, b.temporary, b.freq_per_day,
                (select json_agg(c) from (select i.code, i.name, i.quantity, i.unit from m_claim_item i where i.bundle_id = b.id) c) as claim_items 
                from m_bundle b
            ), his as (
                select h.*,
                (select json_agg(p.*) from m_public_health_insurance p where p.insurance_id = h.id) as public_insurance
                from m_health_insurance h
            ), ts as (
                select t.id, t.facility_id,
                (select json_agg(h) from (select name from m_holiday where schedule_id = t.id) h) as holidays,
                (select json_agg(w) from (select day, name, am_start, am_end, pm_start, pm_end from m_week_schedule where schedule_id = t.id) w) as week_days
                from m_time_schedule t
            )
            select
                k.*,
                (select json_agg(b.*) from bundles b where b.karte_id = k.id and b.group <= {group}) as p,
                (select to_json(h.*) from his h where h.id = k.his_id) as his,
                (select to_json(t.*) from ts t where t.facility_id = k.facility_id) as time_schedule,
                (select json_agg(n.*) from m_notification n where n.facility_id = k.facility_id) as notification,
                (select to_json(f) from (select id, name, telephone from m_facility where id = k.facility_id) f) as facility,
                (select to_json(u) from (select id, full_name, license from m_user where id = k.physician_id) u) as user,
                (select to_json(p) from (select id, pt_id, full_name, kana, gender, dob from m_patient where id = k.patient_id) p) as patient
                from (select * from m_karte_entry where id = {id_quote}) as k
        )t
        """
        row = await self.large.fetchrow(sql)
        return json.loads(row.get("record")) if row is not None else None

    async def count_procedures_in(self, fc_id, pt_id, start, end, code_lst):
        """
        指定期間内の診療行為の実績件数を取得する
        fc_id, pt_id = uuid
        start end = yyyy-mm-dd:T00:00:00
        code_list = 取得する診療行為のコードリスト
        table = r_item
        """
        fc = self.add_quote(fc_id)
        pt = self.add_quote(pt_id)
        st = self.add_quote(start)
        en = self.add_quote(end)
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, count(code) as actual_count from r_item
            where facility_id = {fc} and patient_id = {pt} and (created_at between {st} and {en}) and status = 'F' and code in ({lst}) 
            group by code order by code
        """
        return await self.fetch_all_as_json(self.large, sql)

    async def count_patient_procedures(self, fc_id, pt_id, code_lst):
        """
        患者あたりの算定回数を取得する
        fc_id, pt_id = uuid
        code_list = 取得する診療行為のコードリスト
        table = r_item
        """
        fc = self.add_quote(fc_id)
        pt = self.add_quote(pt_id)
        lst = self.to_in_params(code_lst)
        sql = f"""
            select code, count(code) as actual_count from r_item 
            where facility_id = {fc} and patient_id = {pt} and status = 'F' and code in ({lst}) 
            group by code order by code
        """
        return await self.fetch_all_as_json(self.large, sql)

    async def save_receipt(self, receipt):
        """
        レセプトを作成し保存する
        outdate 処理はカルテの修正時に行われている　実績を取得するため、必ず実行されている
        """
        async with self.large.transaction():
            for bdl in receipt.get("p"):
                await insert(self.large, "r_bundle", bdl)
                for ci in bdl.get("receipt_items"):
                    await insert(self.large, "r_item", ci)
            # Outdate -> Already done in the process of update karte
            return 1

    async def update_pvt_status(self, pvt_id, status):
        """
        診療情報のステータスを更新する
        """
        sql = f"update m_patient_visit set status = {self.add_quote(status)} where id = {self.add_quote(pvt_id)}"
        await self.large.execute(sql)
        return 1
