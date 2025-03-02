import { v4 } from "uuid";
import dateFormat from "dateformat";
import { ISO_DATE_TIME } from "./karteCtx";
import { halfFrom } from "../util/strings";

// Claim Item の種類 MML 由来
const CLAIM_PROCEDURE = 1; // 診療行為
const CLAIM_MEDICINE = 2; // 医薬品
const CLAIM_MATERIAL = 3; // 器材
const CLAIM_INSTRUCTION = 4; // 用法（固有）
const CLAIM_COMMENT = 5; // コメント（固有）
const CLAIM_BODY_PART = 6; // 部位（固有）

// 用法
const DOSE_TYPE_INTERNAL = "1"; // 内用
const DOSE_TYPE_TOPICAL = "6"; // 外用
const DOSE_TYPE_INJECTION = "4"; // 注射
const DOSE_TYPE_OTHER = "3"; // その他
const DOSE_TYPE_DENTAL = "8"; // 歯科用
const DOSE_TYPE_DIAGNOSIS = "30"; // 病名をカラー化するため

// 院内・院外処方
const INTERNAL_MEDICINE = "1"; // 院外処方
const EXTERNAL_MEDICINE = "2"; // 院内処方

// コンポジットデザイン用のグルーピングコード
// ソート順に KarteBoard へ表示される
const GROUP_DIAGNOSIS = "000"; // 病名
const GROUP_FIRST_VISIT = "110"; // 初診
const GROUP_FOLLOW_UP_VISIT = "120"; // 再診
// 拡張
const GROUP_VITAL_SIGN = "A100"; // バイタルサイン
const GROUP_PHYSICAL_EXAM = "A200"; // 身体所見
const GROUP_CAMERA = "B100"; // Camera
const GROUP_SCHEMA = "B200"; // シェーマ
const GROUP_REF_IMAGE = "Z100"; // 画像
const GROUP_PDF = "Z110"; // PDFファイル
// 以下テスト
const GROUP_BLOOD_SUGAR_LEVEL = "C100";
const GROUP_DIABETES = "C110";
const GROUP_BONE_DENSITY = "D100";
const GROUP_SMI = "D110";
const GROUP_LCS = "D120";
const GROUP_QOL = "E100";

const VISIT_TYPE_FIRST = "初診";
const VISIT_TYPE_FOLLOW_UP = "再診";

const MASTER_ATTR_PROCEDURE = [
  "col_001",
  "code",
  "name",
  "unitCode",
  "unit",
  "tensuType",
  "tensu",
  "inOutFlg",
  "claimClass",
  "col_016",
  "hospClinicFlg",
  "col_016,",
  "col_020",
  "col_030",
  "col_038",
  "col_039",
  "col_046",
  "col_047",
  "col_052",
  "col_053",
  "col_054",
  "col_055",
  "col_056",
  "col_063",
  "col_064",
  "col_067",
  "col_068",
  "col_082",
  "tensuKbn",
  "kbnNo",
  "kbnEda",
  "discontinuedAt",
  "col_114",
  "col_115",
  "col_116",
  "col_119",
  "col_121",
  "col_122",
];

const MASTER_ATTR_MEDICINE = [
  "col_01",
  "code",
  "name",
  "unitCode",
  "unit",
  "tensuType",
  "tensu",
  "koseishin",
  "doseType",
  "yjCode",
  "discontinuedAt",
];

const MASTER_ATTR_MATERIAL = [
  "col_01",
  "code",
  "name",
  "unitCode",
  "unit",
  "tensuType",
  "tensu",
  "discontinuedAt",
];

const MASTER_ATTR_INSTRUCTION = ["code", "name"];
const MASTER_ATTR_COMMENT = ["code", "name"];
const EXCLUSIVE_ATTR_FOR_ADDITION = [
  "col_020",
  "col_046",
  "col_047",
  "col_053",
  "col_054",
  "col_055",
  "col_064",
  "col_067",
  "col_082",
  "col_114",
  "col_115",
  "col_116",
  "col_119",
  "col_121",
  "col_122",
];

// 診療行為マスター
const c68_告示等識別区分 = "col_068";
const c38_注加算コード = "col_038";
const c39_注加算通番 = "col_039";
const 基本項目 = "1";
const 合成項目 = "3";
const 準用項目 = "5";
const 注加算 = "7";
const 通則加算 = "9";

const regexp = new RegExp(/^[-+]?[0-9]+(\.[0-9]+)?$/);
const DEBUG = false;

