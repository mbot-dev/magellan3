from .auto_injector import AutoInjector

class DefaultInjector(AutoInjector):
    def __init__(self):
        super().__init__()

    def inject_from(self, karte):
        return []
