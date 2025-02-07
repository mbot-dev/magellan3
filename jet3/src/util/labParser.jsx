import {halfFrom, hankana2Zenkana, addZero} from './strings';
import {isoStringFromString} from "./dt2";

// CSV spec
const SKIP = 2;
const ENCODING = 'Shift_JIS';

// To develop
const TEST_ONLY = true;    // gender, dob, kana, name -> null
const ROT_COUNT = 1;    // rotation

const normalize = str => {
    return str ? hankana2Zenkana(halfFrom(str)) : '';
};

const HEADERS = [
    'lab_code',						// 0  R  ラボコード
    'lab_name',						// 1  O  ラボ名称
    'fc_id',						// 2  R  施設ID 保健指導機関コード  facility_idではない当然
    'fc_name',						// 3  O  施設名称
    'dept_id',						// 4  O  診療科コード  table-1
    'phy_name',						// 5  O  依頼医師名
    'serial_num',					// 6  O  検査結果通番
    'pt_id',						// 7  R  患者ID
    'pt_name',						// 8  R  患者氏名
    'pt_kana',						// 9  RE 患者カナ（半角）
    'pt_dob',						// 10 R  患者生年月日 YYYYMMDD
    'pt_gender',					// 11 R  患者性別    1=M, 2=F U table-2
    'pt_consent',					// 12 R  同意患者識別子 table-3 同意あり/なし
    'height',						// 13 C  身長
    'weight',						// 14 C  体重
    'dialysis',						// 15 C  透析区分    table-4
    'meal_clss',					// 16 C  食事区分    table-5
    'meal_text',					// 17 O  食事区分テキスト
    'pregnancy',					// 18 O  妊娠週数
    'order_id',						// 19 R  オーダーID fc_id:pt_id:sampling_date:lab_code => lab order ID
    'hosp_visit',					// 20 R  入外区分    table-6
    'order_date',					// 21 RE 検査依頼日時 YYYYMMDDHHMMSS
    'order_comment',			    // 22 O  オーダーコメント
    'sampling_date',			    // 23 R  検体採取日時 YYYYMMDDHHMMSS
    'spc_type',						// 24 R  検体タイプ   table-7
    'spc_comment',				    // 25 O  検体コメント
    'urine_vol',					// 26 C  尿量
    'test_code',					// 27 RE テスト項目独自コード  検査センター独自
    'test_name',					// 28 RE テスト項目名称　　検査センター独自
    'test_heading',				    // 29 R  テスト項目見出し    table-8
    'jlacten',						// 30 RE JLAC10
    'receipt_code',				    // 31 O  レセ電コード
    'test_date',					// 32 O  検査実施日（受付日） YYYYMMDDHHMMSS
    'result_status',			    // 33 R  検査結果状態  table-9
    'result_value',				    // 34 C  結果値 結果なし以外は必須
    'value_form',					// 35 RE 結果値形態コード U（以上） E（以下） L（未満） O（超過） B（結果なし） table-10
    'unit',							// 36 O  単位
    'ref_value_clss',			    // 37 O  基準値区分コード -（範囲） E（以下） L（未満） U（以上）    table-11
    'lower_limit',				    // 38 O  下限値
    'upper_limit',				    // 39 O  上限値
    'abnormal_flg',				    // 40 O  異常値フラグ L H LL HH < > N A AA U D B W S R I MS VS     table-12
    'comment_code1',			    // 41 O  結果コメントコード
    'comment1',						// 42 O  結果コメント
    'comment_code2',			    // 43 O  結果コメントコード
    'comment2'						// 44 O  結果コメント
];

// MML
// sampleTime -> sampling_date
// registTime（受付日時） -> order_date  ??
// reportTime（報告日時） -> test_date ???
// creator -> laboratory center
// confirmdate -> 報告日時に一致

