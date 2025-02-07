from z3 import *
from .rcp_base import RcpBase
from . import rcp_helper as h
from .rcp_const import c_負担, c_数量, c_点数, c_回数, c_算定日

class RcpMedicine(RcpBase):
    """
    使用料量 -> 金額=1以外は表示しない
    点数（算定）
        金額=1 -> 剤単位で表示
        金額以外=7しかない -> 逓減関係で必ず表示 -> ToDo
    """
    def __init__(self, rcp, medicines):
        super().__init__(rcp)
        self.medicines = medicines
        self.is_rp = h.is_rp(rcp)
        self.iy_qt = [Real(f'iy_qt_{i}') for i in range(len(medicines))] # 使用量
        self.iy_acc = [Real(f'iy_acc_{i}') for i in range(len(medicines))] # 算定値
        self.iy_b_qt = [Bool(f'iy_b_qt_{i}') for i in range(len(medicines))] # 使用量表示 金額以外もあるから
        self.iy_b_acc = [Bool(f'iy_b_acc_{i}') for i in range(len(medicines))] # 算定値表示

    def show_qt(self, tensu_type, b):
        return If(tensu_type=='1', b, Not(b))

    def accumulate(self, is_last, acc, tensu_type, tensu, quantity, is_rp):
        if tensu_type == '1':
            acc += tensu*quantity
        if is_last:
            return If(acc <= RealVal('15'),
                      If(is_rp,
                         IntVal('1'),
                         IntVal('0')),
                      self.half_round_down(acc/RealVal('10')))
        return acc

    def submit_propositions(self):
        p = []
        for row in range(len(self.medicines)):
            med = self.medicines[row]
            tensu_type = med.get('tensu_type')
            tensu = med.get('tensu') if med.get('tensu') else '0'
            quantity = med.get('quantity') if med.get('quantity') else '0'
            is_last = (row == len(self.medicines) - 1)
            
            p.append(self.iy_qt[row] == RealVal(quantity)) # 使用量
            p.append(self.iy_acc[row] == self.accumulate(is_last,\
                                            0 if row == 0 else self.iy_acc[row-1],\
                                            tensu_type,\
                                            RealVal(tensu),\
                                            RealVal(quantity),\
                                            self.is_rp)) # 算定値
            
            p.append(self.show_qt(tensu_type, self.iy_b_qt[row])) # 数量表示
            p.append(self.show_acc(is_last, self.iy_b_acc[row])) # 算定表示
        
        return p
    
    def store_model(self, m):
        for row in range(len(self.medicines)):
            self.medicines[row][c_負担] = self.get_cover_cost()
            self.medicines[row][c_数量] = m[self.iy_qt[row]].as_decimal(self.PRECISION_QT) if is_true(m[self.iy_b_qt[row]]) else ''
            self.medicines[row][c_点数] = m[self.iy_acc[row]].as_decimal(self.PRECISION_ACC) if is_true(m[self.iy_b_acc[row]]) else ''
            self.medicines[row][c_回数] = self.get_kaisu()
            self.medicines[row][c_算定日] = self.get_santei_date()
