from itertools import groupby
from operator import itemgetter
from decimal import Decimal, ROUND_HALF_UP
import csv
from .s_base import SBase
from . import rcp_helper as h
from ..util.tracer import get_logger, pretty_dumps

class S600_l(SBase):
    group = '600'
    entity = 'labTest'
    rcp_code = '60'
    rcp_name = '検査'
    unit_of_num_round_items = '項目'
    
    def __init__(self, context, bundles) -> None:
        super().__init__(context)
        self.bundles = bundles
        self.lab_test = None
        self.base = None
        self.annotations = None
        self.generals = None

    def collect_same_kind_test(self, test_items):
        """
        同種（点数区分と区分番号が同じ）検体検査に別ける
        """
        grouper = itemgetter("tensu_kbn", "kbn_no")
        test_items.sort(key=grouper)
        ret = []
        for (kbn, no), mem in groupby(test_items, grouper):
            members = list(mem)
            get_logger(__name__).debug(f'検査区分と区分番号 {kbn} {no} {len(members)}')
            ret.append(members)
        return ret
    
    def normalize_lab_test(self):
        """
        検体検査を正規化する
        """
        if len(self.lab_test) == 0:
            return []
        
        ret = []
        # 包括対象かそうでないかでグルーピング
        grouper = itemgetter(h.HOKATSU_TAISHO_KENSA)
        self.lab_test.sort(key=grouper)
        
        for grp, mem in groupby(self.lab_test, grouper):
            test_items = list(mem)
            get_logger(__name__).debug(f'包括区分と検査項目数 {grp} {len(test_items)}')
            
            if grp == '0':
                """
                包括対象外
                同種の検体検査をまとめる（点数区分と区分番号が同じ）
                """
                for test in self.collect_same_kind_test(test_items):
                    b = self.create_claim_bundle(self)
                    for ci in test:
                        b['claim_items'].append(ci)
                        for a in h.get_annotation_serial(ci, self.annotations):
                            b['claim_items'].append(a)
                    ret.append(b)
                continue
            
            if grp != '0':
                """
                包括対象の検査
                """
                b = self.create_claim_bundle(self)
                b['round_group'] = grp  # set round group
                for ci in test_items:
                    b['claim_items'].append(ci)
                with open('app/data/round_items_600.csv', 'r') as f:
                    for line in csv.reader(f):
                        # 1,血液化学検査,1-4,5-7,8-9,10-,0,93,99,106
                        if grp != line[0]:
                            continue
                        name = line[1]
                        step = int(len(line[2:]) / 2)  # 8 / 2 = 4
                        seg = line[2:2+step]       # < 6
                        ten = line[(2+step):]      #
                        round = Decimal('0')
                        for s, t in zip(seg, ten):
                            spc = s.split('-')
                            min = int(spc[0])
                            max = int(spc[1]) if len(spc) > 1 else 1000
                            tensu = Decimal(t)
                            if min <= len(test_items) <= max:
                                if tensu == 0:  # means sum
                                    round += sum(Decimal(i.get('tensu') for i in test_items))
                                else:
                                    round += tensu
                                break
                        b['round_tensu'] = str(round.quantize(Decimal('0'), rounding=ROUND_HALF_UP))  # set 丸め算定点数
                        cmt = self.create_81_comment(f'{name} {len(test_items)} {self.unit_of_num_round_items}')
                        b['claim_items'].insert(0, cmt)
                        break
                ret.append(b)
                continue
        return ret

    def normalize_base(self):
        if (len(self.base) == 0):
            return []
        ret = []
        for ci in self.base:
            b = self.create_claim_bundle(self)
            b['claim_items'].append(ci)
            for a in h.get_annotation_serial(ci, self.annotations):
                b['claim_items'].append(a)
            if h.is_tsusoku_kasan_taisho(ci):
                for g in self.generals:
                    b['claim_items'].append(g)
            ret.append(b)
        return ret

    async def aggregate(self):
        """
        検体検査
        検査項目　D000 ~ D024
        判断料
        診断穿刺・採取料　D400 ~ D419
        通則加算なし
        送信されるバンドル
            検体検査項目がセットになっているバンドル
        注入されるバンドル
            採取料、判断料、外来迅速検査加算... etc.
        正規化
            検体検査項目集める
                丸め算定項目とそれ以外の項目に分け別々のバンドルにする
            加算等の基本項目、注加算
            基本項目に注加算をつける
        包括項目（丸め算定）は別に点数を記録
        上記にコメントが必要 CO, 810000001, 内分泌学的検査 3項目 etc
        薬剤、特定器材あり　＊　要例
        """
        lab_test = []
        base = []
        annotations = []
        generals = []  # なし
        for b in self.bundles:
            for i in b.get('claim_items'):
                if not h.is_toreru(i):
                    continue

                if h.is_kizami_procedure(i):
                    """
                    特異的IgEは包括対象検査及びきざみ識別にもなっている -> 包括では処理しない
                    包括対象検査 & きざみ識別=1 は特異的IgEのみ（2024/06/17現在）
                    特異的IgEは Auto Injectionしない
                    """
                    base.append(i)
                    continue
                
                if h.is_lab_test_item(i):
                    """
                    検体検査項目
                    基本項目になっているので注入及び送信されたものと区別するため最初に抽出する
                    """
                    lab_test.append(i)
                    continue
                
                if h.is_kihon_item(i):
                    base.append(i)
                    continue
                
                if h.is_chu_item(i):
                    annotations.append(i)
                    continue
                
                if h.is_tsusoku_item(i):
                    generals.append(i)
                    continue                 
        
        get_logger(__name__).debug(pretty_dumps(lab_test, 'lab_test'))
        get_logger(__name__).debug(pretty_dumps(base, 'base'))
        get_logger(__name__).debug(pretty_dumps(annotations, 'annotations'))
        get_logger(__name__).debug(pretty_dumps(generals, 'generals'))

        self.lab_test = lab_test
        self.base = base
        self.annotations = annotations
        self.generals = generals

        normalized = []
        normalized.extend(self.normalize_lab_test())
        normalized.extend(self.normalize_base())
        normalized = [n for n in normalized if len(n.get('claim_items')) > 0]
        return normalized


    