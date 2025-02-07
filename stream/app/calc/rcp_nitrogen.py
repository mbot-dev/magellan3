from z3 import *
from .rcp_base import RcpBase
from . import rcp_helper as h
from .rcp_const import c_負担, c_数量, c_点数, c_回数, c_単位, c_単価, c_商品, c_算定日

class RcpNitrogen(RcpBase):
    
    def __init__(self, rcp, nitrogen):
        super().__init__(rcp)
        self.materials = nitrogen
        self.n_qt = [Real(f'n_qt_{i}') for i in range(len(nitrogen))] # 使用量
        self.n_acc = [Real(f'n_acc_{i}') for i in range(len(nitrogen))] # 算定値
        self.n_unit_price = [Real(f'n_unit_price_{i}') for i in range(len(nitrogen))] # 単価
        self.n_b_qt = [Bool(f'n_b_qt_{i}') for i in range(len(nitrogen))] # 使用量表示
        self.n_b_acc = [Bool(f'n_b_acc_{i}') for i in range(len(nitrogen))] # 算定値表示
        self.n_b_use_22 = [Bool(f'n_b_use_22_{i}') for i in range(len(nitrogen))] # 単位コード 22を使用するかどうか
        self.n_b_unit_price = [Bool(f'n_b_unit_price_{i}') for i in range(len(nitrogen))] # 単価表示
    
    def show_qt(self, tensu_type, b):
        # 特定器材の場合 金額=1, 購入価格=2, p加算=5 乗算=9  以外の金額　区分はない  5以外は表示
        return If(tensu_type=='5', Not(b), b)
    
    def accumulate(self, is_last, acc, tensu_type, tensu, quantity, round_kbn):
        if tensu_type == '1': # 金額の場合
            acc += tensu*quantity # tensu=unit_price
        if tensu_type == '2': # tensu = cost 医療機関購入単価
            acc += tensu*quantity
        if tensu_type == '5': # 加算
            acc *= (1 + tensu/RealVal('100')) # フィルム料（乳幼児）加算 10.0
        if is_last:
            if round_kbn == '0':
                return self.half_round_up(acc/RealVal('10'))
            if round_kbn == '3':
                return self.half_round_up(acc/RealVal('50'))
            if round_kbn == '4':
                return self.half_round_up(acc/RealVal('1000'))
        return acc
    
    def show_unit(self, tensu_type, unit_code, b22):
        return If(tensu_type == '5',
                  Not(b22),
                  If(unit_code != '0',
                     Not(b22),
                     b22))
    
    def show_unit_price(self, tensu_type, unit_code, o2_kbn, b):
        return If(self.is_5_or_9(tensu_type),
                  Not(b),
                  If(Or(tensu_type == '2', self.is_o2(o2_kbn)),
                     b,
                     If(unit_code == '0',
                        b,
                        Not(b))))
    
    def submit_propositions(self):
        p = []
        for row in range(len(self.materials)):
            mat = self.materials[row]
            tensu_type = mat.get('tensu_type')
            tensu = mat.get('tensu') if mat.get('tensu') else '0' # マスターの金額
            cost = mat.get('cost') if mat.get('cost') else tensu # 医療機関購入価格
            quantity = mat.get('quantity') if mat.get('quantity') else '0'
            unit_code = mat.get('unit_code', '0')
            o2_kbn = mat.get(h.c_酸素区分, '0')
            round_type = mat.get(h.c_特定器材種別, '0') # 用途は四捨五入区分
            is_last = (row == len(self.materials) - 1)
            
            p.append(self.n_qt[row] == RealVal(quantity)) # 使用量
            p.append(self.n_unit_price[row] == self.min1(RealVal(tensu), RealVal(cost))) # 単価= Min(金額,購入価格)  金額=マスターの値 購入価格=UI入力
            p.append(self.n_acc[row] == self.accumulate(is_last,\
                                                    0 if row == 0 else self.n_acc[row-1],\
                                                    tensu_type,\
                                                    self.n_unit_price[row],\
                                                    self.n_qt[row],\
                                                    round_type)) # 算定値         
            
            p.append(self.show_qt(tensu_type, self.n_b_qt[row])) # 数量表示
            p.append(self.show_acc(is_last, self.n_b_acc[row])) # 算定値表示
            p.append(self.show_unit(tensu_type, unit_code, self.n_b_use_22[row])) #22 使用表示 
            p.append(self.show_unit_price(tensu_type, o2_kbn, self.n_b_unit_price[row])) # 単価表示

        return p
    
    def store_model(self, m):
        for row in range(len(self.materials)):
            self.material[row][c_負担] = self.get_cover_cost()
            self.material[row][c_数量] = m[self.n_qt[row]].as_decimal(self.PRECISION_QT) if is_true(m[self.n_b_qt[row]]) else ''
            self.material[row][c_点数] = m[self.n_acc[row]].as_decimal(self.PRECISION_ACC) if is_true(m[self.n_b_acc[row]]) else ''
            self.material[row][c_回数] = self.get_kaisu()
            self.material[row][c_単位] = self.material[row].get('unit_code_22') if is_true(m[self.n_b_use_22[row]]) else ''
            self.material[row][c_単価] = m[self.n_unit_price[row]].as_decimal(self.PRECISION_UNIT_COST) if is_true(m[self.n_b_unit_price[row]]) else ''
            self.material[row][c_商品] = ''
            self.materials[row][c_算定日] = self.get_santei_date()
