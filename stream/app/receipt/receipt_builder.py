from abc import ABCMeta, abstractmethod

class ReceiptBuilder(metaclass=ABCMeta):
    @abstractmethod
    def build_facility(self, obj):
        pass

    @abstractmethod
    def build_receipt(self, obj):
        pass

    @abstractmethod
    def build_claim_info(self):
        pass

    @abstractmethod   
    def get_result():
        pass

class ReceiptDirector(metaclass=ABCMeta):
    @abstractmethod
    def construct(self):
        pass