import { v4 } from "uuid";
// Claim Item の種類 MML 由来
export const CLAIM_PROCEDURE = 1; // 診療行為
export const CLAIM_MEDICINE = 2; // 医薬品
export const CLAIM_MATERIAL = 3; // 器材
export const CLAIM_INSTRUCTION = 4; // 用法（固有）
export const CLAIM_COMMENT = 5; // コメント（固有）
export const CLAIM_BODY_PART = 6; // 部位（固有）

// 用法
export const DOSE_TYPE_INTERNAL = "1"; // 内用
export const DOSE_TYPE_TOPICAL = "6"; // 外用
export const DOSE_TYPE_INJECTION = "4"; // 注射
export const DOSE_TYPE_OTHER = "3"; // その他
export const DOSE_TYPE_DENTAL = "8"; // 歯科用
export const DOSE_TYPE_DIAGNOSIS = "30"; // 病名をカラー化するため

// 院内・院外処方
export const INTERNAL_MEDICINE = "1"; // 院外処方
export const EXTERNAL_MEDICINE = "2"; // 院内処方

// コンポジットデザイン用のグルーピングコード
// ソート順に KarteBoard へ表示される
export const GROUP_DIAGNOSIS = "000"; // 病名
export const GROUP_FIRST_VISIT = "110"; // 初診
export const GROUP_FOLLOW_UP_VISIT = "120"; // 再診
// 拡張
export const GROUP_VITAL_SIGN = "A100"; // バイタルサイン
export const GROUP_PHYSICAL_EXAM = "A200"; // 身体所見
export const GROUP_CAMERA = "B100"; // Camera
export const GROUP_SCHEMA = "B200"; // シェーマ
export const GROUP_REF_IMAGE = "Z100"; // 画像
export const GROUP_PDF = "Z110"; // PDFファイル
// 以下テスト
export const GROUP_BLOOD_SUGAR_LEVEL = "C100";
export const GROUP_DIABETES = "C110";
export const GROUP_BONE_DENSITY = "D100";
export const GROUP_SMI = "D110";
export const GROUP_LCS = "D120";
export const GROUP_QOL = "E100";

export const VISIT_TYPE_FIRST = "初診";
export const VISIT_TYPE_FOLLOW_UP = "再診";

