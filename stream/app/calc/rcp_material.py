from z3 import *
from .rcp_base import RcpBase
from . import rcp_helper as h
from .rcp_const import c_負担, c_数量, c_点数, c_回数, c_単位, c_単価, c_商品, c_算定日

class RcpMaterial(RcpBase):
    """
    使用量 -> 特定器材の場合 金額=1, 購入価格=2, 加算=5 乗算=9  以外の金額区分はない 5以外は表示
    点数
        1回の手術で使用した特定器材毎に表示
        １連の画像診断で使用したフィルム毎に表示
    単位コード
        5 -> 表示しない
        unit_code != 0 -> 表示しない （9=乗算 高気圧酸素加算 init_code=54=気圧 を含む）
        unit_code = 0 -> 別表22の単位を表示する
    単価
        医療機関購入価格=2 -> 表示
        別表22の場合(unit_code=0) -> 医療機関購入単価を表示
        単位コードが設定されているもの（unit_code != 0）-> 表示しない
        ただし酸素は表示する
        5 or 9 -> 表示しない
    商品名/規格/サイズ
        画像診断以外のフィルム（内視鏡、眼科的検査等） -> 記録 ToDo
    """
    def __init__(self, rcp, materials):
        super().__init__(rcp)
        self.materials = materials
        self.to_qt = [Real(f'to_qt_{i}') for i in range(len(materials))] # 使用量
        self.to_acc = [Real(f'to_acc_{i}') for i in range(len(materials))] # 算定値
        self.to_unit_price = [Real(f'to_unit_price_{i}') for i in range(len(materials))] # 単価
        self.to_b_qt = [Bool(f'to_b_qt_{i}') for i in range(len(materials))] # 使用量表示
        self.to_b_acc = [Bool(f'to_b_acc_{i}') for i in range(len(materials))] # 算定値表示
        self.to_b_use_22 = [Bool(f'to_b_use_22_{i}') for i in range(len(materials))] # 単位コード 22を使用するかどうか
        self.to_b_unit_price = [Bool(f'to_b_unit_price_{i}') for i in range(len(materials))] # 単価表示
    
    def show_qt(self, tensu_type, b):
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
            
            p.append(self.to_qt[row] == RealVal(quantity)) # 使用量
            p.append(self.to_unit_price[row] == self.min1(RealVal(tensu), RealVal(cost))) # 単価= Min(金額,購入価格)  金額=マスターの値 購入価格=UI入力
            p.append(self.to_acc[row] == self.accumulate(is_last,\
                                                    0 if row == 0 else self.to_acc[row-1],\
                                                    tensu_type,\
                                                    self.to_unit_price[row],\
                                                    self.to_qt[row],\
                                                    round_type)) # 算定値
            
            p.append(self.show_qt(tensu_type, self.to_b_qt[row])) # 数量表示
            p.append(self.show_acc(is_last, self.to_b_acc[row])) # 算定値表示
            p.append(self.show_unit(tensu_type, unit_code, self.to_b_use_22[row])) #22 使用表示 
            p.append(self.show_unit_price(tensu_type, unit_code, o2_kbn, self.to_b_unit_price[row])) # 単価表示

        return p
    
    def store_model(self, m):
        for row in range(len(self.materials)):
            self.materials[row][c_負担] = self.get_cover_cost()
            self.materials[row][c_数量] = m[self.to_qt[row]].as_decimal(self.PRECISION_QT) if is_true(m[self.to_b_qt[row]]) else ''
            self.materials[row][c_点数] = m[self.to_acc[row]].as_decimal(self.PRECISION_ACC) if is_true(m[self.to_b_acc[row]]) else ''
            self.materials[row][c_回数] = self.get_kaisu()
            self.materials[row][c_単位] = self.materials[row].get('unit_code_22') if is_true(m[self.to_b_use_22[row]]) else ''
            self.materials[row][c_単価] = m[self.to_unit_price[row]].as_decimal(self.PRECISION_UNIT_COST) if is_true(m[self.to_b_unit_price[row]]) else ''
            self.materials[row][c_商品] = ''
            self.materials[row][c_算定日] = self.get_santei_date()
