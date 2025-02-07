from z3 import *
from .rcp_base import RcpBase
from . import rcp_helper as h
from .rcp_const import c_負担, c_数量, c_点数, c_回数, c_単位, c_単価, c_商品, c_算定日

class RcpOxgen(RcpBase):
    
    def __init__(self, rcp, oxgen):
        super().__init__(rcp)
        self.oxgen = oxgen
        self.o2_qt = [Real(f'o2_qt_{i}') for i in range(len(oxgen))] # 使用量
        self.o2_acc = [Real(f'o2_acc_{i}') for i in range(len(oxgen))] # 算定値
        self.o2_unit_price = [Real(f'o2_unit_cost_{i}') for i in range(len(oxgen))] # 単価
        self.o2_b_qt = [Bool(f'b_o2_qt_{i}') for i in range(len(oxgen))] # 使用量表示
        self.o2_b_acc = [Bool(f'o2_b_acc_{i}') for i in range(len(oxgen))] # 算定値表示
        self.o2_b_unit = [Bool(f'o2_b_unit_{i}') for i in range(len(oxgen))] # 単位表示
        self.o2_b_unit_price = [Bool(f'o2_b_unit_price_{i}') for i in range(len(oxgen))] # 単価表示
    
    def show_qt(self, tensu_type, b):
        # 特定器材の場合 金額=1, 購入価格=2, p加算=5 乗算=9  以外の金額　区分はない 
        # 5以外は表示
        return If(tensu_type=='5', Not(b), b)
    
    def accumulate(self, is_last, acc, tensu_type, tensu, quantity):
        if tensu_type=='1':
            acc += tensu*quantity # tensu=医療機関購入単価
        if tensu_type=='5':
            acc *= (1 + tensu/RealVal('100')) # tensu=酸素補正率 1.3
        if tensu_type=='9':
            acc *= tensu # tensu=気圧
        if is_last:
            return self.half_round_up(self.half_round_up(acc)/RealVal('10')) # 金額で四捨五入 点数で五捨五超入
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
        for row in range(len(self.oxgen)):
            mat = self.self.oxygen[row]
            tensu_type = mat.get('tensu_type')
            tensu = mat.get('tensu') if mat.get('tensu') else '0'  # マスターの金額=上限金額 or 酸素補正率30.0 or 高気圧酸素加算の気圧数
            cost = mat.get('cost') if mat.get('cost') else tensu # 医療機関購入価格
            quantity = mat.get('quantity') if mat.get('quantity') else '0' # 使用量
            unit_code = mat.get('unit_code', '0')
            o2_kbn = mat.get(h.c_酸素区分, '0')
            is_last = (row == len(self.oxgen) - 1)
            
            p.append(self.o2_qt[row] == RealVal(quantity)) # 数量
            p.append(self.o2_unit_price[row] == self.min1(RealVal(tensu), RealVal(cost))) # 単価=Min(金額, 購入価格)　金額=マスターの点数 購入価格=UI入力
            p.append(self.o2_acc[row] == self.accumulate(is_last,\
                                                0 if row == 0 else self.o2_acc[row-1],\
                                                tensu_type,\
                                                self.o2_unit_price[row],\
                                                self.o2_qt[row])) # 算定値      
            
            p.append(self.show_qt(tensu_type, self.o2_b_qt[row])) # 数量表示
            p.append(self.show_acc(is_last, self.o2_b_acc[row])) # 算定表示
            p.append(self.show_unit(tensu_type, unit_code, self.o2_b_unit[row])) #単位表示 
            p.append(self.show_unit_price(tensu_type, o2_kbn, self.o2_b_unit_price[row])) # 単価表示

        return p
    
    def store_model(self, m):
        for row in range(len(self.oxgen)):
            self.oxygen[row][c_負担] = self.get_cover_cost()
            self.oxygen[row][c_数量] = m[self.o2_qt[row]].as_decimal(self.PRECISION_QT) if is_true(m[self.o2_b_qt[row]]) else ''
            self.oxygen[row][c_点数] = m[self.o2_acc[row]].as_decimal(self.PRECISION_ACC) if is_true(m[self.o2_b_acc[row]]) else ''
            self.oxygen[row][c_回数] = self.get_kaisu()
            self.oxygen[row][c_単位] = self.oxygen[row].get('unit_code') if is_true(m[self.o2_b_unit[row]]) else ''
            self.oxygen[row][c_単価] = m[self.o2_unit_price[row]].as_decimal(self.PRECISION_UNIT_COST) if is_true(m[self.o2_b_unit_price[row]]) else ''
            self.oxygen[row][c_商品] = ''
            self.oxygen[row][c_算定日] = self.get_santei_date()
    
    