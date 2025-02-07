import dateFormat from "dateformat";
import { v4 } from "uuid";
import { zipCodeFrom, telephoneFrom } from "../util/strings";

export const STATUS_FINAL = "F";
export const STATUS_OUT_DATED = "O";
export const STATUS_DELETED = "D";
export const STATUS_TEMPORARY = "T";
export const STATUS_NEW = "N";
export const STATUS_UPDATE = "U";
export const PVT_WAITING = "W";

export const ISO_DATE_TIME = "isoDateTime"; // yyyy-mm-dd'T'HH:MM:ss+0900

export const EMPTY_NEW = "emptyNew"; // Karte Creation mode
export const APPLY_RP = "applyRp";
export const WHOLE_COPY = "wholeCopy";

export const SHOW_CATEGORY_NUMBER = true;
export const SHOW_GROUP = false;
export const CLINIC_OUT_ONLY = true;
export const STAMP_NAME_LENGTH = 48;

export const indexOf = (test, list, attr) => {
  return list && list.length > 0
    ? list.findIndex((x) => x[attr] === test[attr])
    : -1;
};

export const sortKarte = (list, asc = false) => {
  list.sort((a, b) => {
    let x = a.createdAt;
    let y = b.createdAt;
    if (x < y) return -1;
    if (x > y) return 1;
    x = a.updatedAt;
    y = b.updatedAt;
    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
  });
  if (!asc) {
    list.reverse();
  }
};

export const currFacility = (user) => {
  if (!user?.currFc || !user["facilities"]?.length) {
    return null;
  }
  const arr = user["facilities"].filter((x) => x.id === user.currFc);
  return arr.length > 0 ? arr[0] : null;
};

export const incrementRevisionNumber = (curr) => {
  const dot = curr.indexOf(".");
  const idPart = curr.substring(0, dot);
  const revPart = curr.substring(dot + 1);
  const newNum = Number(revPart) + 1;
  const revStr = newNum < 10 ? `0${newNum}` : `${newNum}`; // til 99
  return `${idPart}.${revStr}`;
};

// Risk
export const newRiskContext = (facility, physician, patient) => {
  const confirmed = dateFormat(new Date(), ISO_DATE_TIME);
  const facilityId = facility.id;
  const patientId = patient.id;
  const physicianId = physician.id;
  return {
    id: v4(),
    createdAt: confirmed,
    updatedAt: confirmed,
    status: STATUS_FINAL,
    facilityId: facilityId,
    physicianId: physicianId,
    patientId: patientId,
  };
};

// Diagnosis
// 診療科情報はエディタで設定する
export const newDiagnosisContext = (facility, physician, patient) => {
  const confirmed = dateFormat(new Date(), ISO_DATE_TIME);
  const facilityId = facility.id;
  const physicianId = physician.id;
  const patientId = patient.id;
  return {
    id: v4(),
    createdAt: confirmed,
    updatedAt: confirmed,
    status: STATUS_FINAL,
    facilityId: facilityId,
    patientId: patientId,
    physicianId: physicianId,
  };
};

// Karteにbundleするための病名バンドルを生成する
export const newDiagnosisBundle = (diag) => {
  const itemAttr = {
    id: v4(),
    type: 0,
    group: "000",
    category: "000",
    quantity: "1",
    description: "",
    doseType: 30, // 適当 -> green
  };
  const item = { ...diag, ...itemAttr };
  return {
    id: v4(),
    group: "000",
    category: "000",
    entity: "diagnosis",
    name: "傷病名",
    quantity: "1",
    claimItems: [item],
  };
};

// 新規カルテの context 情報を生成する
// patient: 患者
// facility: ログインユーザーのカレントに指定されている医療機関情報
// physician: ログインユーザー
// selectedDept: 選択された診療科
// selectedHis: 選択された保険
export const newKarteContext = (
  patient,
  facility,
  physician,
  selectedDept,
  selectedHis,
  clerk,
) => {
  const confirmed = dateFormat(new Date(), ISO_DATE_TIME);
  const uid = v4();
  return {
    // 基本のコンテキスト情報
    id: uid,
    revision: `${uid}.01`, // revision = uuid.01
    outdateId: "",
    createdAt: confirmed,
    updatedAt: confirmed,
    status: STATUS_NEW,
    // 外部キー
    facilityId: facility.id, // 医療機関ID
    patientId: patient.id, // 患者ID
    physicianId: physician.id, // 担当医
    hisId: selectedHis.id, // his 保険ID
    // providerNumber: selectedHis.providerNumber,  // 保険者番号
    providerNumber: selectedHis.insurerNumber, // OQS 保険者番号
    pvtId: patient?.visit?.id ?? "", // 受付情報の uuid PK
    deptId: selectedDept.deptId,
    deptName: selectedDept.deptName, // オマケ
    clerkId: clerk ? clerk.id : "",
    // マーガレット
    protocol: "",
    // Memo
    memo: "",
    // P & R
    p: [],
    r: [],
  };
};

// Karteのcontext情報をコピーする
export const copyKarteContext = (karte) => {
  const attributes = [
    "id",
    "revision",
    "createdAt",
    "updatedAt",
    "title",
    "status",
    "facilityId",
    "patientId",
    "physicianId",
    "phyFullName",
    "ptId",
    "orcaId",
    "deptId",
    "deptName",
    "hisCombinationNumber",
    "hisProviderName",
    "visitType",
    "pvtUid",
    "pvtDate",
    "pvtTime",
    "memo",
  ];
  return attributes.reduce((acc, item) => {
    acc[item] = karte[item] ? karte[item] : "";
    return acc;
  }, {});
};

