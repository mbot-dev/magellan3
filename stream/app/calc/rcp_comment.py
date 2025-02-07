from .rcp_base import RcpBase
from .rcp_const import c_負担

class RcpComment(RcpBase):
    
    def __init__(self, rcp, comments): 
        super().__init__(rcp)
        self.comments = comments
    
    def submit_propositions(self):
        return []
    
    def store_model(self, m):
        for row in range(len(self.comments)):
            self.comments[row][c_負担] = self.get_cover_cost()
