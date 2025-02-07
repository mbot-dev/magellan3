from z3 import *
from .s_abstract import S
from . import rcp_helper as h

class SBase(S):

    def __init__(self, context) -> None:
        super().__init__()
        self.context = context
        self.debug = True

    async def aggregate(self):
        pass
    
    def split_procedures_in(self, bundles=None):
        bundles = [b for b in self.context.get_karte().get('p') if b.get('group') == group] if bundles is None else bundles
        toreru = [i for b in bundles for i in b.get('claim_items') if h.is_toreru(i)]
        base = [i for i in toreru if h.is_kihon_item(i)]
        annotations = [i for i in toreru if h.is_chu_item(i)]
        generals = [i for i in toreru if h.is_tsusoku_item(i)]
        return base, annotations, generals
    
    def get_bundles(self, g=None):
        """
        同一グループのバンドルをリストで返す
        """
        if g is None:
            return self.context.get_karte().get('p')
        return [b for b in self.context.get_karte().get('p') if b.get('group') == g]

    def get_procedures(self, g=None):
        """
        同一グループに属する複数のバンドルから診療行為を抽出してリストで返す
        """
        procedures = []
        for b in self.get_bundles(g):
            procedures += [i for i in b.get('claim_items') if h.is_procedure(i)]
        return procedures

    def get_medicines(self, g=None):
        """
        同一グループに属する複数のバンドルから医薬品を抽出し配列で返す
        """
        medicines = []
        for b in self.get_bundles(g):
            medicines += [i for i in b.get('claim_items') if h.is_medicine(i)]
        return medicines

    def get_materials(self, g=None):
        """
        同一グループに属する複数のバンドルから特定機材を抽出し配列で返す
        """
        materials = []
        for b in self.get_bundles(g):
            materials += [i for i in b.get('claim_items') if h.is_material(i)]
        return materials
    
    def bundle_from_injected_item(self, item):
        group = item.get('claim_class')
        receipt_group = f'{group[0:2]}0'  # 11 -> 110, 12 -> 120  claim_class->receipt_group
        entity = item.get('entity', '')
        keys = ['group', 'entity', 'quantity', 'unit', 'issued_to', 'oral', 'prn', 'topical', 'temporary', 'freq_per_day', 'claim_items']
        values = [receipt_group, entity, 1, '', '', '', '', '', '', '', []]
        return {key: value for key, value in zip(keys, values)}
    
    def create_claim_bundle(self, obj):  # obj = class
        karte_attr = ['karte_id', 'facility_id', 'patient_id', 'his_id', 'provider_number', 'created_at', 'updated_at', 'status']
        attrs = ['group', 'entity', 'rcp_code', 'rcp_name']
        b = dict()
        for key in karte_attr:
            b[key] = getattr(self.context, f'get_{key}')()  # method invoke
        for key in attrs:
            b[key] = getattr(obj, key)  # variable get
        b['claim_items'] = []
        return b
    
    def create_81_comment(self, name):
        it = dict()
        it['code'] = '810000001'
        it['name'] = name
        return it
    
    def list_in_list(self, list1, list2, key):
        return [d for d in list1 if d.get(key) in [l.get(key) for l in list2]]
 
    def select_main_items(self, group, filename):
        """
        主たるものを選択する
        """
        procedures = self.get_procedures(group)
        for tp in self.read_csv_as_tupples(filename):
            #1,160151050,グリコアルブミン,160142350,１．５ＡＧ,160010010,ＨｂＡ１ｃ
            cnt = int(tp[0])
            target = tp[1:]
            code_list = [target[i] for i in range(0, len(target)) if i % 2 == 0]  # get even items in target
            in_list = [p for p in procedures if p.get('code') in code_list]
            if len(in_list) == 0:
                continue
            if len(in_list) == cnt:
                for p in in_list:
                    p['is_main_item'] = True
                continue
            in_list.sort(key=lambda x: x.get('tensu'), reverse=True)
            for i, p in enumerate(in_list):
                p['is_main_item'] = True if i < cnt else False
        
        return []  # hahaha

    