// Claim の group = 組み合わされた最初の診療行為Itemの診療種区分
const ENTITY_BUNDLE = {
  disease: {
    entity: "diagnosis", // entity = disease to diagnosis
    category: GROUP_DIAGNOSIS,
    group: GROUP_DIAGNOSIS,
    name: "傷病名",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "",
  },
  baseCharge: {
    entity: "baseCharge",
    category: "A",
    group: "",
    name: "診断料",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  management: {
    entity: "management",
    category: "B",
    group: "",
    name: "管理料",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  home: {
    entity: "home",
    category: "C",
    group: "",
    name: "在宅指導管理",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  rp: {
    entity: "rp",
    category: "F",
    group: "", // 21 22 23 29
    name: "処方",
    quantity: "",
    unit: "", // 日分 || 回数
    issuedTo: "external", // external || internal
    oral: false, // 内服
    prn: false, // 頓服
    topical: false, // 外用
    temporary: false, // 臨時処方
    freqPerDay: "", // 1日の回数
    claimItems: [],
    onSubmit: "submitBundle",
  },
  injection: {
    entity: "injection",
    category: "G",
    group: "",
    name: "注射",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  treatment: {
    entity: "treatment",
    category: "J",
    group: "400",
    name: "処置",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  surgery: {
    entity: "surgery",
    category: "K",
    group: "500",
    name: "手術",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  labTest: {
    entity: "labTest",
    category: "D",
    group: "600",
    name: "検体検査",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  physiology: {
    entity: "physiology",
    category: "D",
    group: "600",
    name: "生体検査",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  image: {
    entity: "image",
    category: "E",
    group: "700",
    name: "画像診断",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  rehabilitation: {
    entity: "rehabilitation",
    category: "H",
    group: "",
    name: "リハビリ",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  psychiatric: {
    entity: "psychiatric",
    category: "I",
    group: "",
    name: "精神治療",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  radiotherapy: {
    entity: "radiotherapy",
    category: "M",
    group: "",
    name: "放射線治療",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  anesthesia: {
    entity: "anesthesia",
    category: "L",
    group: "",
    name: "麻酔料",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  pathology: {
    entity: "pathology",
    category: "N",
    group: "",
    name: "病理診断",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  other: {
    entity: "other",
    category: "",
    group: "800",
    name: "その他",
    quantity: "1",
    unit: "",
    claimItems: [],
    onSubmit: "submitBundle",
  },
  camera: {
    entity: "camera",
    category: GROUP_CAMERA,
    group: GROUP_CAMERA,
    name: "カメラ撮影",
    quantity: "1",
    unit: "",
    claimItems: [],
    onCreate: "submitSchemaBundle",
    onUploadCancel: "setSchemaToEdit",
    onFinal: "setSchemaToEdit",
  },
  schema: {
    entity: "schema",
    category: GROUP_SCHEMA,
    group: GROUP_SCHEMA,
    name: "シェーマ",
    quantity: "1",
    unit: "",
    claimItems: [],
    onCreate: "submitSchemaBundle",
    onUploadCancel: "setSchemaToEdit",
    onFinal: "setSchemaToEdit",
  },
  refImage: {
    entity: "refImage",
    category: GROUP_REF_IMAGE,
    group: GROUP_REF_IMAGE,
    name: "参照画像",
    quantity: "1",
    unit: "",
    claimItems: [],
    onCreate: "submitImageFile",
    onUploadCancel: "setImageFileToUpload",
    onFinal: "setImageFileToUpload",
  },
  pdf: {
    entity: "pdf",
    category: GROUP_PDF,
    group: GROUP_PDF,
    name: "PDF",
    quantity: "1",
    unit: "",
    claimItems: [],
    onCreate: "submitPDFFile",
    onUploadCancel: "setPdfFileToUpload",
    onFinal: "setPdfFileToUpload",
  },
  input: {
    entity: "",
    category: "",
    group: "",
    name: "",
    quantity: "1",
    unit: "",
    mandatory: "",
    claimItems: [],
  },
};

const CLAIM_ITEM_DIAGNOSIS = {
  id: "",
  category: GROUP_DIAGNOSIS,
  group: GROUP_DIAGNOSIS,
  type: 1,
  code: "",
  name: "",
  // value: 1,
  // unit: '',
  memo: "",
  description: "",
  drop: 0,
  icd1012: "",
  diagnosisCategory: "",
  dateOfOnset: "",
  dateOfRemission: "",
  outcome: "",
};

const CLAIM_ITEM_CLAIM = {
  id: "",
  category: "",
  group: "",
  type: 1, // procedure=1, medicine=2, material=3, instruction=4, comment=5, bodyParts=6
  code: "",
  name: "",
  value: 1, // how to use
  unit: "",
  memo: "",
  description: "",
  drop: 0, // instruction=4, comment=5, bodyParts=6
  quantity: "", // 内服は1日の量、外用は全量、屯服はなし
  quantityPerOnce: "", // 1回の量 内服と屯服
  freqPerDay: "", // 一日の服薬回数
  doseType: "", // 内用、外用、注射薬の区別
};

const CLAIM_ITEM_CAMERA = {
  id: "",
  category: GROUP_CAMERA,
  group: GROUP_CAMERA,
  type: 1,
  code: "01",
  name: "撮影",
  // value: 1,
  // unit: '',
  memo: "",
  description: "",
  drop: 0,
  fileName: "",
  contentType: "",
  size: 0,
  lastModified: 0,
  thumbnail: "",
  body: "",
  makeModel: "", // Exif model
};

const CLAIM_ITEM_SCHEMA = {
  id: "",
  category: GROUP_SCHEMA,
  group: GROUP_SCHEMA,
  type: 1,
  code: "01",
  name: "シェーマ",
  // value: 1,
  // unit: '',
  memo: "",
  description: "",
  drop: 0,
  fileName: "",
  contentType: "",
  size: 0,
  lastModified: 0,
  thumbnail: "",
  body: "",
};

const CLAIM_ITEM_IMAGE = {
  id: "",
  category: GROUP_REF_IMAGE,
  group: GROUP_REF_IMAGE,
  type: 1,
  code: "01",
  name: "参照画像",
  // value: 1,
  // unit: '',
  memo: "",
  description: "",
  drop: 0,
  fileName: "",
  contentType: "",
  size: 0,
  lastModified: 0,
  thumbnail: "",
  body: "",
};

const CLAIM_ITEM_PDF = {
  id: "",
  category: GROUP_PDF,
  group: GROUP_PDF,
  type: 1,
  code: "01",
  name: "PDF",
  // value: 1,
  // unit: '',
  memo: "",
  description: "",
  drop: 0,
  fileName: "",
  contentType: "",
  size: 0,
  lastModified: 0,
  body: "",
};

const CLAIM_ITEM_INPUT = {
  id: "",
  category: "",
  group: "",
  type: 1,
  code: "",
  name: "",
  value: 0,
  unit: "",
  memo: "",
  description: "",
  drop: 0,
  strValue: "",
  valueType: "",
  fracDigits: 0,
  equation: "",
  equationParams: "",
  evalFunc: "",
  evalParams: "",
};

const STAMP_ITEM_CLAIM = {
  id: "",
  category: "",
  group: "",
  type: 1, // procedure=1, medicine=2, material=3, instruction=4, comment=5, bodyParts=6
  code: "",
  name: "",
  unit: "",
  drop: 0, // instruction=4, comment=5, bodyParts=6
  quantity: "1",
  doseType: "",
};

const RECEIPT_CODE_NAME = {
  "00": "傷病名",
  11: "初診",
  12: "再診",
  13: "医学管理",
  14: "在宅",
  21: "内服",
  22: "屯服",
  23: "外用",
  24: "調剤",
  25: "処方",
  26: "麻毒",
  27: "調基",
  28: "投薬その他",
  31: "皮下筋肉内注射",
  32: "静脈内注射",
  33: "注射その他",
  39: "薬剤料減点",
  40: "処置",
  50: "手術",
  54: "麻酔",
  60: "検査・病理",
  70: "画像診断",
  80: "その他",
};

const RECEIPT_AGGREGATE = {
  11: "初診",
  12: "再診",
  13: "医学管理",
  14: "在宅",
  2: "投薬",
  3: "注射",
  40: "処置",
  50: "手術",
  54: "麻酔",
  60: "検査・病理",
  70: "画像診断",
  80: "その他",
};

const ENTITY_STANDARD_KBN = [
  { entity: "baseCharge", name: "初診・再診料(A)", abbr: "診断" }, // abbreviated name
  { entity: "management", name: "医学管理等(B)", abbr: "管理" },
  { entity: "home", name: "在宅医療(C)", abbr: "在宅" },
  { entity: "rp", name: "処方(F)", abbr: "処方" },
  { entity: "injection", name: "注射(G)", abbr: "注射" },
  { entity: "treatment", name: "処置(J)", abbr: "処置" },
  { entity: "surgery", name: "手術(K)", abbr: "手術" },
  { entity: "labTest", name: "検体検査(D)", abbr: "検体" },
  { entity: "physiology", name: "生体検査(D)", abbr: "生体" },
  { entity: "image", name: "画像診断(E)", abbr: "画像" },
  { entity: "rehabilitation", name: "リハビリテーション(H)", abbr: "リハ" },
  { entity: "psychiatric", name: "精神科専門療法(I)", abbr: "精神" },
  { entity: "radiotherapy", name: "放射線治療(M)", abbr: "放射" },
  { entity: "anesthesia", name: "麻酔料(L)", abbr: "麻酔" },
  { entity: "pathology", name: "病理診断(N)", abbr: "病理" },
];

// マスター検索のDropdown menuに設定する診療行為
// 検索する診療行為区分、区分番号
// menuTitle -> Click Dropdown の初期化時に表示する名前
const ENTITY_PROCEDURE_KBN = [
  {
    entity: "diagnosis",
    kbn: "diagnosis",
    manuTitle: "傷病名",
    categories: [],
  },
  {
    entity: "baseCharge",
    kbn: "A",
    menuTitle: "診断料（A）",
    categories: [
      {
        name: "初診料",
        kbn: "A",
        kbn_no: ["000", "000"],
        id: v4(),
      },
      {
        name: "再診料",
        kbn: "A",
        kbn_no: ["001", "001"],
        id: v4(),
      },
    ],
  },
  {
    entity: "management",
    kbn: "B",
    menuTitle: "管理料（B）",
    categories: [
      {
        name: "治療関連",
        kbn: "B",
        kbn_no: ["000", "001"],
        id: v4(),
      },
      {
        name: "地域・施設連携関連",
        kbn: "B",
        kbn_no: ["002", "007"],
        id: v4(),
      },
      {
        name: "情報提供・安全管理関連",
        kbn: "B",
        kbn_no: ["008", "014"],
        id: v4(),
      },
    ],
  },
  {
    entity: "home",
    kbn: "C",
    menuTitle: "在宅指導管理（B）",
    categories: [
      {
        name: "在宅患者診療・指導料",
        kbn: "C",
        kbn_no: ["000", "013"],
        id: v4(),
      },
      {
        name: "在宅療養指導管理料",
        kbn: "C",
        kbn_no: ["100", "114"],
        id: v4(),
      },
      {
        name: "在宅療養指導材料料",
        kbn: "C",
        kbn_no: ["150", "170"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'C', kbn_no: ['200', '200'], sinku: '140'},
      // {name: '特定保険医療材料料', kbn: 'C', kbn_no: ['300', '300'], sinku: '14'}
    ],
  },
  {
    entity: "rp",
    kbn: "F",
    menuTitle: "処方（F）",
    categories: [
      { name: "院外", kbn: "F", kbn_no: ["400", "400"], id: v4() },
      { name: "院内", kbn: "F", kbn_no: ["100", "100"], id: v4() },
      { name: "調剤", kbn: "F", kbn_no: ["000", "000"], id: v4() },
    ],
  },
  {
    entity: "injection",
    kbn: "G",
    menuTitle: "注射（G）",
    categories: [
      {
        name: "注射実施料",
        kbn: "G",
        kbn_no: ["000", "015"],
        id: v4(),
      },
      {
        name: "無菌製材処理料",
        kbn: "G",
        kbn_no: ["020", "020"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'G', kbn_no: ['100', '100'], sinku: '3'},
      // {name: '特定保険医療材料料', kbn: 'G', kbn_no: ['200', '200'], sinku: '3'}
    ],
  },
  {
    entity: "treatment",
    kbn: "J",
    menuTitle: "処置（J）",
    categories: [
      {
        name: "一般処置",
        kbn: "J",
        kbn_no: ["000", "043"],
        id: v4(),
      },
      {
        name: "救急処置",
        kbn: "J",
        kbn_no: ["044", "052"],
        id: v4(),
      },
      {
        name: "皮膚科処置",
        kbn: "J",
        kbn_no: ["053", "057"],
        id: v4(),
      },
      {
        name: "泌尿器科処置",
        kbn: "J",
        kbn_no: ["058", "070"],
        id: v4(),
      },
      {
        name: "産婦人科処置",
        kbn: "J",
        kbn_no: ["071", "085"],
        id: v4(),
      },
      {
        name: "眼科処置",
        kbn: "J",
        kbn_no: ["086", "093"],
        id: v4(),
      },
      {
        name: "耳鼻咽頭科処置",
        kbn: "J",
        kbn_no: ["095", "115"],
        id: v4(),
      },
      {
        name: "整形外科処置",
        kbn: "J",
        kbn_no: ["116", "119"],
        id: v4(),
      },
      {
        name: "栄養処置",
        kbn: "J",
        kbn_no: ["120", "121"],
        id: v4(),
      },
      {
        name: "ギプス",
        kbn: "J",
        kbn_no: ["122", "129"],
        id: v4(),
      },
      {
        name: "処置医療機器等加算",
        kbn: "J",
        kbn_no: ["200", "201"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'J', kbn_no: ['300', '399'], sinku: '4'},
      // {name: '特定保健医療材料料', kbn: 'J', kbn_no: ['400', '499'], sinku: '4'}
    ],
  },
  {
    entity: "surgery",
    kbn: "K",
    menuTitle: "手術（K）",
    categories: [
      {
        name: "皮膚・皮下組織",
        kbn: "K",
        kbn_no: ["000", "022"],
        id: v4(),
      },
      {
        name: "筋骨格系・四肢・体幹",
        kbn: "K",
        kbn_no: ["023", "144"],
        id: v4(),
      },
      {
        name: "神経系・頭蓋",
        kbn: "K",
        kbn_no: ["145", "198"],
        id: v4(),
      },
      { name: "眼", kbn: "K", kbn_no: ["199", "284"], id: v4() },
      {
        name: "耳鼻咽喉",
        kbn: "K",
        kbn_no: ["285", "403"],
        id: v4(),
      },
      {
        name: "顔面・口腔・頸部",
        kbn: "K",
        kbn_no: ["404", "471"],
        id: v4(),
      },
      { name: "胸部", kbn: "K", kbn_no: ["472", "537"], id: v4() },
      {
        name: "心・脈管",
        kbn: "K",
        kbn_no: ["538", "628"],
        id: v4(),
      },
      { name: "腹部", kbn: "K", kbn_no: ["630", "753"], id: v4() },
      {
        name: "尿路系・副腎",
        kbn: "K",
        kbn_no: ["754", "823"],
        id: v4(),
      },
      {
        name: "男子性器",
        kbn: "K",
        kbn_no: ["824", "843"],
        id: v4(),
      },
      {
        name: "女子性器",
        kbn: "K",
        kbn_no: ["844", "913"],
        id: v4(),
      },
      {
        name: "脳死臓器提供管理料",
        kbn: "K",
        kbn_no: ["914", "915"],
        id: v4(),
      },
      {
        name: "輸血料",
        kbn: "K",
        kbn_no: ["920", "924"],
        id: v4(),
      },
      {
        name: "手術医療機器等加算",
        kbn: "K",
        kbn_no: ["930", "939"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'K', kbn_no: ['940', '940'], sinku: '5'},
      // {name: '特定保健医療材料料', kbn: 'K', kbn_no: ['950', '950'], sinku: '5'}
    ],
  },
  {
    entity: "labTest",
    kbn: "D",
    menuTitle: "検体検査（D）",
    categories: [
      {
        name: "尿・糞便検査",
        kbn: "D",
        kbn_no: ["000", "004"],
        id: v4(),
      },
      {
        name: "血液学的検査",
        kbn: "D",
        kbn_no: ["005", "006"],
        id: v4(),
      },
      {
        name: "生化学的検査(I)",
        kbn: "D",
        kbn_no: ["007", "007"],
        id: v4(),
      },
      {
        name: "生化学的検査(II)",
        kbn: "D",
        kbn_no: ["008", "010"],
        id: v4(),
      },
      {
        name: "免疫学的検査",
        kbn: "D",
        kbn_no: ["011", "016"],
        id: v4(),
      },
      {
        name: "微生物学的検査",
        kbn: "D",
        kbn_no: ["017", "024"],
        id: v4(),
      },
    ],
  },
  {
    entity: "physiology",
    kbn: "D",
    menuTitle: "生体検査（D）",
    categories: [
      {
        name: "呼吸循環機能検査等",
        kbn: "D",
        kbn_no: ["200", "214"],
        id: v4(),
      },
      {
        name: "超音波検査等",
        kbn: "D",
        kbn_no: ["215", "217"],
        id: v4(),
      },
      {
        name: "監視装置による諸検査",
        kbn: "D",
        kbn_no: ["218", "234"],
        id: v4(),
      },
      {
        name: "脳波検査等",
        kbn: "D",
        kbn_no: ["235", "238"],
        id: v4(),
      },
      {
        name: "神経・筋検査",
        kbn: "D",
        kbn_no: ["239", "242"],
        id: v4(),
      },
      {
        name: "耳鼻咽頭科学的検査",
        kbn: "D",
        kbn_no: ["244", "254"],
        id: v4(),
      },
      {
        name: "眼科学的検査",
        kbn: "D",
        kbn_no: ["255", "282"],
        id: v4(),
      },
      {
        name: "皮膚科学的検査",
        kbn: "D",
        kbn_no: ["282", "282"],
        id: v4(),
      },
      {
        name: "臨床心理・神経心理検査",
        kbn: "D",
        kbn_no: ["283", "285"],
        id: v4(),
      },
      { name: "負荷試験等", kbn: "D", kbn_no: ["286", "291"]},
      {
        name: "ラジオアイソトープ",
        kbn: "D",
        kbn_no: ["292", "294"],
        id: v4(),
      },
      {
        name: "内視鏡検査",
        kbn: "D",
        kbn_no: ["295", "325"],
        id: v4(),
      },
    ],
  },
  {
    entity: "image",
    kbn: "E",
    menuTitle: "画像診断（E）",
    categories: [
      {
        name: "透視・診断",
        kbn: "E",
        kbn_no: ["000", "001"],
        id: v4(),
      },
      {
        name: "撮影料",
        kbn: "E",
        kbn_no: ["002", "002"],
        id: v4(),
      },
      {
        name: "造影剤注入手技",
        kbn: "E",
        kbn_no: ["003", "003"],
        id: v4(),
      },
      {
        name: "核医学診断料",
        kbn: "E",
        kbn_no: ["100", "102"],
        id: v4(),
      },
      {
        name: "コンピュータ断層撮影診断料",
        kbn: "E",
        kbn_no: ["200", "203"],
        id: v4(),
      },
    ],
  },
  {
    entity: "rehabilitation",
    kbn: "H",
    menuTitle: "リハビリ（H）",
    categories: [
      {
        name: "疾患別リハビリ",
        kbn: "H",
        kbn_no: ["000", "003"],
        id: v4(),
      },
      {
        name: "総合計画評価",
        kbn: "H",
        kbn_no: ["003", "003"],
        id: v4(),
      },
      {
        name: "訓練別リハビリ",
        kbn: "H",
        kbn_no: ["004", "008"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'H', kbn_no: ['100', '100'], sinku: '8'}
    ],
  },
  {
    entity: "psychiatric",
    kbn: "I",
    menuTitle: "精神治療（I）",
    categories: [
      {
        name: "精神科専門療法関連",
        kbn: "I",
        kbn_no: ["000", "008"],
        id: v4(),
      },
      {
        name: "デイ・ケア、ナイト・ケア関連",
        kbn: "I",
        kbn_no: ["009", "010"],
        id: v4(),
      },
      {
        name: "指導・管理関連",
        kbn: "I",
        kbn_no: ["011", "013"],
        id: v4(),
      },
      {
        name: "診療科関連",
        kbn: "I",
        kbn_no: ["014", "014"],
        id: v4(),
      },
      {
        name: "重度認知症関連",
        kbn: "I",
        kbn_no: ["015", "015"],
        id: v4(),
      },
      {
        name: "精神科在宅関連",
        kbn: "I",
        kbn_no: ["016", "016"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'I', kbn_no: ['100', '100'], sinku: '8'}
    ],
  },
  {
    entity: "radiotherapy",
    kbn: "M",
    menuTitle: "放射線治療（M）",
    categories: [
      {
        name: "管理料",
        kbn: "M",
        kbn_no: ["000", "000"],
        id: v4(),
      },
      {
        name: "体外照射",
        kbn: "M",
        kbn_no: ["001", "001"],
        id: v4(),
      },
      {
        name: "全身照射",
        kbn: "M",
        kbn_no: ["002", "002"],
        id: v4(),
      },
      {
        name: "電磁波温熱療法",
        kbn: "M",
        kbn_no: ["003", "003"],
        id: v4(),
      },
      {
        name: "密封小線源治療",
        kbn: "M",
        kbn_no: ["004", "004"],
        id: v4(),
      },
      {
        name: "血液照射",
        kbn: "M",
        kbn_no: ["005", "005"],
        id: v4(),
      },
    ],
  },
  {
    entity: "anesthesia",
    kbn: "L",
    menuTitle: "麻酔料（L）",
    categories: [
      {
        name: "手技料",
        kbn: "L",
        kbn_no: ["000", "008"],
        id: v4(),
      },
      {
        name: "管理料",
        kbn: "L",
        kbn_no: ["009", "010"],
        id: v4(),
      },
      {
        name: "神経ブロック料",
        kbn: "L",
        kbn_no: ["100", "105"],
        id: v4(),
      },
      // {name: '薬剤料', kbn: 'L', kbn_no: ['200', '200'], sinku: '54'},
      // {name: '医療材料料', kbn: 'M', kbn_no: ['300', '300'], sinku: '54'}
    ],
  },
  {
    entity: "pathology",
    kbn: "N",
    menuTitle: "病理診断（B）",
    categories: [
      {
        name: "標本作成料",
        kbn: "N",
        kbn_no: ["000", "005"],
        id: v4(),
      },
      {
        name: "診断・判断料",
        kbn: "N",
        kbn_no: ["006", "007"],
        id: v4(),
      },
    ],
  },
];

const COMMENT_KBN = {
  default: [
    { label: "81系", code: "81", id: v4() },
    { label: "82系", code: "82", id: v4() },
    { label: "83系", code: "83", id: v4() },
    { label: "84系", code: "84", id: v4() },
    { label: "85系", code: "85", id: v4() },
    { label: "88系", code: "88", id: v4() },
    { label: "89系", code: "89", id: v4() },
  ],
  imagingPart: [
    { label: "81系", code: "81", id: v4() },
    { label: "82系", code: "82018", id: v4() },
    { label: "83系", code: "83018", id: v4() },
    { label: "89系", code: "89", id: v4() },
  ],
};

// 用法検索メニュー
const ADMIN_IN_MEDICINE_MENU = {
  name: "用法",
  menuTitle: "用法（内服）",
  categories: [
    { name: "１日１回", admin_code: "1", reg: "^１日１回", id: v4() },
    { name: "１日２回", admin_code: "1", reg: "^１日２回", id: v4() },
    { name: "１日３回", admin_code: "1", reg: "^１日３回", id: v4() },
    { name: "１日４回", admin_code: "1", reg: "^１日４回", id: v4() },
    {
      name: "１日５、6、7回、8回",
      admin_code: "1",
      reg: "^１日５回|^１日６回|^１日７回^日８回|１日○回",
      id: v4(),
    },
    { name: "-" },
    { name: "頓服", admin_code: "1", timing_code: "5", id: v4() },
  ],
};

const ADMIN_EXT_MEDICINE_MENU = {
  name: "用法",
  menuTitle: "用法（外用）",
  categories: [
    { name: "貼付", admin_code: "2", detail_code: "A", id: v4() },
    { name: "塗布", admin_code: "2", detail_code: "B", id: v4() },
    { name: "湿布", admin_code: "2", detail_code: "C", id: v4() },
    { name: "撒布", admin_code: "2", detail_code: "D", id: v4() },
    { name: "噴霧", admin_code: "2", detail_code: "E", id: v4() },
    { name: "消毒", admin_code: "2", detail_code: "F", id: v4() },
    { name: "-" },
    { name: "点耳", admin_code: "2", detail_code: "G", id: v4() },
    { name: "点眼", admin_code: "2", detail_code: "H", id: v4() },
    { name: "点鼻", admin_code: "2", detail_code: "J", id: v4() },
    { name: "-" },
    { name: "うがい", admin_code: "2", detail_code: "K", id: v4() },
    { name: "吸入", admin_code: "2", detail_code: "L", id: v4() },
    { name: "トローチ", admin_code: "2", detail_code: "M", id: v4() },
    { name: "-" },
    { name: "膀胱洗浄", admin_code: "2", detail_code: "N", id: v4() },
    { name: "鼻腔内洗浄", admin_code: "2", detail_code: "P", id: v4() },
    { name: "浣腸", admin_code: "2", detail_code: "Q", id: v4() },
    { name: "肛門挿入", admin_code: "2", detail_code: "R", id: v4() },
    { name: "肛門注入", admin_code: "2", detail_code: "S", id: v4() },
    { name: "腟内挿入", admin_code: "2", detail_code: "T", id: v4() },
    { name: "膀胱注入", admin_code: "2", detail_code: "U", id: v4() },
  ],
};

class ClaimModel {
  constructor() { }

  isProcedure(item) {
    return item && item.code.startsWith("1") && item.code.length === 9;
  }

  isMedicine(item) {
    return item && item.code.startsWith("6") && item.code.length === 9;
  }

  isMaterial(item) {
    return item && item.code.startsWith("7") && item.code.length === 9;
  }

  isInstruction(item) {
    // 2A50160000000000
    return (
      item &&
      (item.code.startsWith("1") || item.code.startsWith("2")) &&
      item.code.length === 16
    );
  }

  sAdministration(item) {
    return item && item.code.startsWith("1") && item.code.length === 16;
  }

  isComment(item) {
    return item && item.code.startsWith("8") && item.code.length === 9;
  }

  isEditableComment(item) {
    return this.isComment(item) && !item.code.startsWith("82");
  }

  isBodyPart(item) {
    return item && item.code.startsWith("002");
  }

  isBaseProcedure(item) {
    return item && item[c68_告示等識別区分] === 基本項目;
  }

  isCompositionProcedure(item) {
    return item && item[c68_告示等識別区分] === 合成項目;
  }

  isApplicationProcedure(item) {
    return item && item[c68_告示等識別区分] === 準用項目;
  }

  is135Procedure(item) {
    return (
      this.isBaseProcedure(item) ||
      this.isCompositionProcedure(item) ||
      this.isApplicationProcedure(item)
    );
  }

  isAnnotaionProcedure(item) {
    return item && item[c68_告示等識別区分] === 注加算;
  }

  isGeneralProcedure(item) {
    return item && item[c68_告示等識別区分] === 通則加算;
  }

  hasSameAnnotaionCode(item1, item2) {
    if (item1[c38_注加算コード] === "0" || item2[c38_注加算コード] === "0") {
      return false;
    }
    return item1[c38_注加算コード] === item2[c38_注加算コード];
  }

  hasNotSameAnnotaionSerial(item1, item2) {
    return item1[c39_注加算通番] !== item2[c39_注加算通番];
  }

  isExclusiveAddition(item) {
    // 注と通則加算
    return (
      (item[c68_告示等識別区分] === 注加算 ||
        item[c68_告示等識別区分] === 通則加算) &&
      item[c38_注加算コード] === "0"
    );
  }

  procedureTypeName(item) {
    if (this.isBaseProcedure(item)) {
      return "基本項目";
    }
    if (this.isCompositionProcedure(item)) {
      return "合成項目";
    }
    if (this.isApplicationProcedure(item)) {
      return "準用項目";
    }
    if (this.isAnnotaionProcedure(item)) {
      return "注加算";
    }
    if (this.isGeneralProcedure(item)) {
      return "通則加算";
    }
    return "";
  }

  isOral(doseType) {
    return doseType === DOSE_TYPE_INTERNAL;
  }

  isInjectionMed(doseType) {
    return doseType === DOSE_TYPE_INJECTION;
  }

  isTopical(doseType) {
    return doseType === DOSE_TYPE_TOPICAL;
  }

  clinicFilter(procedureKbn, item, clinicOnly = true) {
    if (this.isProcedure(item)) {
      return clinicOnly
        ? item.tensuKbn === procedureKbn.kbn &&
        item.hospClinicFlg !== "1" &&
        item.inOutFlg !== "1"
        : item.tensuKbn === procedureKbn.kbn;
    }
    return item;
  }

  isClaimGroup(group) {
    return group >= "100" && group <= "999";
  }

  procedureKbnFromEntity(entity) {
    return entity !== "disease"
      ? ENTITY_PROCEDURE_KBN.find((x) => x.entity === entity)
      : null;
  }

  // 内用・外用・注射 薬の区分
  doseType(flag) {
    switch (flag) {
      case DOSE_TYPE_INTERNAL:
        return "内用";
      case DOSE_TYPE_OTHER:
        return "その他";
      case DOSE_TYPE_INJECTION:
        return "注射";
      case DOSE_TYPE_TOPICAL:
        return "外用";
      case DOSE_TYPE_DENTAL:
        return "歯科";
      case "9":
        return "";
      default:
        return "";
    }
  }

  // マスターコード -> ClaimItem の タイプ マッピング
  itemTypeFrom(item) {
    if (this.isProcedure(item)) {
      return CLAIM_PROCEDURE;
    }
    if (this.isMedicine(item)) {
      return CLAIM_MEDICINE;
    }
    if (this.isMaterial(item)) {
      return CLAIM_MATERIAL;
    }
    if (this.isInstruction(item)) {
      return CLAIM_INSTRUCTION;
    }
    if (this.isBodyPart(item)) {
      return CLAIM_BODY_PART;
    }
    if (this.isComment(item)) {
      return CLAIM_COMMENT;
    }
  }

  // Bundle のソート
  sortBundles(list) {
    // Sort set by group
    list.sort((a, b) => {
      if (a.group < b.group) return -1;
      if (a.group > b.group) return 1;
      return 0;
    });
  }

  // ClaimItem のソート
  sortClaimItems(list) {
    // Sort set by type, code
    list.sort((a, b) => {
      if (a.type < b.type) return -1;
      if (a.type > b.type) return 1;
      // if (a.code < b.code) return -1;
      // if (a.code > b.code) return 1;
      return 0;
    });
  }

  // スタンプのソート
  sortStamps(list) {
    list.sort((a, b) => {
      // if (a.group < b.group) return -1;       // asc group
      // if (a.group > b.group) return 1;        // asc group
      if (a.freq < b.freq) return 1; // freq dsc
      if (a.freq > b.freq) return -1; // freq dsc
      return 0;
    });
  }

  isBaseCharge(bundle) {
    return bundle && bundle.entity === "baseCharge";
  }

  isRp(bundle) {
    return bundle && bundle.entity === "rp";
  }

  isInjection(bundle) {
    return bundle && bundle.entity === "injection";
  }

  isImage(bundle) {
    return bundle && bundle.entity === "image";
  }

  displayBundleTitle(bundle) {
    // Return bundle's name
    if (!bundle) {
      return null;
    }
    return this.createisRp(bundle) ? this.displayRpType(bundle) : bundle.name;
  }

  displayRpType(bundle) {
    // Return prescription bundle title
    if (!this.isRp(bundle)) {
      return;
    }
    const arr = [bundle.name];
    if (bundle.issuedTo === "external") {
      arr.push("院外処方");
    }
    if (bundle.issuedTo === "internal") {
      arr.push("院内処方");
    }
    if (bundle.prn) {
      arr.push("頓用");
    }
    if (bundle.temporary) {
      arr.push("臨時");
    }
    return arr.length > 1 ? arr.join(" ") : arr.join("");
  }

  // ClaimItemsと用法に分け、それぞれの配列を返す
  bundleItemsFrom(bundle) {
    // Split a bundle into claimItems and instructions
    if (!bundle || !bundle.claimItems || bundle.claimItems.length === 0) {
      return [[], []];
    }
    const items = [];
    const instructions = [];
    bundle.claimItems.forEach((ci) => {
      // claimItem.type
      if (ci.type === CLAIM_INSTRUCTION) {
        instructions.push(ci);
      } else {
        items.push(ci);
      }
    });
    return [items, instructions];
  }

  // 同じコードのClaimItemがあるか?
  // testは対象のバンドル
  // p は karteの p[]
  findSameItem(test, p) {
    const found = [];
    const group = p.filter((x) => x.group === test.group);
    test.claimItems.forEach((item) => {
      group.forEach((bundle) => {
        // 手技、医薬品、器材 が対象
        const arr = bundle.claimItems.filter(
          (x) => x.type < 4 && x.code === item.code,
        );
        if (arr.length > 0) {
          arr.forEach((ci) => {
            found.push(ci.name);
          });
        }
      });
    });
    return found;
  }

  // (整数 | 少数) & !==0
  isNumber(value) {
    return regexp.test(value);
  }

  // (整数 | 少数) & !==0
  isQuantity(value) {
    return regexp.test(value) && Number(value) !== 0;
  }

  hasValidQuantity(bundle) {
    const itemOk = bundle.claimItems
      .filter((x) => x.unit)
      .every((item) => {
        const { quantity } = item;
        return this.isQuantity(quantity);
      });
    const { unit, quantity } = bundle;
    const bundleOk = unit ? this.isQuantity(quantity) : true;
    return itemOk && bundleOk;
  }

  createEmptyDiagnosis() {
    return {};
  }

  createBundle(params) {
    if (!params.length) {
      return null;
    }
    // Entity に対応する Bundle Template
    const [entity] = params;
    const template = ENTITY_BUNDLE[entity];
    const bundle = JSON.parse(JSON.stringify(template));
    bundle.id = v4();
    if (params.length === 1) {
      if (DEBUG) {
        console.log(JSON.stringify(bundle, null, 3));
      }
      return bundle;
    }
    // Item がある場合 claimItems.push()
    const claimItem = params[1];
    bundle.claimItems.push(claimItem);
    if (DEBUG) {
      console.log(JSON.stringify(bundle, null, 3));
    }
    return bundle;
  }

  // inputItem = inputToEdit = InputCatalogue
  createInputBundle(inputItem) {
    const { entity, category, group, name, mandatory } = inputItem;
    const bundle = {
      id: v4(), // ID
      entity, // Entity
      category, // Category
      group, // Group
      name, // 名称
      quantity: "1", // 数量
      unit: "", // 単位
      mandatory, // 必須項目
      // items,                      // 項目名列挙
      claimItems: [], // 項目
    };
    if (DEBUG) {
      console.log(JSON.stringify(bundle, null, 3));
    }
    return bundle;
  }

  // 病名 Item
  createDiagnosisItem(master) {
    const { code, name, icd_10_1_2013, icd_10_2_2013, singleUse } = master;
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_DIAGNOSIS));
    const myItem = {
      id: v4(),
      code: code,
      name: name,
      icd1012: icd_10_1_2013,
      icd1022: icd_10_2_2013,
      diagnosisCategory: null,
      dateOfOnset: dateFormat(new Date(), ISO_DATE_TIME),
      outcome: "",
      dateOfRemission: null,
      modifier: singleUse,
    };
    const ret = { ...base, ...myItem };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // Select Master item  -> Claim Item を生成する
  createClaimItem(master) {
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_CLAIM));
    const itemType = this.itemTypeFrom(master);
    const drop =
      itemType === CLAIM_INSTRUCTION || itemType === CLAIM_COMMENT ? 1 : 0;
    let masterAttr;
    if (itemType === CLAIM_PROCEDURE) {
      masterAttr = MASTER_ATTR_PROCEDURE;
    } else if (itemType === CLAIM_MEDICINE) {
      masterAttr = MASTER_ATTR_MEDICINE;
    } else if (itemType === CLAIM_MATERIAL) {
      masterAttr = MASTER_ATTR_MATERIAL;
    } else if (itemType === CLAIM_COMMENT) {
      masterAttr = MASTER_ATTR_COMMENT;
    } else if (itemType === CLAIM_INSTRUCTION) {
      masterAttr = MASTER_ATTR_INSTRUCTION;
    }
    const item = masterAttr.reduce((acc, key) => {
      acc[key] = master[key] || "";
      return acc;
    }, {});
    item["id"] = v4();
    item["category"] = item["tensuKbn"] || "";
    if (item["claimClass"]) {
      if (item["claimClass"].startsWith("11")) {
        item["group"] = "110";
      } else if (item["claimClass"].startsWith("12")) {
        item["group"] = "120";
      } else {
        item["group"] = item["claimClass"];
      }
    }
    item["type"] = itemType;
    item["name"] = halfFrom(item["name"]);
    item["quantity"] = base.quantity;
    if (item["unitCode"] && item["unitCode"] !== "0") {
      item["unit"] = halfFrom(item["unit"]);
    } else {
      item["unitCode"] = "";
    }
    item["drop"] = drop;
    item["doseType"] = item?.["doseType"] ?? "0";
    const ret = { ...base, ...item };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // カメラ Item
  createCameraItem(cameraData) {
    // cameraData = {filename, contentType, size, lastModified, thumbnail, body, makeModel}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_CAMERA));
    base.id = v4();
    const ret = { ...base, ...cameraData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // シェーマ Item
  createSchemaItem(schemaData) {
    // schemaData = {filename, contentType, size, lastModified, thumbnail, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_SCHEMA));
    base.id = v4();
    const ret = { ...base, ...schemaData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // 画像ファイル Item
  createImageItem(imageData) {
    // imageData = {filename, contentType, size, lastModified, thumbnail, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_IMAGE));
    base.id = v4();
    const ret = { ...base, ...imageData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // PDF Item
  createPDFItem(pdfData) {
    // pdfData = {filename, contentType, size, lastModified, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_PDF));
    base.id = v4();
    const ret = { ...base, ...pdfData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // Input Item から ClaimItem
  createInputItem(input) {
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_INPUT));
    base.id = v4();
    const ret = { ...base, ...input };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }
}

export default ClaimModel;
