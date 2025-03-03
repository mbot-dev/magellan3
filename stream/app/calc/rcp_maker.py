from itertools import groupby
from operator import itemgetter
import shortuuid
from z3 import *
from .rcp_abstract import Receipt
from .rcp_comment import RcpComment
from .rcp_procedure import RcpProcedure
from .rcp_medicine import RcpMedicine
from .rcp_material import RcpMaterial
from .rcp_oxgen import RcpOxgen
from .rcp_nitrogen import RcpNitrogen
from . import rcp_helper as h
from .rcp_const import SI_診療行為, IY_医薬品, TO_特定器材, CO_コメント
from .exceptions import NotSatisfiedException
from .utils import day_from_created_at
from ..util.tracer import get_logger, pretty_dumps

class RcpMaker(Receipt):

    def __init__(self) -> None:
        super().__init__()

    @staticmethod
    def create_o2_correction_factor():
        item = dict()
        item['code'] = '770020070'
        item['name'] = '酸素補正率１．３（１気圧）'
        item['tensu_type'] = '5'
        item['tensu'] = '30.0'
        return item

    @staticmethod
    def create_o2_pressure_addition(pressure=2):
        item = dict()
        item['code'] = '770030070'
        item['name'] = '高気圧酸素加算'
        item['tensu_type'] = '9'
        item['tensu'] = pressure  # マスターの値 0.00
        return item

    @staticmethod
    def film_charge_for_children():
        item = dict()
        item['code'] = '799990070'
        item['name'] = 'フィルム料（乳幼児）加算'
        item['tensu_type'] = '5'
        item['tensu'] =  '10.00'
        return item

    def create_rcp_bundle(self, normalized):
        karte_attr = ['karte_id', 'facility_id', 'patient_id', 'his_id', 'created_at', 'updated_at', 'status']
        claim_attr = ['group', 'entity', 'unit', 'issued_to', 'oral', 'prn', 'topical', 'temporary', 'freq_per_day']
        lab_attr = ['round_group', 'round_tensu']
        receipt_attr = ['rcp_code', 'rcp_name', 'rcp_tensu', 'rcp_kaisu', 'rcp_hash']
        b = dict()
        b['id'] = shortuuid.uuid()
        b['receipt_items'] = []
        for key in karte_attr:
            b[key] = normalized.get(key)
        for key in claim_attr:
            b[key] = normalized.get(key) if normalized.get(key) else ''
        for key in lab_attr:
            b[key] = normalized.get(key) if normalized.get(key) else ''
        for key in receipt_attr:
            b[key] = normalized.get(key) if normalized.get(key) else ''
        #------------------------------------------------------------
        b['rcp_provider_number'] = normalized.get('provider_number', '')  # 診療所番号
        b['rcp_kaisu'] = normalized.get('quantity', '1')  # 回数に相当 必須
        b['rcp_cover_cost'] = normalized.get('cover_cost', '1')  # 負担区分 必須  ToDo
        b['rcp_class'] = normalized.get('receipt_class', '')  # レセプト種別
        created = normalized.get('created_at').replace('-', '')
        b['rcp_examined_at'] = created[0:8] # 算定日 実日数算定用  YYYYMMDD
        b['rcp_day_at'] = created[6:8] # 算定日
        b['rcp_claim_month'] = created[0:6] # 請求月  YYYYMM
        b['injected'] = normalized.get('injected', False)  # 自動注入フラグ
        #------------------------------------------------------------
        return b
    
    def create_rcp_item(self, ci):
        keys = ['code', 'name', 'unit_code', 'unit', 'tensu_type', 'tensu', 'quantity']
        receipt = ['rcp_rec_type', 'rcp_code', 'rcp_cover_cost', 'rcp_quantity', 'rcp_tensu', 'rcp_kaisu', 'rcp_unit_code', 'rcp_unit_price', 'rcp_spare', 'rcp_product_name', 'rcp_cmt_code_1', 'rcp_cmt_name_1', 'rcp_cmt_code_2', 'rcp_cmt_name_2', 'rcp_cmt_code_3', 'rcp_cmt_name_3']
        item = dict()
        item['id'] = shortuuid.uuid()
        for k in keys:
            item[k] = ci.get(k) if ci.get(k) else ''
        for k in receipt:
            item[k] = ''
        
        if h.is_procedure(ci):
            item['rcp_rec_type'] = SI_診療行為
            attrs = [h.KOKUJI_SHIKIBESTU_KBN, h.CHU_KASAN_CODE, h.CHU_KASAN_TSUUBAN, h.TSUSOKU_KASAN_TAISHO, h.TEIGEN_TAISHO_KBN, h.KIZAMI_SHIKIBETSU]
            for k in attrs:
                item[k] = ci.get(k) if ci.get(k) else ''
            if h.is_kizami_procedure(ci):
                keys = ['tensu', h.KIZAMI_LOWER_LIMIT, h.KIZAMI_UPPER_LIMIT, h.KIZAMI_STEP, h.KIZAMI_TENSU, 'quantity']
                for k in keys:
                    item[k] = ci.get(k)
            return item
        
        if h.is_medicine(ci):
            item['rcp_rec_type'] = IY_医薬品
            return item
        
        if h.is_material(ci):
            item['rcp_rec_type'] = TO_特定器材
            o2 = [h.c_酸素区分, h.c_特定器材種別, h.c_酸素上限, h.c_フィルム上限点数]
            for k in o2:
                item[k] = ci.get(k) if ci.get(k) else ''
            return item
        
        if h.is_comment(ci):
            item['rcp_rec_type'] = CO_コメント
            return item
        return None
    
    def set_relations(self, rcp):
        tensu = str(sum([int(it.get('rcp_tensu')) for it in rcp.get('receipt_items') if it.get('rcp_tensu') != '']))
        rcp['rcp_tensu'] = tensu
        hash_entries = [it.get('code') for it in rcp.get('receipt_items')] # 同一点数・同一算定回数 + item_code（もしかしたら）
        rcp['rcp_hash'] = str(hash(''.join(hash_entries)))
        keys = ['facility_id', 'patient_id', 'created_at', 'updated_at', 'status']
        for index, it in enumerate(rcp.get('receipt_items'), 1):
            it['bundle_id'] = rcp.get('id')
            it['rcp_batch_no'] = index
            it['rcp_code'] = rcp.get('rcp_code') if index == 1 else ''
            for key in keys:
                it[key] = rcp.get(key)
        return rcp
    
    def calculate(self, normalized):
        rcp = self.create_rcp_bundle(normalized)
        items = 'claim_items'
        procedures = [self.create_rcp_item(p) for p in normalized.get(items) if h.is_procedure(p)]
        medicines = [self.create_rcp_item(m) for m in normalized.get(items) if h.is_medicine(m)]
        materials = [self.create_rcp_item(m) for m in normalized.get(items) if h.is_material(m)]
        comments = [self.create_rcp_item(c) for c in normalized.get(items) if h.is_comment(c)]
        o20 = []
        nitrogen = []
        other_mat = []
        if len(materials) > 0:
            grouper = itemgetter(h.c_酸素区分)
            materials.sort(key=grouper)
            for key, mem in groupby(materials, grouper):
                if key == '0': # 酸素以外
                    other_mat.extend(list(mem))
                elif key == '9': # 窒素
                    nitrogen.extend(list(mem))
                elif key != '1': # 除く 補正コードと気圧コード
                    o20.extend(list(mem))
        oxygen = []
        for o in o20:
            oxygen.append(o)
            oxygen.append(self.create_rcp_item(RcpMaker.create_o2_correction_factor()))
            pressure = o.get('air_pressure', '1')
            if pressure != '1':
                oxygen.append(RcpMaker.create_o2_pressure_addition(pressure))

        children = []
        if len(comments) > 0:
            children.append(RcpComment(rcp, comments))
        if len(procedures) > 0:
            children.append(RcpProcedure(rcp, procedures))
        if len(medicines) > 0:
            children.append(RcpMedicine(rcp, medicines))
        if len(other_mat) > 0:
            children.append(RcpMaterial(rcp, other_mat))
        if len(oxygen) > 0:
            children.append(RcpOxgen(rcp, oxygen))
        if len(nitrogen) > 0:
            children.append(RcpNitrogen(rcp, nitrogen))

        p = []
        cover_cost = String('cover_cost')
        santei_date = Int('santei_date')
        kaisu = Int('kaisu')
        p.append(If(cover_cost == StringVal(''), False, True))
        p.append(If(And(santei_date >= 1, santei_date <= 31), True, False))
        p.append(If(And(kaisu >= 1, kaisu <= 99), True, False))
        p.append(cover_cost == StringVal(rcp.get('rcp_cover_cost')))
        p.append(santei_date == day_from_created_at(rcp.get('created_at')))
        p.append(kaisu == IntVal(rcp.get('rcp_kaisu')))
        
        for c in children:
            p.extend(c.submit_propositions())

        s = Solver()
        s.add(And(p))
        if s.check() != sat:
            get_logger(__name__).error('unsat')
            raise NotSatisfiedException()
        
        get_logger(__name__).info(f'{rcp.get("rcp_code")} sat!')
        m = s.model()
        for c in children:
            c.store_model(m)

        rcp['receipt_items'] = comments + procedures + medicines + other_mat + oxygen + nitrogen
        rcp = self.set_relations(rcp)
        get_logger(__name__).debug(pretty_dumps(rcp, 'z3 result'))

        return rcp