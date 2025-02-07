class KarteNotFoundException(Exception):
    def __init__(self, message='カルテが見つかりません。'):
        self.message = message
        super().__init__(self.message)

class MasterNotFoundException(Exception):
    def __init__(self, message='マスターに登録されていない項目があります'):
        self.message = message
        super().__init__(self.message)

class NotSatisfiedException(Exception):
    def __init__(self, message='レセプトは包括・背反ルールを満たすことができません。'):
        self.message = message
        super().__init__(self.message)
