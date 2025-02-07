from abc import ABC, abstractmethod

class S(ABC):
    @abstractmethod
    async def aggregate(self):
        pass
