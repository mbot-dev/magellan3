from abc import ABC, abstractmethod

class Receipt(ABC):
    @abstractmethod
    def calculate(self, bundle):
        pass