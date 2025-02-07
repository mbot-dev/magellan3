from abc import ABC, abstractmethod

class AutoInjector(ABC):
    @abstractmethod
    def inject_from(self, karte):
        pass
