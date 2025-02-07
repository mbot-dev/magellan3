import os
from operator import itemgetter
from itertools import groupby
import json
import asyncpg
from .receipt_builder import ReceiptDirector
from ..util.tracer import get_logger, pretty_dumps

class MonthlyDirector(ReceiptDirector):
    debug = True
    limit = 100

    def __init__(self, facility_id, start, end, builder):
        self.facility_id = facility_id
        self.facility = None
        self.start = start
        self.end = end
        self.builder = builder
    
    @staticmethod
    def add_quote(stri):
        return f'\'{stri}\''
    
    @staticmethod
    async def get_connections():
        dsn_large = os.getenv('DSN_KARTE', "postgresql://large:large_user@localhost:6543/large")
        return await asyncpg.connect(dsn_large)
    
    def get_count_query(self, facility_id, start, end):
        """
        対象期間内にカルテが作成された患者数を取得する
        """
        return f"""
            select count(distinct patient_id) from m_karte_entry 
            where facility_id={facility_id} and created_at between {start} and {end} and status='F'
        """

    def get_patients_query(self, facility_id, start, end, limit, offset):
        """
        対象期間内にカルテが作成された患者を取得する
        """
        return f"""
            select patient_id from m_karte_entry 
            where facility_id={facility_id} and created_at between {start} and {end} and status='F'
            group by patient_id order by patient_id
            limit {limit} offset {offset}
        """
    
    def get_diagnosis_query(self, start):
        """
        継続中の疾患 + 対象期間開始以降に転帰した疾患を取得する
        """
        return f"""
            select json_agg(a) from (
                select d.id, d.facility_id, d.patient_id, 
                d.code, d.name, d.modifier, diagnosis_category,
                d.date_of_onset, d.date_of_remission, outcome 
                from m_diagnosis d 
                where d.patient_id = rb.patient_id and (d.date_of_remission = '' or d.date_of_remission >= {start})
            ) a
        """
    
    def get_month_query(self, patients, diagnosis, start, end):
        pt_agg = """
            select to_json(a) from (
                select pt.id, pt.pt_id, pt.full_name, pt.kana, pt.gender, pt.dob 
                from m_patient pt 
                where pt.id = rb.patient_id
            ) a
        """
        pub_agg = """
            select json_agg(a) from (
                select pub.* from m_public_health_insurance pub where pub.insurance_id = his.id
            ) a
        """
        his_agg = f"""
            select to_json(a) from (
                select his.provider_number, his.person_symbol, his.person_number, his.relation_to_person, his.rate_out_patient, his.expired_date, ({pub_agg}) as pub
                from m_health_insurance his 
                where his.id = rb.his_id
            ) a
        """
        item_agg = """
            select json_agg(a) from (
                select i.code, i.name, i.rcp_tensu, i.rcp_kaisu, i.rcp_quantity, i.rcp_unit_code, i.rcp_date
                from r_item i 
                where i.bundle_id = rb.id
            ) a
        """
        fc_agg = """
            select to_json(a) from (
                select fc.id, fc.name, fc.prefecture_code, fc.insurance_facility_code, fc.telephone 
                from m_facility fc 
                where fc.id = rb.facility_id
            ) a
        """
        bundles = f"""
            select row_to_json(a) as record from (
                select rb.facility_id, rb.patient_id, rb.created_at, rb.rcp_provider_number, rb.rcp_code, rb.rcp_name, rb.rcp_tensu, rb.rcp_kaisu, rb.rcp_examined_at, rb.rcp_day_at, rb.rcp_claim_month, rb.rcp_cover_cost, rb.rcp_hash,
                ({item_agg}) as receipt_items,
                ({diagnosis}) as diagnosis,
                ({fc_agg}) as facility,
                ({pt_agg}) as patient,
                ({his_agg}) as his from r_bundle rb
                inner join ({patients}) pts on rb.patient_id = pts.patient_id
                where rb.created_at between {start} and {end} and rb.status='F'
                order by rb.patient_id
            ) a
        """
        return bundles
    
    async def count_patients(self):
        try:
            large = await MonthlyDirector.get_connections()
            facility_quote = MonthlyDirector.add_quote(self.facility_id)
            start_quote = MonthlyDirector.add_quote(self.start)
            end_quote = MonthlyDirector.add_quote(self.end)
            sql = self.get_count_query(facility_quote, start_quote, end_quote)
            return await large.fetchval(sql)
        finally:
            await large.close()
    
    async def fetch_data(self, limit, offset):
        try:
            large = await MonthlyDirector.get_connections()
            facility_quote = MonthlyDirector.add_quote(self.facility_id)
            start_quote = MonthlyDirector.add_quote(self.start)
            end_quote = MonthlyDirector.add_quote(self.end)
            patients = self.get_patients_query(facility_quote, start_quote, end_quote, limit, offset)
            diagnosis = self.get_diagnosis_query(start_quote)
            sql = self.get_month_query(patients, diagnosis, start_quote, end_quote)
            rows = await large.fetch(sql)
            data = [json.loads(row.get('record')) for row in rows] if rows else []
            if not self.facility:
                self.facility = data[0].get('facility')
            return data
        finally:
            await large.close()

    async def construct(self):
        try:
            num_patients_in_period = await self.count_patients()
            get_logger(__name__).info(f'Number of patients: {self.facility_id} {self.start} {self.end} {num_patients_in_period}')
            num_pages = num_patients_in_period // self.limit
            if num_patients_in_period % self.limit:
                num_pages += 1
            
            for i in range(num_pages):
                offset = i * self.limit
                data = await self.fetch_data(self.limit, offset)  # N人ずつ取得
                if self.debug:
                    get_logger(__name__).info(pretty_dumps(data, 'data'))
                pt_grouper = itemgetter('patient_id')
                for _, mem in groupby(data, pt_grouper):  # 患者ごとにまとめる
                    gl = list(mem)
                    self.builder.build_receipt(gl)

            self.builder.build_facility(self.facility, self.start)  # Header
            self.builder.build_claim_info()  # Claim info
            csv = self.builder.get_result()  # 1 facility 1 file csv  
            if self.debug:
                get_logger(__name__).info(csv)
        except Exception as e:
            print(e)
         