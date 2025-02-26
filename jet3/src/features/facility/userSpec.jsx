export const SUBMENU_SPEC_FACILITY = {
  entity: "facilityMenus",
  entries: [
    { path: 0, label: "基本情報" },
    { path: 1, label: "標榜事項" },
    { path: 2, label: "診療行為選択" },
    { path: 3, label: "入力データ選択" },
    { path: 4, label: "施設基準" },
    { path: 5, label: "職員管理" },
  ],
};

export const ENTITY_SPEC_FACILITY = {
  title: "施設情報",
  entity: "facility",
  attributes: [
    { key: "name", label: "正式名称" },
    { key: "shortName", label: "略称" },
    { key: "founder", label: "開設者" },
    { key: "administrator", label: "管理者" },
    { key: "zip1", label: "郵便番号" },
    { key: "zip2", label: "郵便番号" },
    { key: "prefecture", label: "都道府県" },
    { key: "address", label: "住所" },
    { key: "tel1", label: "電話" },
    { key: "tel2", label: "電話" },
    { key: "tel3", label: "電話" },
    { key: "fax1", isOption: true, label: "FAX" },
    { key: "fax2", isOption: true, label: "FAX" },
    { key: "fax3", isOption: true, label: "FAX" },
    { key: "url", isOption: true, label: "URL" },
    {
      key: "insuranceFacilityCode",
      label: "保険医療機関コード",
      isOption: true,
    }, // compose from inst1 = 10
    { key: "inst1" },
    { key: "inst2" },
    { key: "inst3" },
    { key: "inst4" },
    { key: "inst5" },
    { key: "inst6" },
    { key: "inst7" },
    { key: "inst8" },
    { key: "inst9" },
    { key: "inst10" },
  ],
};

export const ENTITY_SPEC_USER = {
  title: "ユーザー情報",
  entity: "user",
  attributes: [
    { key: "username", label: "電子メール" },
    { key: "sirName", label: "姓（漢字）" },
    { key: "givenName", label: "名（漢字）" },
    { key: "sirNameKana", label: "姓（カナ）" },
    { key: "givenNameKana", label: "名（カナ）" },
    { key: "license", label: "医療資格" },
    { key: "narcoticLicenseNum", isOption: true, label: "麻薬施用者番号" },
  ],
};

export const OPTIONS_USER_STATUS = [
  { label: "在職中", value: "active" },
  { label: "休職中", value: "absence" },
  { label: "退職者", value: "leaved" },
];

export const LIST_SPEC_USER = {
  columnGetters: [
    { key: "username", label: "電子メール" },
    { key: "fullName", label: "氏名" },
    { key: "kana", label: "カナ" },
    {
      key: "license",
      label: "医療資格",
      func: "licenseName",
      arg: ["license"],
    },
    { key: "updatedAt", label: "更新日", func: "dateAt", arg: ["updatedAt"] },
  ],
};

export const LIST_SPEC_STANDARDS_LIST = {
  columnGetters: [
    { key: "name", label: "名称" },
    { key: "shortName", label: "略称" },
    { key: "notification", label: "届出" },
    { key: "memo", label: "要件等" },
    { key: "updatedAt", label: "更新日", func: "dateAt", arg: ["updatedAt"] },
  ],
};

export const LIST_SPEC_SHORT_NAME = {
  columnGetters: [
    { key: "seq", label: "　項番" },
    { key: "shortName", label: "略称" },
    { key: "applyTo", label: "適用欄" },
    { key: "autoFlg", label: "自動算定", func: "autoSantei", arg: ["autoFlg"] },
  ],
};

export const LIST_SPEC_NOTIFICATION = {
  columnGetters: [
    // { key: 'code', label: 'コード' },
    { key: "kbn", label: "適用欄" },
    { key: "name", label: "名称" },
    { key: "method", label: "体制・届出" },
    // { key: 'z3var', label: 'Z3' },
  ],
};