const SPC_CODE = {
    '001': '尿(含むその他)',
    '002': '自然排尿',
    '003': '新鮮尿',
    '004': '蓄尿',
    '005': '時間尿',
    '006': '早朝尿',
    '007': '負荷後尿',
    '008': '分杯尿',
    '009': 'カテーテル採取尿',
    '010': '尿ろ紙',
    '011': '膀胱穿刺',
    '012': '動物尿',
    '015': '便',
    '017': '血液(含むその他)',
    '018': '全血',
    '019': '全血(添加物入り)',
    '020': '動脈血',
    '021': '毛細管血',
    '022': '血漿',
    '023': '血清',
    '024': '血球浮遊液',
    '025': '赤血球',
    '026': 'リンパ球',
    '027': '血小板',
    '028': '白血球',
    '029': '臍帯血',
    '030': '溶血液',
    '031': '除タンパク液',
    '032': '血液抽出液',
    '033': '血液ろ紙',
    '034': '血液塗抹標本',
    '035': '造血幹細胞',
    '036': '動物血',
    '037': '動物全血',
    '038': '動物血漿',
    '039': '動物血清',
    '040': '穿刺液(含むその他)',
    '041': '髄液',
    '042': '胸水',
    '043': '腹水',
    '044': '関節液',
    '045': '心嚢液',
    '046': '骨髄液',
    '047': '羊水',
    '048': '腰椎',
    '049': '骨髄塗抹標本',
    '050': '分泌液(含むその他)',
    '051': '消化器系からの分泌液',
    '052': '胃液',
    '053': '十二指腸液',
    '054': '胆汁',
    '055': '膵液',
    '056': '唾液',
    '057': '乳頭分泌液',
    '058': '子宮頸管粘液',
    '059': '前立腺液',
    '060': '精液',
    '061': '喀痰',
    '062': '乳汁',
    '063': '鼻汁',
    '064': '咽喉からの分泌液',
    '065': '耳からの分泌液',
    '066': '目からの分泌液',
    '067': '膣からの分泌液',
    '068': '皮膚からの分泌液(汗)',
    '069': '気管からの分泌液',
    '070': '組織*(含むその他)',
    '071': '生検組織*',
    '072': '試験切除組織*',
    '073': '手術切除組織*',
    '074': '剖検切除組織*',
    '075': '固定組織*',
    '076': '固定細胞',
    '077': '毛髪',
    '078': '爪',
    '079': 'うがい液',
    '080': '菌株',
    '081': '結石(含むその他)',
    '082': '尿路系結石',
    '083': '胆石',
    '084': '細胞浮遊液',
    '085': '擦過物',
    '086': '膿(含むその他)',
    '087': '開放性の膿',
    '088': '非開放性の膿',
    '089': '水泡内容物',
    '090': '嘔吐物',
    '091': '洗浄液',
    '092': '血液以外の抽出液',
    '093': '浸出液',
    '094': '塗抹標本(血液，骨髄以外)',
    '095': '透析液',
    '096': 'かん流液',
    '097': '培養液',
    '098': 'ペア材料',
    '099': 'その他の材料'
};

const SPC_CODE_SYSTEM = 'SMALL HOSPITAL INTERFACE TABLE7';

const VALUE_FORM = {
    'U': '以上',
    'E': '以下',
    'L': '未満',
    'O': '超過',
    'B': '結果なし',
};

const ABNORMAL_FLAG = [
    'L', 'H', 'LL', 'HH', '<', '>', 'N', 'A', 'AA', 'U', 'D', 'B', 'W', 'S', 'R', 'I', 'MS', 'VS'
];

const genderFrom = value => {
    return (value && value === '1') ? 'M' : (value && value === '2') ? 'F' : 'U';
};

const dobFrom = value => {
    if (!value) {
        return '';
    }
    const arr = [];
    arr.push(value.substring(0, 4));
    arr.push(value.substring(4, 6));
    arr.push(value.substring(6));
    return arr.join('-');
};

