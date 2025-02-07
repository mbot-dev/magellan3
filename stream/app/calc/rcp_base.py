from z3 import *
from .utils import day_from_created_at

class RcpBase:

    PRECISION_ACC = 0
    PRECISION_QT = 2
    PRECISION_UNIT_COST = 2
    
    def __init__(self, rcp):
        self.rcp = rcp
    
    def max1(self, x, y):
        return If(x >= y, x, y)
    
    def min1(self, x, y):
        return If(x <= y, x, y)
    
    def round_up(self, x):
        return If(x-ToInt(x)>RealVal('0'), ToInt(x)+IntVal('1'), ToInt(x))
    
    def round_down(self, x):
        return ToInt(x)
    
    def half_round_up(self, x):
        return self.round_down(x + RealVal('0.5'))
    
    def half_round_down(self, x):
        return self.round_up(x - RealVal('0.5'))
    
    def is_5_or_9(self, tensu_type):
        return If(Or(tensu_type=='5', tensu_type=='9'), True, False)

    def is_o2(self, o2_kbn): 
        return If(Or(o2_kbn == '0', o2_kbn == '1', o2_kbn == '9'), False, True) # 酸素区分
    
    def get_rcp_code(self): 
        return self.rcp.get('rcp_code')
    
    def get_cover_cost(self): 
        return self.rcp.get('rcp_cover_cost', '1')
    
    def get_kaisu(self): 
        return self.rcp.get('rcp_kaisu')
    
    def get_santei_date(self): 
        return str(day_from_created_at(self.rcp.get('created_at')))
    
    def show_cd(self, row, offset, b):
        return If(And(row == 0, offset == 0), b, Not(b))
    
    def show_acc(self, is_last, b):
        return If(is_last, b, Not(b))
    
    def submit_propositions(self):
        pass

    def store_model(self, m):
        pass