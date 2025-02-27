from z3 import *
from .rcp_base import RcpBase
from . import rcp_helper as h
from .rcp_const import c_負担, c_数量, c_点数, c_回数, c_算定日
from ..util.tracer import get_logger

class RcpProcedure(RcpBase):
    
    def __init__(self, rcp, procedures):
        super().__init__(rcp)
        self.procedures = procedures
        self.round_tensu = rcp.get('round_tensu') if h.is_round_test(rcp) else '0' # 包括検体検査 丸め点数
        self.si_qt = [Real(f'si_qt_{i}') for i in range(len(procedures))] # 数量（算定計算用）
        self.si_acc = [Real(f'si_acc_{i}') for i in range(len(procedures))] # 算定値
        self.si_tensu = [Real(f'si_tensu_{i}') for i in range(len(procedures))] # マスターの点数 （刻みのときは点数を変える）
        self.si_b_qt = [Bool(f'si_b_qt_{i}') for i in range(len(procedures))] # 数量表示（刻みのときのみ表示）
        self.si_b_acc = [Bool(f'si_b_acc_{i}') for i in range(len(procedures))] # 算定値表示
    
    def step_value(self, lo, hi, step, q):
        q = self.min1(self.max1(lo, q), hi)
        return self.round_up((q - lo) / step)

    def kizami_santei(self, base, lo, hi, step, step_tensu, q):
        get_logger(__name__).debug(f'Step santei base={base}, lo={lo}, hi={hi}, step={step}, step_tensu={step_tensu}, q={q}')
        return self.half_round_up(base + self.step_value(lo, hi, step, q)*step_tensu)

    def calc_tensu(self, proc): # 診療行為の点数　きざみ算定の場合に点数を計算する
        if h.is_kizami_procedure(proc):
            keys = ['tensu', h.KIZAMI_LOWER_LIMIT, h.KIZAMI_UPPER_LIMIT, h.KIZAMI_STEP, h.KIZAMI_TENSU, 'quantity']
            params = [RealVal(proc.get(k)) for k in keys]
            return self.kizami_santei(*params)
        return RealVal(proc.get('tensu'))
    
    def show_qt(self, proc, b):
        return If(h.is_kizami_procedure(proc), b, Not(b))
    
    def accumulate(self, is_last, acc, tensu_type, tensu, round_tensu):
        if round_tensu != '0':
            return RealVal(round_tensu) if is_last else 0
        if tensu_type == '3':
            acc += tensu
        if tensu_type == '5':
            acc += acc*tensu/RealVal('100') # without rounding
        if tensu_type == '6':
            acc -= acc*tensu/RealVal('100') # without rounding
        if is_last:
            return self.half_round_up(acc)
        return acc
    
    def submit_propositions(self):
        p = []
        for row in range(len(self.procedures)):
            proc = self.procedures[row]
            tensu_type = proc.get('tensu_type')
            quantity = proc.get('quantity') if proc.get('quantity') else '0' # 刻み算定の場合に記録
            is_last = (row == len(self.procedures) - 1)

            p.append(self.si_tensu[row] == self.calc_tensu(proc)) # マスターの点数|刻み計算の値 -> 集計のみに使用 表示はしない
            p.append(self.si_qt[row] == RealVal(quantity)) # 数量
            p.append(self.si_acc[row] == self.accumulate(is_last,\
                                                0 if row == 0 else self.si_acc[row-1],\
                                                tensu_type,\
                                                self.si_tensu[row],\
                                                self.round_tensu)) # 算定値
            
            p.append(self.show_qt(proc, self.si_b_qt[row])) # 数量表示 刻み算定の場合のみ表示
            p.append(self.show_acc(is_last, self.si_b_acc[row])) # 算定表示
        
        return p
    
    def store_model(self, m):
        for row in range(len(self.procedures)):
            self.procedures[row][c_負担] = self.get_cover_cost()
            self.procedures[row][c_数量] = m[self.si_qt[row]].as_decimal(self.PRECISION_QT) if is_true(m[self.si_b_qt[row]]) else ''
            self.procedures[row][c_点数] = m[self.si_acc[row]].as_decimal(self.PRECISION_ACC) if is_true(m[self.si_b_acc[row]]) else ''
            self.procedures[row][c_回数] = self.get_kaisu()
            self.procedures[row][c_算定日] = self.get_santei_date()