// fcId = magellan facility_id
const parseArray = (arr, fcId, fcName, numDigits) => {
    let error;
    // Fill ''
    const obj = HEADERS.reduce((acc, attr) => {
        acc[attr] = '';
        return acc;
    }, {});
    let hasOrderId = false;
    let needsToSetOrderDate = false;
    // const arr = line.split(',');
    const parse = arr.every((item, index) => {
        // white space -> '' , " ->''
        const trim = `${item}`.replace(/\s+/g, '').replace(/"/g, '');
        // Half-Kana -> Full-Kana
        const normalized = normalize(trim);
        // Object Key
        const key = HEADERS[index];

        switch (index) {
            case 0:
                // Lab Code
                if (normalized) {
                    obj[key] = normalized;
                } else {
                    error = 'ラボラトリーコード';
                }
                break;
            case 1:
                // Lab Name
                obj[key] = normalized ? normalized : obj[0];  // lab_code
                break;
            case 2:
                // Specification = Institution Code
                // obj[key] = normalized ? normalized : fcId;  // Institution Code or magellan id
                obj[key] = fcId;  // magellan id
                break;
            case 3:
                // Facility Name -> magellan value
                obj[key] = fcName;  // or normalized
                break;
            case 7:
                // Patient ID
                if (normalized) {
                    obj[key] = addZero(normalized, numDigits);
                } else {
                    error = '患者ID';
                }
                break;
            case 10:
                // Date of Birth
                obj[key] = normalized ? dobFrom(normalized) : '';  // 生年月日なしあり（広島）
                break;
            case 11:
                // Sex
                if (normalized) {
                    obj[key] = genderFrom(normalized);
                } else {
                    error = '性別';
                }
                break;
            case 19:
                // Order ID
                if (normalized) {
                    obj[key] = normalized;
                    hasOrderId = true;
                } else {
                    hasOrderId = false;     // set locally
                }
                break;
            case 21:
                // Ordered at
                if (normalized) {
                    obj[key] = isoStringFromString(normalized);
                } else {
                    // error = '検査依頼日';
                    // 必須なので検体採取日をセット
                    needsToSetOrderDate = true;
                }
                break;
            case 23:
                // Sampling at
                if (normalized) {
                    obj[key] = isoStringFromString(normalized);
                } else {
                    error = '検体採取日時';
                }
                break;
            case 24:
                // Specimen
                if (normalized) {
                    let tempKey = normalized;
                    if (tempKey.length === 1) {
                        tempKey = `00${tempKey}`;
                    } else if (tempKey.length === 2) {
                        tempKey = `0${tempKey}`;
                    }
                    const spcName = SPC_CODE[tempKey];
                    if (spcName) {
                        obj[key] = tempKey;
                        obj['spc_name'] = spcName;   // add
                        obj['spc_code_sys'] = SPC_CODE_SYSTEM;  // Code System
                    } else {
                        obj[key] = normalized;
                        obj['spc_name'] = normalized;
                        obj['spc_code_sys'] = `${normalized}(${obj[0]})`;
                    }
                } else {
                    // ToDo No specimen case....
                }
                break;
            case 27:
                // Test Code
                if (normalized) {
                    obj[key] = normalized;
                } else {
                    error = '検査コード';
                }
                break;
            case 28:
                // Test Name
                if (normalized) {
                    obj[key] = normalized;
                } else {
                    error = '検査名称';
                }
                break;
            case 32:
                // Test Date（Accept Date）
                if (normalized) {
                    // 検査実施日（受付日） 
                    obj[key] = isoStringFromString(normalized);
                } else {
                    // Set sampling date below
                }
                break;
            case 33:
                // Result Status
                if (normalized) {
                    obj[key] = normalized;
                } else {
                    // error = '検査結果状態';
                    // return false;
                    obj[key] = 'F';  // SRL!!
                }
                break;
            case 35:
                // Value Type
                if (normalized && normalized.match(/[UELOB]/)) {
                    obj[key] = normalized;
                    obj['value_type'] = VALUE_FORM[normalized];   // add
                } else {
                    obj[key] = '';
                    obj['value_type'] = '';
                }
                break;
            case 37:
                if (normalized && normalized.match(/[-ELU]/)) {
                    obj[key] = normalized;
                } else {
                    obj[key] = '';
                }
                break;
            case 40:
                // abnormal flag
                if (!normalized) {
                    obj[key] = '';
                }
                const flg = ABNORMAL_FLAG.some(flg => {
                    if (normalized === flg) {
                        obj[key] = normalized;
                        return true;
                    }
                    return false;
                });
                if (!flg) {
                    obj[key] = '';
                }
                break; 
            default:
                obj[key] = normalized ? normalized : '';
                break;
        }

        return error ? false : true;

    });

    if (!parse) {
        console.log(obj);
        return {error: {message: `${error}がありません`}};
    }

    // 検査依頼日 をセットするのが必要な場合
    if (needsToSetOrderDate) {
        obj['order_date'] = obj['sampling_date'];
    }
    // test only  repeat 4 times
    if (TEST_ONLY) {
        obj['pt_name'] = null;
        obj['pt_kana'] = null;
        obj['pt_dob'] = null;
        obj['pt_gender'] = null;
        obj['fc_id'] = fcId;    // to avoid dummy data
        if (ROT_COUNT === 0) {
            if (obj['pt_id'] === '000001') {
                obj['pt_id'] = '000005';
            } else if (obj['pt_id'] === '000002') {
                obj['pt_id'] = '000006';
            } else if (obj['pt_id'] === '000003') {
                obj['pt_id'] = '000007';
            } else if (obj['pt_id'] === '000004') {
                obj['pt_id'] = '000008';
            }
            const dt = '2022-05-10T08:00:00';
            obj['order_date'] = dt;
            obj['sampling_date'] = dt;
            obj['test_date'] = dt;

        } else if (ROT_COUNT === 1) {
            if (obj['pt_id'] === '000001') {
                obj['pt_id'] = '000006';
            } else if (obj['pt_id'] === '000002') {
                obj['pt_id'] = '000007';
            } else if (obj['pt_id'] === '000003') {
                obj['pt_id'] = '000008';
            } else if (obj['pt_id'] === '000004') {
                obj['pt_id'] = '000005';
            }
            const dt = '2022-04-10T08:00:00';
            obj['order_date'] = dt;
            obj['sampling_date'] = dt;
            obj['test_date'] = dt;
        } else if (ROT_COUNT === 2) {
            if (obj['pt_id'] === '000001') {
                obj['pt_id'] = '000007';
            } else if (obj['pt_id'] === '000002') {
                obj['pt_id'] = '000008';
            } else if (obj['pt_id'] === '000003') {
                obj['pt_id'] = '000005';
            } else if (obj['pt_id'] === '000004') {
                obj['pt_id'] = '000006';
            }
            const dt = '2022-03-10T08:00:00';
            obj['order_date'] = dt;
            obj['sampling_date'] = dt;
            obj['test_date'] = dt;
        } else if (ROT_COUNT === 3) {
            if (obj['pt_id'] === '000001') {
                obj['pt_id'] = '000008';
            } else if (obj['pt_id'] === '000002') {
                obj['pt_id'] = '000005';
            } else if (obj['pt_id'] === '000003') {
                obj['pt_id'] = '000006';
            } else if (obj['pt_id'] === '000004') {
                obj['pt_id'] = '000007';
            }
            const dt = '2022-02-10T08:00:00';
            obj['order_date'] = dt;
            obj['sampling_date'] = dt;
            obj['test_date'] = dt;
        }
        // orderId
        const temp = [];
        temp.push(obj['fc_id']);
        temp.push(obj['pt_id']);
        temp.push(obj['sampling_date']);
        temp.push(obj['lab_code']);
        obj['order_id'] = temp.join('_');  // index されている
    }
    if (!hasOrderId) {
        const temp = [];
        // temp.push(obj['fc_id']);    // magellan.id
        temp.push(fcId);   // use magellan.id
        temp.push(obj['pt_id']);
        temp.push(obj['sampling_date']);
        temp.push(obj['lab_code']);
        obj['order_id'] = temp.join('_');  // index されている
    }
    return obj;
};

// CSV to LabTest
const contentToLabTest = (content, fcId, fcName, numDigits, cb) => {
    const results = [];
    let error = null;

    // 改行区切り -> line array
    const lines = content.split('\n');

    // Convert each line to test object(record)
    for (let i = SKIP; i < lines.length; i += 1) {
        const arr = lines[i].split(',');
        if (arr.length < 28) {
            // Header row を飛ばすため
            continue;
        }
        const obj = parseArray(arr, fcId, fcName, numDigits);
        if (obj.error) {
            error = obj.error.message;
            break;
        } else {
            results.push(obj);
        }
    }
    cb(error, results);
};

// Encoding Shift_JIS... cb callback
// fcId: 結果ファイルの施設IDを magellan の施設IDへ置き換える
export const parseTestFile = (file, fcId, fcName, numDigits, cb) => {
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        contentToLabTest(text, fcId, fcName, numDigits, cb);
    };
    reader.readAsText(file, ENCODING);   // Shift_JIS...
};