// ToDo dept
// 文書のContext情報を生成する
export const newDocumentContext = (facility, physician, patient) => {
  const uid = v4();
  const confirmed = dateFormat(new Date(), ISO_DATE_TIME); // Temporary
  // 担当医、病院情報
  const { phyId } = physician;
  const { name, zipCode, address, telephone, facsimile } = facility;
  // 患者情報 ORCA からとっているので
  const { ptId, fullName, kana, gender, dob, contacts } = patient;
  const ptZipCode =
    contacts?.length > 0 ? zipCodeFrom(contacts[0].zipCode) : "";
  const ptAddress = contacts?.length > 0 ? contacts[0].address : "";
  const ptTelephone =
    contacts?.length > 0 ? telephoneFrom(contacts[0].telephone) : "";
  const facilityId = facility.id;
  const patientId = patient.id;
  const physicianId = physician.id;
  return {
    // Entry 情報
    id: uid,
    createdAt: confirmed,
    updatedAt: confirmed,
    status: STATUS_NEW,
    // 担当医
    facilityId: facilityId,
    physicianId: physicianId,
    phyId: phyId,
    phyFullName: physician.fullName,
    deptId: "120", // ToDo
    deptName: "整形外科", // ToDo
    // 患者
    patientId: patientId,
    ptId: ptId,
    ptFullName: fullName,
    ptKana: kana,
    ptGender: gender === "F" ? "女" : gender === "M" ? "男" : "不明",
    ptDob: dob,
    ptZipCode: ptZipCode,
    ptAddress: ptAddress,
    ptTelephone: ptTelephone,
    // 病院情報
    facility: name,
    zipCode: zipCode,
    address: address,
    telephone: telephone,
    fax: facsimile,
    memo: "",
  };
};

export const ENTITY_MENU = [
  { action: "edit", name: "編集" },
  { name: "-" },
  { action: "delete", name: "削除", destructive: true },
];

export const STAMP_TREE_MENU = [
  { action: "changeName", name: "名称変更" },
  { name: "-" },
  { action: "delete", name: "削除", destructive: true },
];

export const DISEASE_STAMP_TREE_MENU = [
  { action: "changeName", name: "名称変更" },
  { name: "-" },
  { action: "delete", name: "削除", destructive: true },
];

export const SYSTEM_MENUS = [
  { action: "editFacility", name: "医療機関情報編集" },
  { name: "-" },
  { action: "editProfile", name: "プロフィール編集" },
];

export const MEDICAL_LICENSES = [
  { value: "doctor", name: "医師" },
  { value: "nurse", name: "看護師" },
  { value: "assistantNurse", name: "准看護師" },
  { value: "lab", name: "臨床検査技師" },
  { value: "rad", name: "レントゲン技師" },
  { value: "pharmacist", name: "薬剤師" },
  { value: "pt", name: "理学療法士" },
  { value: "ot", name: "作業療法士" },
  { value: "psy", name: "精神保険福祉士" },
  { value: "cps", name: "臨床心理技術者" },
  { value: "nutritionist", name: "栄養士" },
  { value: "clinicalEngineer", name: "臨床工学技士" },
  { value: "other", name: "その他の医療従事者" },
];

export const MEDICAL_LICENSE_DICT = {
  doctor: "医師",
  nurse: "看護師",
  assistantNurse: "准看護師",
  lab: "臨床検査技師",
  rad: "レントゲン技師",
  pharmacist: "薬剤師",
  pt: "理学療法士",
  ot: "作業療法士",
  psy: "精神保険福祉士",
  cps: "臨床心理技術者",
  nutritionist: "栄養士",
  clinicalEngineer: "臨床工学技士",
  other: "その他の医療従事者",
};

// 病名をソートする
export const sortDiagnosis = (list) => {
  list.sort((a, b) => {
    if (a.code < b.code) return -1; // asc group
    if (a.code > b.code) return 1; // asc group
    return 0;
  });
};

// 病名スタンプをソートする
export const sortDiseaseStamps = (list) => {
  list.sort((a, b) => {
    if (a.icd1012 < b.icd1012) return -1; // asc group
    if (a.icd1012 > b.icd1012) return 1; // asc group
    if (a.freq < b.freq) return 1; // freq dsc
    if (a.freq > b.freq) return -1; // freq dsc
    return 0;
  });
};

// // 患者の健康保険をリストを生成する
export const listHealthInsurances = (patient) => {
  const arr = [];
  patient["healthInsurances"]?.forEach((h) => {
    const display = [];
    display.push(h.providerName); // 主保険名称: 公費名称: 表示で使用
    h["publicInsurances"]?.forEach((p) => {
      display.push(": ");
      display.push(p["publicName"]);
    });
    arr.push({
      code: h["combinationNumber"],
      name: display.join(""),
    });
  });
  return arr;
};

// 医療機関の診療科リストを作成する
export const listDepartments = (facility) => {
  if (!facility?.departments) {
    return [];
  }
  const depts = facility.departments.map((d) => {
    return {
      key: v4(),
      deptId: d.code, // code -> id
      deptName: d.name,
    };
  });
  return depts;
};