export const MASTER_ATTR_PROCEDURE = [
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

export const MASTER_ATTR_MEDICINE = [
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

export const MASTER_ATTR_MATERIAL = [
  "col_01",
  "code",
  "name",
  "unitCode",
  "unit",
  "tensuType",
  "tensu",
  "discontinuedAt",
];

export const MASTER_ATTR_INSTRUCTION = ["code", "name"];

export const MASTER_ATTR_COMMENT = ["code", "name"];

export const EXCLUSIVE_ATTR_FOR_ADDITION = [
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

export const c16_包括対象検査 = "col_016";
export const c68_告示等識別区分 = "col_068";
const c38_注加算コード = "col_038";
const c39_注加算通番 = "col_039";
const 基本項目 = "1";
const 合成項目 = "3";
const 準用項目 = "5";
const 注加算 = "7";
const 通則加算 = "9";

export const isProcedure = (item) => {
  return item.code.startsWith("1") && item.code.length === 9;
};

export const isMedicine = (item) => {
  return item.code.startsWith("6") && item.code.length === 9;
};

export const isMaterial = (item) => {
  return item.code.startsWith("7") && item.code.length === 9;
};

export const isInstruction = (item) => {
  // 2A50160000000000
  return (
    (item.code.startsWith("1") || item.code.startsWith("2")) &&
    item.code.length === 16
  );
};

export const isAdministration = (item) => {
  return item.code.startsWith("1") && item.code.length === 16;
};

export const isComment = (item) => {
  return item.code.startsWith("8") && item.code.length === 9;
};

export const isEditableComment = (item) => {
  return isComment(item) && !item.code.startsWith("82");
};

export const isBodyPart = (item) => {
  return item.code.startsWith("002");
};

export const isBaseProcedure = (item) => {
  return item[c68_告示等識別区分] === 基本項目;
};

export const isCompositionProcedure = (item) => {
  return item[c68_告示等識別区分] === 合成項目;
};

export const isApplicationProcedure = (item) => {
  return item[c68_告示等識別区分] === 準用項目;
};

export const is135Procedure = (item) => {
  return (
    isBaseProcedure(item) ||
    isCompositionProcedure(item) ||
    isApplicationProcedure(item)
  );
};

export const isAnnotaionProcedure = (item) => {
  return item[c68_告示等識別区分] === 注加算;
};

export const isGeneralProcedure = (item) => {
  return item[c68_告示等識別区分] === 通則加算;
};

export const hasSameAnnotaionCode = (item1, item2) => {
  if (item1[c38_注加算コード] === "0" || item2[c38_注加算コード] === "0") {
    return false;
  }
  return item1[c38_注加算コード] === item2[c38_注加算コード];
};

export const hasNotSameAnnotaionSerial = (item1, item2) => {
  return item1[c39_注加算通番] !== item2[c39_注加算通番];
};

export const isExclusiveAddition = (item) => {
  // 注と通則加算
  return (
    (item[c68_告示等識別区分] === 注加算 ||
      item[c68_告示等識別区分] === 通則加算) &&
    item[c38_注加算コード] === "0"
  );
};

export const procedureTypeName = (item) => {
  if (isBaseProcedure(item)) {
    return "基本項目";
  }
  if (isCompositionProcedure(item)) {
    return "合成項目";
  }
  if (isApplicationProcedure(item)) {
    return "準用項目";
  }
  if (isAnnotaionProcedure(item)) {
    return "注加算";
  }
  if (isGeneralProcedure(item)) {
    return "通則加算";
  }
  return "";
};

export const isOral = (doseType) => doseType === DOSE_TYPE_INTERNAL;
export const isInjectionMed = (doseType) => doseType === DOSE_TYPE_INJECTION;
export const isTopical = (doseType) => doseType === DOSE_TYPE_TOPICAL;

export const clinicFilter = (procedureKbn, item, clinicOnly = true) => {
  if (isProcedure(item)) {
    return clinicOnly
      ? item.tensuKbn === procedureKbn.kbn &&
          item.hospClinicFlg !== "1" &&
          item.inOutFlg !== "1"
      : item.tensuKbn === procedureKbn.kbn;
  }
  return item;
};

export const isClaimGroup = (group) => {
  return group >= "100" && group <= "999";
};

// Claim の group = 組み合わされた最初の診療行為Itemの診療種区分
export const ENTITY_BUNDLE = {
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

export const CLAIM_ITEM_DIAGNOSIS = {
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

export const CLAIM_ITEM_CLAIM = {
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

export const CLAIM_ITEM_CAMERA = {
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

export const CLAIM_ITEM_SCHEMA = {
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

export const CLAIM_ITEM_IMAGE = {
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

export const CLAIM_ITEM_PDF = {
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

export const CLAIM_ITEM_INPUT = {
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

export const STAMP_ITEM_CLAIM = {
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

export const RECEIPT_CODE_NAME = {
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

export const RECEIPT_AGGREGATE = {
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

// Entity、名称、省略名、点数区分
// usingProcedureを介して StmpBox に渡される
// StampBox のタブ名 = 省略名
// StampTree は entity で保存
/*
disease,0,傷病名,病名
baseCharge,1,初診・再診料,診断,A
management,2,医学管理等,管理,B
home,3,在宅医療,在宅,C
rp,4,処方,処方,F
injection,5,注射,注射,G
treatment,6,処置,処置,J
surgery,7,手術,手術,K
labTest,8,検体検査,検体,D
physiology,9,生体検査,生体,D
image,10,画像診断,画像,E
rehabilitation,11,リハビリテーション,リハ,H
psychiatric,12,精神科専門療法,精神,I
radiotherapy,13,放射線治療,放射,M
anesthesia,14,麻酔料,麻酔,L
pathology,15,病理診断,病理,N
input,100,臨床データ,入力
*/
// マスター検索のDropdown menuに設定する診療行為
// 検索する診療行為区分、区分番号
// menuTitle -> Click Dropdown の初期化時に表示する名前
export const ENTITY_PROCEDURE_KBN = [
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
        sinku: "11",
        id: v4(),
      },
      {
        name: "再診料",
        kbn: "A",
        kbn_no: ["001", "001"],
        sinku: "12",
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
        sinku: "13",
        id: v4(),
      },
      {
        name: "地域・施設連携関連",
        kbn: "B",
        kbn_no: ["002", "007"],
        sinku: "13",
        id: v4(),
      },
      {
        name: "情報提供・安全管理関連",
        kbn: "B",
        kbn_no: ["008", "014"],
        sinku: "13",
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
        sinku: "14",
        id: v4(),
      },
      {
        name: "在宅療養指導管理料",
        kbn: "C",
        kbn_no: ["100", "114"],
        sinku: "14",
        id: v4(),
      },
      {
        name: "在宅療養指導材料料",
        kbn: "C",
        kbn_no: ["150", "170"],
        sinku: "14",
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
      { name: "院外", kbn: "F", kbn_no: ["400", "400"], sinku: "8", id: v4() },
      { name: "院内", kbn: "F", kbn_no: ["100", "100"], sinku: "2", id: v4() },
      { name: "調剤", kbn: "F", kbn_no: ["000", "000"], sinku: "2", id: v4() },
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
        sinku: "3",
        id: v4(),
      },
      {
        name: "無菌製材処理料",
        kbn: "G",
        kbn_no: ["020", "020"],
        sinku: "3",
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
        sinku: "4",
        id: v4(),
      },
      {
        name: "救急処置",
        kbn: "J",
        kbn_no: ["044", "052"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "皮膚科処置",
        kbn: "J",
        kbn_no: ["053", "057"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "泌尿器科処置",
        kbn: "J",
        kbn_no: ["058", "070"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "産婦人科処置",
        kbn: "J",
        kbn_no: ["071", "085"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "眼科処置",
        kbn: "J",
        kbn_no: ["086", "093"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "耳鼻咽頭科処置",
        kbn: "J",
        kbn_no: ["095", "115"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "整形外科処置",
        kbn: "J",
        kbn_no: ["116", "119"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "栄養処置",
        kbn: "J",
        kbn_no: ["120", "121"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "ギプス",
        kbn: "J",
        kbn_no: ["122", "129"],
        sinku: "4",
        id: v4(),
      },
      {
        name: "処置医療機器等加算",
        kbn: "J",
        kbn_no: ["200", "201"],
        sinku: "4",
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
        sinku: "5",
        id: v4(),
      },
      {
        name: "筋骨格系・四肢・体幹",
        kbn: "K",
        kbn_no: ["023", "144"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "神経系・頭蓋",
        kbn: "K",
        kbn_no: ["145", "198"],
        sinku: "5",
        id: v4(),
      },
      { name: "眼", kbn: "K", kbn_no: ["199", "284"], sinku: "5", id: v4() },
      {
        name: "耳鼻咽喉",
        kbn: "K",
        kbn_no: ["285", "403"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "顔面・口腔・頸部",
        kbn: "K",
        kbn_no: ["404", "471"],
        sinku: "5",
        id: v4(),
      },
      { name: "胸部", kbn: "K", kbn_no: ["472", "537"], sinku: "5", id: v4() },
      {
        name: "心・脈管",
        kbn: "K",
        kbn_no: ["538", "628"],
        sinku: "5",
        id: v4(),
      },
      { name: "腹部", kbn: "K", kbn_no: ["630", "753"], sinku: "5", id: v4() },
      {
        name: "尿路系・副腎",
        kbn: "K",
        kbn_no: ["754", "823"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "男子性器",
        kbn: "K",
        kbn_no: ["824", "843"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "女子性器",
        kbn: "K",
        kbn_no: ["844", "913"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "脳死臓器提供管理料",
        kbn: "K",
        kbn_no: ["914", "915"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "輸血料",
        kbn: "K",
        kbn_no: ["920", "924"],
        sinku: "5",
        id: v4(),
      },
      {
        name: "手術医療機器等加算",
        kbn: "K",
        kbn_no: ["930", "939"],
        sinku: "5",
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
        sinku: "6",
        id: v4(),
      },
      {
        name: "血液学的検査",
        kbn: "D",
        kbn_no: ["005", "006"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "生化学的検査(I)",
        kbn: "D",
        kbn_no: ["007", "007"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "生化学的検査(II)",
        kbn: "D",
        kbn_no: ["008", "010"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "免疫学的検査",
        kbn: "D",
        kbn_no: ["011", "016"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "微生物学的検査",
        kbn: "D",
        kbn_no: ["017", "024"],
        sinku: "6",
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
        sinku: "6",
        id: v4(),
      },
      {
        name: "超音波検査等",
        kbn: "D",
        kbn_no: ["215", "217"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "監視装置による諸検査",
        kbn: "D",
        kbn_no: ["218", "234"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "脳波検査等",
        kbn: "D",
        kbn_no: ["235", "238"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "神経・筋検査",
        kbn: "D",
        kbn_no: ["239", "242"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "耳鼻咽頭科学的検査",
        kbn: "D",
        kbn_no: ["244", "254"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "眼科学的検査",
        kbn: "D",
        kbn_no: ["255", "282"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "皮膚科学的検査",
        kbn: "D",
        kbn_no: ["282", "282"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "臨床心理・神経心理検査",
        kbn: "D",
        kbn_no: ["283", "285"],
        sinku: "6",
        id: v4(),
      },
      { name: "負荷試験等", kbn: "D", kbn_no: ["286", "291"], sinku: "6" },
      {
        name: "ラジオアイソトープ",
        kbn: "D",
        kbn_no: ["292", "294"],
        sinku: "6",
        id: v4(),
      },
      {
        name: "内視鏡検査",
        kbn: "D",
        kbn_no: ["295", "325"],
        sinku: "6",
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
        sinku: "7",
        id: v4(),
      },
      {
        name: "撮影料",
        kbn: "E",
        kbn_no: ["002", "002"],
        sinku: "7",
        id: v4(),
      },
      {
        name: "造影剤注入手技",
        kbn: "E",
        kbn_no: ["003", "003"],
        sinku: "7",
        id: v4(),
      },
      {
        name: "核医学診断料",
        kbn: "E",
        kbn_no: ["100", "102"],
        sinku: "7",
        id: v4(),
      },
      {
        name: "コンピュータ断層撮影診断料",
        kbn: "E",
        kbn_no: ["200", "203"],
        sinku: "7",
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
        sinku: "8",
        id: v4(),
      },
      {
        name: "総合計画評価",
        kbn: "H",
        kbn_no: ["003", "003"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "訓練別リハビリ",
        kbn: "H",
        kbn_no: ["004", "008"],
        sinku: "8",
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
        sinku: "8",
        id: v4(),
      },
      {
        name: "デイ・ケア、ナイト・ケア関連",
        kbn: "I",
        kbn_no: ["009", "010"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "指導・管理関連",
        kbn: "I",
        kbn_no: ["011", "013"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "診療科関連",
        kbn: "I",
        kbn_no: ["014", "014"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "重度認知症関連",
        kbn: "I",
        kbn_no: ["015", "015"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "精神科在宅関連",
        kbn: "I",
        kbn_no: ["016", "016"],
        sinku: "8",
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
        sinku: "8",
        id: v4(),
      },
      {
        name: "体外照射",
        kbn: "M",
        kbn_no: ["001", "001"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "全身照射",
        kbn: "M",
        kbn_no: ["002", "002"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "電磁波温熱療法",
        kbn: "M",
        kbn_no: ["003", "003"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "密封小線源治療",
        kbn: "M",
        kbn_no: ["004", "004"],
        sinku: "8",
        id: v4(),
      },
      {
        name: "血液照射",
        kbn: "M",
        kbn_no: ["005", "005"],
        sinku: "8",
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
        sinku: "54",
        id: v4(),
      },
      {
        name: "管理料",
        kbn: "L",
        kbn_no: ["009", "010"],
        sinku: "54",
        id: v4(),
      },
      {
        name: "神経ブロック料",
        kbn: "L",
        kbn_no: ["100", "105"],
        sinku: "54",
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
        sinku: "64",
        id: v4(),
      },
      {
        name: "診断・判断料",
        kbn: "N",
        kbn_no: ["006", "007"],
        sinku: "64",
        id: v4(),
      },
    ],
  },
];

export const COMMENT_KBN = {
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
export const ADMIN_IN_MEDICINE_MENU = {
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

export const ADMIN_EXT_MEDICINE_MENU = {
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

// 症状詳記
// const SYMPTOMS_DETAIL = [
//     {code: '01', label: '主たる疾患の臨床症状'},
//     {code: '02', label: '主たる疾患の診療・検査所見'},
//     {code: '03', label: '主な治療行為の必要性'},
//     {code: '04', label: '主な治療行為の経過'},
//     {code: '50', label: '治験概要'},
//     {code: '90', label: '上記以外'},
//     {code: '99', label: 'レセプト摘要欄コメント'},
//     {code: 'AA', label: '労災レセプト「傷病の経過」'},
//     {code: 'BB', label: '自賠責（第三者行為）レセプト摘要欄コメント'}
// ];

// entity に対応する PROCEDURE_KBN
// StampEditor に必要な情報
export const procedureKbnFromEntity = (entity) => {
  return entity !== "disease"
    ? ENTITY_PROCEDURE_KBN.find((x) => x.entity === entity)
    : null;
};

// 内用・外用・注射 薬の区分
export const doseType = (flag) => {
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
};

// マスターコード -> ClaimItem の タイプ マッピング
export const itemTypeFrom = (item) => {
  if (isProcedure(item)) {
    return CLAIM_PROCEDURE;
  }
  if (isMedicine(item)) {
    return CLAIM_MEDICINE;
  }
  if (isMaterial(item)) {
    return CLAIM_MATERIAL;
  }
  if (isInstruction(item)) {
    return CLAIM_INSTRUCTION;
  }
  if (isBodyPart(item)) {
    return CLAIM_BODY_PART;
  }
  if (isComment(item)) {
    return CLAIM_COMMENT;
  }
};

// Bundle のソート
export const sortBundles = (list) => {
  // Sort set by group
  list.sort((a, b) => {
    if (a.group < b.group) return -1;
    if (a.group > b.group) return 1;
    return 0;
  });
};

// ClaimItem のソート
export const sortClaimItems = (list) => {
  // Sort set by type, code
  list.sort((a, b) => {
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;
    // if (a.code < b.code) return -1;
    // if (a.code > b.code) return 1;
    return 0;
  });
};

// スタンプのソート
export const sortStamps = (list) => {
  list.sort((a, b) => {
    // if (a.group < b.group) return -1;       // asc group
    // if (a.group > b.group) return 1;        // asc group
    if (a.freq < b.freq) return 1; // freq dsc
    if (a.freq > b.freq) return -1; // freq dsc
    return 0;
  });
};

export const isBaseCharge = (bundle) => {
  return bundle && bundle.entity === "baseCharge";
};

export const isRp = (bundle) => {
  return bundle && bundle.entity === "rp";
};

export const isInjection = (bundle) => {
  return bundle && bundle.entity === "injection";
};

export const isImage = (bundle) => {
  return bundle && bundle.entity === "image";
};

export const displayBundleTitle = (bundle) => {
  // Return bundle's name
  if (!bundle) {
    return null;
  }
  return isRp(bundle) ? displayRpType(bundle) : bundle.name;
};

export const displayRpType = (bundle) => {
  // Return prescription bundle title
  if (!isRp(bundle)) {
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
};

// ClaimItemsと用法に分け、それぞれの配列を返す
export const bundleItemsFrom = (bundle) => {
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
};

// 同じコードのClaimItemがあるか?
// testは対象のバンドル
// p は karteの p[]
export const findSameItem = (test, p) => {
  const found = [];
  const group = p.filter((x) => x.group === test.group);
  test.claimItems.forEach((item) => {
    group.forEach((bundle) => {
      // 手技、医薬品、器材 が対象
      const arr = bundle.claimItems.filter(
        (x) => x.type < 4 && x.code === item.code,
      );
      // const arr = bundle.claimItems.filter(
      //   (x) => !x.drop && x.code === item.code,
      // ); // 0:false  用法、コメント=1
      if (arr.length > 0) {
        arr.forEach((ci) => {
          found.push(ci.name);
        });
      }
    });
  });
  return found;
};

const regexp = new RegExp(/^[-+]?[0-9]+(\.[0-9]+)?$/);

// (整数 | 少数) & !==0
export const isNumber = (value) => {
  return regexp.test(value);
};

// (整数 | 少数) & !==0
export const isQuantity = (value) => {
  return regexp.test(value) && Number(value) !== 0;
};

export const hasValidQuantity = (bundle) => {
  const itemOk = bundle.claimItems
    .filter((x) => x.unit)
    .every((item) => {
      const { quantity } = item;
      return isQuantity(quantity);
    });
  const { unit, quantity } = bundle;
  const bundleOk = unit ? isQuantity(quantity) : true;
  return itemOk && bundleOk;
};
