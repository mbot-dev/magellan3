from operator import itemgetter
from itertools import groupby
from decimal import Decimal
from .receipt_builder import ReceiptBuilder
from ..util.tracer import get_logger

class ClinicBuilder(ReceiptBuilder):
    debug = True
    hankaku_space = ' '
    zenkaku_space = '　'
    male = '1'
    female = '2'
    main_diagnosis = '主傷病'

    # 医療機関
    ir_spec = [
        {'key': '01_rec_type', 'ct': 'IR'},
        {'key': '02_審査支払機関', 'func': 'tbl_1'},  # 別表1 1=社保 ２=国保
        {'key': '03_都道府県', 'func': 'tbl_2', 'arg':'prefecture_code'},  # 別表2
        {'key': '04_点数表', 'func': 'tbl_3'},  # 別表3 1=医科
        {'key': '05_医療機関コード', 'func': 'csv_facility_code', 'arg': 'insurance_facility_code'},
        {'key': '06_予備', 'ct': ''},
        {'key': '07_医療機関名称', 'attr': 'name'},  # 地方厚生局長に届け出た名称 40 bytes
        {'key': '08_請求年月', 'attr': 'claim_month'},  # 請求年月 202407
        {'key': '09_マルチボリューム識別情報', 'ct': '00'},  # 電子媒体1
        {'key': '10_電話番号', 'attr': 'telephone'}  # 045-123-4567 OK
    ]

    # レセプト共通レコード
    re_spec = [
        {'key': '01_rec_type', 'ct': 'RE'},
        {'key': '02_レセプト番号', 'attr': 'rcp_number'},  # 1から連番 -> 1患者1ヶ月　, 二人目は2....
        {'key': '03_レセプト種別', 'func': 'tbl_5'},  # 別表5
        {'key': '04_診療年月', 'attr': 'examined_month'},  # 診療年月 202407 = 請求月 ?  ToDO
        {'key': '05_氏名', 'func': 'csv_full_name', 'arg': 'full_name'},  # 姓　名　の間にスペース　全角
        {'key': '06_男女区分', 'func': 'tbl_6', 'arg': 'gender'},  # 別表6 1=男 2=女
        {'key': '07_生年月日', 'func': 'csv_dob', 'arg': 'dob'},  # 西暦8桁
        {'key': '08_給付割合', 'ct': ''},  # 原則記録しない  被爆者手帳 with no insurane = 30  
        {'key': '09_入院年月日', 'ct': ''},  # empty
        {'key': '10_病棟区分', 'ct': ''},  # empty
        {'key': '11_一部負担金', 'func': 'tbl_8'},  # 限度額適用・標準負担額減額認定証等 else empty
        {'key': '12_特記事項', 'func': 'tbl_9'},  # 別表9
        {'key': '13_病床数', 'ct': ''},  # empty
        {'key': '14_カルテ番号', 'attr': 'pt_id'},  # pt_id
        {'key': '15_割引点数単価 ', 'ct': ''},  # 9円の場合=9 else empty
        {'key': '16_予備', 'ct': ''},
        {'key': '17_予備', 'ct': ''},
        {'key': '18_予備', 'ct': ''},
        {'key': '19_検索番号 ', 'ct': ''}, # 一次請求=empty  返戻を受けた場合は使用
        {'key': '20_予備', 'ct': ''},
        {'key': '21_請求情報 ', 'ct': ''},  # 医療機関固有 facility_id: karte_no
        {'key': '22_診療科名_1', 'ct': ''},  # option empty
        {'key': '23_人体の部位_1', 'ct': ''},
        {'key': '24_性別等', 'ct': ''},
        {'key': '25_医学的処置', 'ct': ''},
        {'key': '26_特定疾病', 'ct': ''},
        {'key': '27_診療科名', 'ct': ''},
        {'key': '28_人体の部位', 'ct': ''},
        {'key': '29_性別等', 'ct': ''},
        {'key': '30_医学的処置', 'ct': ''},
        {'key': '31_特定疾病', 'ct': ''},
        {'key': '32_診療科名', 'ct': ''},
        {'key': '33_人体の部位', 'ct': ''},
        {'key': '34_性別等', 'ct': ''},
        {'key': '35_医学的処置', 'ct': ''},
        {'key': '36_特定疾病', 'ct': ''},
        {'key': '37_カタカナ', 'func': 'csv_kana', 'arg': 'kana'}, # 姓名の間にスペースなし 
        {'key': '38_患者の状態', 'func': 'tbl_27'} # 別表27 ??
    ]

    # 保険者
    ho_spec = [
        {'key': '01_rec_type', 'ct': 'HO'},
        {'key': '02_保険者番号', 'attr': 'provider_number'},
        {'key': '03_被保険者証記号', 'attr': 'person_symbol'},
        {'key': '04_被保険者証番号', 'attr': 'person_number'},
        {'key': '05_診療実日数', 'attr': 'actual_days'},
        {'key': '06_合計点数', 'attr': 'receipt_tensu'},
        {'key': '07_予備', 'ct': ''},
        {'key': '08_食事生活療養_回数', 'ct': ''},
        {'key': '09_食事生活療養_合計金額', 'ct': ''},
        {'key': '10_職務上の理由', 'func': 'tbl_15'},
        {'key': '11_証明書番号', 'ct': ''},
        {'key': '12_医療保険', 'ct': ''},
        {'key': '13_減免区分', 'func': 'tbl_16'},
        {'key': '14_減額割合', 'ct': ''},
        {'key': '15_減額金額', 'ct': ''}
    ]

    # 公費
    ko_spec = [
        {'key': '01_rec_type', 'ct': 'KO'},
        {'key': '02_公費負担者番号', 'ct': ''},
        {'key': '03_受給者番号', 'ct': ''},
        {'key': '04_任意給付区分', 'ct': ''},
        {'key': '05_診療実日数', 'ct': ''},
        {'key': '06_合計点数', 'ct': ''},
        {'key': '07_公費', 'ct': ''},
        {'key': '08_外来一部負担金', 'ct': ''},
        {'key': '09_入院一部負担金', 'ct': ''},
        {'key': '10_予備', 'ct': ''},
        {'key': '11_食事生活療養_回数', 'ct': ''},
        {'key': '12_食事生活療養_合計金額', 'ct': ''}
    ]

    # 資格確認
    sn_spec = [
        {'key': '01_rec_type', 'ct': 'SN'},
        {'key': '02_負担者種別', 'func': 'tbl_28'},
        {'key': '03_確認区分', 'func': 'tbl_29'},
        {'key': '04_保険者番号', 'ct': ''},
        {'key': '05_被保険者証記号', 'ct': ''},
        {'key': '06_被保険者証番号', 'ct': ''},
        {'key': '07_枝番', 'ct': ''},  # 通知された番号を記録
        {'key': '08_受給者番号', 'ct': ''},
        {'key': '09_予備', 'ct': ''}
    ]
    
    # 受信日等
    jd_spec = [
        {'key': '01_rec_type', 'ct': 'JD'},
        {'key': '02_負担者種別', 'func': 'tbl_28'}
    ]

    # 窓口負担額
    mf_spec = [
        {'key': '01_rec_type', 'ct': 'MF'},
        {'key': '02_窓口負担区分', 'func': 'tbl_31'}
    ]

    # 包括評価対象外理由
    gr_spec = [
        {'key': '01_rec_type', 'ct': 'GR'},
        {'key': '02_医科点数表算定事由', 'tbl': '17'},
    ]

    # 傷病名
    sy_spec = [
        {'key': '01_rec_type', 'ct': 'SY'},
        {'key': '02_傷病名コード', 'attr': 'code'},
        {'key': '02_傷病名', 'attr': 'name'},
        {'key': '03_診療開始日', 'func': 'csv_date_of_onset', 'arg': 'date_of_onset'},
        {'key': '04_転帰区分', 'func': 'tbl_18', 'arg': 'outcome'},
        {'key': '05_修飾語コード', 'sttr': 'modifier'},
        {'key': '06_傷病名称', 'attr': 'name'},
        {'key': '07_主傷病', 'func': 'tbl_19', 'arg': 'diagnosis_category'},
        {'key': '08_補足コメント', 'ct': ''}
    ]

    # 診療行為
    si_spec = [
        {'key': '01_rec_type', 'ct': 'SI'},
        {'key': '02_診療識別', 'attr': 'rcp_code'},
        {'key': '03_負担区分', 'attr': 'rcp_cover_cost'},
        {'key': '04_診療コード', 'attr': 'code'},
        {'key': '04_名称', 'attr': 'name'},
        {'key': '05_数量データ', 'attr': 'rcp_quantity'},
        {'key': '06_点数', 'attr': 'rcp_tensu'},
        {'key': '07_回数', 'attr': 'rcp_kaisu'},
        {'key': '08_コメントコード', 'ct': ''},
        {'key': '09_コメント文字', 'ct': ''},
        {'key': '10_コメントコード', 'ct': ''},
        {'key': '11_コメント文字', 'ct': ''},
        {'key': '12_コメントコード', 'ct': ''},
        {'key': '13_コメント文字', 'ct': ''}
    ]

    # 医薬品
    iy_spec = [
        {'key': '01_rec_type', 'ct': 'IY'},
        {'key': '02_診療識別', 'attr': 'rcp_code'},
        {'key': '03_負担区分', 'attr': 'rcp_cover_cost'},
        {'key': '04_医薬品コード', 'attr': 'code'},
        {'key': '04_名称', 'attr': 'name'},
        {'key': '05_使用量', 'attr': 'rcp_quantity'},
        {'key': '06_点数', 'attr': 'rcp_tensu'},
        {'key': '07_回数', 'attr': 'rcp_kaisu'},
        {'key': '08_コメントコード', 'ct': ''},
        {'key': '09_コメント文字', 'ct': ''},
        {'key': '10_コメントコード', 'ct': ''},
        {'key': '11_コメント文字', 'ct': ''},
        {'key': '12_コメントコード', 'ct': ''},
        {'key': '13_コメント文字', 'ct': ''}
    ]

    # 材料
    to_spec = [
        {'key': '01_rec_type', 'ct': 'TO'},
        {'key': '02_診療識別', 'attr': 'rcp_code'},
        {'key': '03_負担区分', 'attr': 'rcp_cover_cost'},
        {'key': '04_特定器材コード', 'attr': 'code'},
        {'key': '04_名称', 'attr': 'name'},
        {'key': '05_使用量', 'attr': 'rcp_quantity'},
        {'key': '06_点数', 'attr': 'rcp_tensu'},
        {'key': '07_回数', 'attr': 'rcp_kaisu'},
        {'key': '08_単位コード', 'attr': 'rcp_unit_code'},
        {'key': '09_単価', 'attr': 'rcp_unit_price'},
        {'key': '10_予備', 'ct': ''},
        {'key': '11_商品名・規格・サイズ', 'ct': ''},
        {'key': '12_コメントコード', 'ct': ''},
        {'key': '13_コメント文字', 'ct': ''},
        {'key': '14_コメントコード', 'ct': ''},
        {'key': '15_コメント文字', 'ct': ''},
        {'key': '16_コメントコード', 'ct': ''},
        {'key': '17_コメント文字', 'ct': ''}
    ]

    # 　コメント　
    co_spec = [
        {'key': '01_rec_type', 'ct': 'CO'},
        {'key': '02_診療識別', 'attr': 'rcp_code'},
        {'key': '03_負担区分', 'attr': 'rcp_cover_cost'},
        {'key': '02_コメントコード', 'attr': 'code'},
        {'key': '03_コメント文字', 'attr': 'name'}
    ]

    # 診療報酬請求
    go_spec = [
        {'key': '01_rec_type', 'ct': 'GO'},
        {'key': '02_総件数', 'func': 'csv_file_receipts'},
        {'key': '03_総合計点数', 'func': 'csv_file_tensu'},
        {'key': '04_マルチボリューム識別情報', 'ct': '99'}  # 1volume/1facility
    ]

    def __init__(self):
        self.rcp_number = 0
        self.file_tensu = Decimal('0')
        self.facility_lines = []
        self.claim_lines = []
        self.receipt_lines = []
    
    @classmethod
    def is_procedure(self, code):
        return True if code.startswith('1') and len(code) == 9 else False
    
    @classmethod
    def is_medicine(self, code):
        return True if code.startswith('6') and len(code) == 9 else False
    
    @classmethod
    def is_material(self, code):
        return True if code.startswith('7') and len(code) == 9 else False
    
    @classmethod
    def is_comment(self, code):
        return True if code.startswith('8') and len(code) == 9 else False
    
    def tbl_1(self):
        """審査支払機関 1=社保 ２=国保"""
        return '1'
    
    def tbl_2(self, data):
        """都道府県"""
        return data
    
    def tbl_3(self):
        """点数表"""
        return '1'
    
    def tbl_5(self):
        """レセプト種別 ToDo"""
        return '1112'
    
    def tbl_6(self, text):
        """男女区分"""
        if text == 'M':
            return self.male
        if text == 'F':
            return self.female
        return 'unknown'
    
    def tbl_7(self):
        """病棟区分"""
        return ''

    def tbl_8(self):
        """一部負担金・食事療養費・生活療養費負担区分"""
        return ''
    
    def tbl_9(self):
        """レセプト特記事項"""
        return ''
    
    def tbl_10(self):
        """診療科コード"""
        return ''

    def tbl_11(self):
        """人体の部位コード"""
        return ''

    def tbl_12(self):
        """性別等区分"""
        return ''

    def tbl_13(self):
        """医学的処置区分"""
        return ''

    def tbl_14(self):
        """特定疾病コード"""
        return ''

    def tbl_15(self):
        """職務上の事由コード"""
        return ''

    def tbl_16(self):
        """減免区分"""
        return ''

    def tbl_17(self):
        """医科点数表算定理由"""
        return '09'

    def tbl_18(self, outcome):
        """
        転帰区分  1=治癒、死亡、中止以外 2=治癒 3=死亡 4=中止（転医） ToDo
        """
        return ''

    def tbl_19(self, data):
        """主病コード"""
        if not data:
            return ''
        if data == self.main_diagnosis:
            return '01'
        return ''
    
    def tbl_20(self):
        """診療識別コード"""
        pass

    def tbl_21(self):
        """負担区分 ToDo"""
        return '1'  # 1者 医保
    
    def tbl_22(self):
        """特定器材単位コード"""
        pass

    def tbl_23(self):
        """症状詳記区分"""
        return ''

    def tbl_24(self):
        """臓器提供区分"""
        return ''

    def tbl_25(self):
        """臓器提供医療機関区分"""
        return ''

    def tbl_26(self):
        """臓器提供レセプト種別コード"""
        return ''

    def tbl_27(self):
        """患者の状態"""
        return ''
    
    def tbl_28(self):
        """負担者種別コード 1=医療保険、国保、後期高齢医療 ToDo"""
        return '1'
    
    def tbl_29(self):
        """確認区分"""
        return '01'
    
    def tbl_30(self):
        """受信区分 1=診療実日数に計上 2=診療実日数に計上しない（初診または再診に付随)"""
        return '1'  # 
    
    def tbl_31(self):
        """窓口負担区分"""
        return '00'  # 高額療養費の現物給付なし
    
    def csv_file_tensu(self):
        return str(self.file_tensu)
    
    def csv_file_receipts(self):
        return str(self.rcp_number)
    
    def csv_facility_code(self, text):
        return text[3:]
    
    def csv_full_name(self, text):
        return text.replace(self.hankaku_space, self.zenkaku_space)
    
    def csv_kana(self, text):
        return text.replace(self.hankaku_space, '').replace(self.zenkaku_space, '')
    
    def csv_dob(self, text):
        return text.replace('-', '')
    
    def csv_date_of_onset(self, text):
        return text.replace('-', '')[0:8]  # 20240701

    def to_csv_data(self, ent, obj):
        key = ent.get('key')
        val = ''
        if ent.get('func'):
            func = ent.get('func')
            arg = ent.get('arg')
            if arg:
                val = getattr(self, func)(obj.get(arg))
            else:
                val = getattr(self, func)()
        elif ent.get('tbl'):
            val = ''
        elif ent.get('attr'):
            val = obj.get(ent.get('attr'), '')
        elif ent.get('ct') is not None:
            val = ent.get('ct')
        if self.debug:
            get_logger(__name__).info(f'{key} = {val}')
        return val

    def build_facility(self, facility, start_date):
        facility['claim_month'] = start_date.replace('-', '')[0:6]
        l = [self.to_csv_data(ent, facility) for ent in self.ir_spec]
        self.facility_lines.append(','.join(l))

    def build_claim_info(self):
        l = [self.to_csv_data(ent, None) for ent in self.go_spec]
        self.claim_lines.append(','.join(l))
    
    def build_common(self, patient, examined_month):
        patient['rcp_number'] = str(self.rcp_number)
        patient['examined_month'] = examined_month[0: 6]
        l = [self.to_csv_data(ent, patient) for ent in self.re_spec]
        self.receipt_lines.append(','.join(l))
    
    def build_insurance_info(self, receipt_tensu, actual_days, his):
        his['receipt_tensu'] = str(receipt_tensu)  # receipt 合計点数
        his['actual_days'] = str(len(actual_days))  # 診療実日数
        l = [self.to_csv_data(ent, his) for ent in self.ho_spec]
        self.receipt_lines.append(','.join(l))
        if not his.get('pub'):
            return
        for pub in his.get('pub'):
            l = [self.to_csv_data(ent, pub) for ent in self.ko_spec]
            self.receipt_lines.append(','.join(l))
    
    def build_certification(self):
        return
    
    def build_date(self, actual_days):
        l = [self.to_csv_data(ent, None) for ent in self.jd_spec]
        days = [''] * 31
        for d in actual_days:
            days[int(d) - 1] = '1'  # tbl_30 受信区分
        l.extend(days)
        self.receipt_lines.append(','.join(l))
    
    def build_counter(self):
        return
    
    def build_dpc(self):
        pass

    def build_diagnosis(self, lst):
        for d in lst:
            l = [self.to_csv_data(ent, d) for ent in self.sy_spec]
            self.receipt_lines.append(','.join(l))

    def build_receipt(self, rcp_bundles):
        self.rcp_number += 1
        receipt_tensu = Decimal('0')
        examined_at = []
        patient = rcp_bundles[0].get('patient')
        his = rcp_bundles[0].get('his')
        diagnosis = rcp_bundles[0].get('diagnosis')
        examined_month = rcp_bundles[0].get('rcp_examined_at')
        item_lines = []
        grouper = itemgetter('rcp_code', 'rcp_tensu', 'rcp_kaisu')
        rcp_bundles.sort(key=grouper)
        for _, mem in groupby(rcp_bundles, grouper):
            gl = list(mem)
            kaisu = 0
            days = [''] * 31
            for b in gl:
                receipt_tensu += Decimal(b.get('rcp_tensu'))
                kaisu += int(b.get('rcp_kaisu'))
                days[int(b.get('rcp_day_at')) - 1] = b.get('rcp_kaisu')
                examined_at.append(b.get('rcp_day_at'))
            target = gl[0]
            for i in target.get('receipt_items'):
                i['rcp_code'] = target.get('rcp_code')
                i['rcp_kaisu'] = str(kaisu)
                code = i.get('code')
                if self.is_procedure(code):
                    l = [self.to_csv_data(ent, i) for ent in self.si_spec]
                elif self.is_medicine(code):
                    l = [self.to_csv_data(ent, i) for ent in self.iy_spec]
                elif self.is_material(code):
                    l = [self.to_csv_data(ent, i) for ent in self.to_spec]
                elif self.is_comment(code):
                    l = [self.to_csv_data(ent, i) for ent in self.co_spec]
                l.extend(days)
                item_lines.append(','.join(l))
        actual_days = set(examined_at)
        self.file_tensu += receipt_tensu
        self.build_common(patient, examined_month)
        self.build_insurance_info(receipt_tensu, actual_days, his)
        self.build_certification()
        self.build_date(actual_days)
        self.build_counter()
        self.build_dpc()
        self.build_diagnosis(diagnosis)
        self.receipt_lines.extend(item_lines)

    def get_result(self):
        csv_line = self.facility_lines + self.receipt_lines + self.claim_lines
        csv = '\n'.join(csv_line)  
        return csv