
PROCEDURE = '1'
MEDICINE = '6'
MATERIAL = '7'
COMMENT = '8'
CODE_LENGTH = 9
KIHON_ZYUNYO_GOUSEI = ('1', '3', '5')
CHU_KASAN = '7'
TSUSOKU_KASAN = '9'
LAB_TEST_KBN = 'D'
LAB_TEST_KBN_NO = ('000', '024')
SANTEI = '算定'
TORERU = '取れる'
HOKATSU_TAISHO_KENSA = 'c16_包括対象検査'
KIZAMI_SHIKIBETSU = 'c30_きざみ識別'
KIZAMI_LOWER_LIMIT = 'c31_きざみ下限値'
KIZAMI_UPPER_LIMIT = 'c32_きざみ上限値'
KIZAMI_STEP = 'c33_きざみ単位'
KIZAMI_TENSU = 'c34_きざみ点数'
KIZAMI_ERROR_CODE = 'c35_きざみエラー処理'
CHU_KASAN_CODE = 'c38_注加算コード'
CHU_KASAN_TSUUBAN = 'c39_注加算通番'
TEIGEN_TAISHO_KBN = 'c52_逓減対象区分'
TSUSOKU_KASAN_TAISHO = 'c62_通則加算所定点数対象区分'
KOKUJI_SHIKIBESTU_KBN = 'c68_告示等識別区分_1'

c_酸素区分 = 'c21_酸素区分'
c_特定器材種別 = 'c22_特定器材種別'
c_酸素上限 = 'c23_酸素上限'
c_フィルム上限点数 = 'c24_フィルム上限点数'

def is_procedure(proc):
    code = proc.get('code')
    return code.startswith(PROCEDURE) and len(code) == CODE_LENGTH

def is_medicine(ci):
    code = ci.get('code')
    return code.startswith(MEDICINE) and len(code) == CODE_LENGTH

def is_material(ci):
    code = ci.get('code')
    return code.startswith(MATERIAL) and len(code) == CODE_LENGTH

def is_comment(ci):
    code = ci.get('code')
    return code.startswith(COMMENT) and len(code) == CODE_LENGTH

def is_toreru(proc):
    return is_procedure(proc) and proc.get(SANTEI) == TORERU

def is_kihon_komoku(proc):
    return is_procedure(proc) and proc.get(KOKUJI_SHIKIBESTU_KBN) in KIHON_ZYUNYO_GOUSEI

def is_kihon_item(proc):
    return is_procedure(proc) and proc.get(KOKUJI_SHIKIBESTU_KBN) in KIHON_ZYUNYO_GOUSEI

def is_chu_item(proc):
    return is_procedure(proc) and proc.get(KOKUJI_SHIKIBESTU_KBN) == CHU_KASAN

def is_tsusoku_item(proc):
    return is_procedure(proc) and proc.get(KOKUJI_SHIKIBESTU_KBN) == TSUSOKU_KASAN

def is_chu_kasan_taisho(proc):
    return is_procedure(proc) and proc.get(CHU_KASAN_CODE) != '0'

def is_tsusoku_kasan_taisho(proc):
    return is_procedure(proc) and proc.get(TSUSOKU_KASAN_TAISHO) == '0'  # 0 !

def is_kizami_procedure(proc):
    return is_procedure(proc) and proc.get(KIZAMI_SHIKIBETSU) ==  '1'

def is_teigen_procedure(proc):
    return is_procedure(proc) and proc.get(TEIGEN_TAISHO_KBN) == '1'

def get_procedures_in(bundles):
    return [i for b in bundles for i in b.get('claim_items') if is_procedure(i)]

def is_lab_test_item(proc):
    if not is_procedure(proc):
        return False
    if proc.get('tensu_kbn') != LAB_TEST_KBN:
        return False
    return proc.get('kbn_no') >= LAB_TEST_KBN_NO[0] and proc.get('kbn_no') <= LAB_TEST_KBN_NO[1]

def is_teigen_taisho(proc):
    return is_procedure(proc) and proc.get(TEIGEN_TAISHO_KBN) == '1' and proc.get('actual_count', 0) >= 1

def find_teigen_item_in(lst):
    t = [t for t in lst if t.get(TEIGEN_TAISHO_KBN) == '1' and t.get(KOKUJI_SHIKIBESTU_KBN) == CHU_KASAN]
    return t[0] if len(t) > 0 else None

def is_oral(bundle):
    test = bundle.get('oral') if bundle.get('oral') else False
    return test

def is_prn(bundle):
    test = bundle.get('prn') if bundle.get('prn') else False
    return test

def is_topical(bundle):
    test = bundle.get('topical') if bundle.get('topical') else False
    return test

def is_rp(bundle):
    test = is_oral(bundle) or is_prn(bundle) or is_topical(bundle)
    return test

def is_round_test(bundle):
    return True if bundle.get('round_group') and bundle.get('round_group') != '0' else False

def get_round_tensu(bundle):
    return bundle.get('round_tensu')

def is_fluoroscopic(p):
    return p.get('code') == '170000310'

def is_e00_addition(p):
    return p.get('tensu_kbn') == 'E' and p.get('kbn_no') == '000' and not is_fluoroscopic(p)

def is_x_ray(p):
    return p.get('tensu_kbn') == 'E' and (p.get('kbn_no') == '001' or p.get('kbn_no') == '002')

def is_image_enhance(p):
    return p.get('tensu_kbn') == 'E' and p.get('kbn_no') == '003'

def is_nuclear_medicine(p):
    return p.get('tensu_kbn') == 'E' and p.get('kbn_no').startswith('10')

def is_ct(p):
    return p.get('tensu_kbn') == 'E' and p.get('kbn_no').startswith('20')

def split_procedures_in(bundles):
    toreru = [i for b in bundles for i in b.get('claim_items') if is_toreru(i)]
    base = [i for i in toreru if is_kihon_item(i)]
    annotations = [i for i in toreru if is_chu_item(i)]
    generals = [i for i in toreru if is_tsusoku_item(i)]
    return base, annotations, generals

def get_annotation_serial(b, annotations):
    """
    col_038=注加算コード  col_039=注加算通番
    b: 基本項目(1,3,5)  annotations:注加算リスト(7)
    基本項目の038と注加算項目038 が一致
    複数の注加算項目が該当する場合は、通番が異なるものを取得
    最初の注加算項目は39でソートして最初のものにする
    実装 -> 基本項目の注加算コード039が0の場合は、その基本項目に注加算はつかないと判断する
    """
    if not is_chu_kasan_taisho(b):   # b.get(CHU_KASAN_CODE) == '0': -> 除外
        return []
    same_annotations = [p for p in annotations if p.get(CHU_KASAN_CODE) == b.get(CHU_KASAN_CODE)] # col38が一致
    if  len(same_annotations) == 0:
        return []
    same_annotations.sort(key=lambda x: x.get(CHU_KASAN_TSUUBAN))
    ret = list()
    serial = None
    for a in same_annotations:
        if a.get(CHU_KASAN_TSUUBAN) != serial:
            ret.append(a)
            serial = a.get(CHU_KASAN_TSUUBAN)
    
    return ret


