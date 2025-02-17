export const PATIENT_MENU_SPEC = {
  entity: 'patientMenus',
  entries: [
    { path: 0, label: '来院リスト' },
    { path: 1, label: '患者検索' },
    { path: 2, label: '患者登録' }
  ]
};

export const PVT_STATUS_SPEC = {
  entity: 'pvtStatus',
  attributes: [
    { key: 'numVisits', label: '来院数' },
    { key: 'waiting', label: '診察待' },
    { key: 'payment', label: '会計待' },
    { key: 'done', label: '診察終了' },
    { key: 'pending', label: '資格問題あり' }
  ]
};

export const INSURE_CARD_SPEC = {
  entity: 'insureCard',
  attributes1: [
    {
      label: '資格', key: 'qualificationValidity', func: 'qualificationValidity', arg: ['qualificationValidity'], alertNotEqual: ['有効']
    },
    { label: '保険者', key: 'insurerName', func: 'insurerWithNameNumber', arg: ['insurerName', 'insurerNumber'] },
    { label: '番号', key: 'insuredIdentificationNumber' },
    { label: '記号', key: 'insuredCardSymbol' },
    { label: '枝番', key: 'insuredBranchNumber' },
    { label: '本人・家族の別', key: 'personalFamilyClassification', func: 'personFamilyClass', arg: ['personalFamilyClassification'] },  // 1: 本人  2: 家族`
    { label: '--' },
    { label: '資格取得年月日', key: 'qualificationDate', func: 'dateFromOqs', arg: ['qualificationDate'] },
    { label: '資格喪失年月日', key: 'disqualificationDate', func: 'dateFromOqs', arg: ['disqualificationDate'] },
    { label: '交付年月日', key: 'insuredCertificateIssuanceDate', func: 'dateFromOqs', arg: ['insuredCertificateIssuanceDate'] },
    { label: '有効開始年月日', key: 'insuredCardValidDate', func: 'dateFromOqs', arg: ['insuredCardValidDate'] },
    { label: '有効終了年月日', key: 'insuredCardExpirationDate', func: 'dateFromOqs', arg: ['insuredCardExpirationDate'] },
    { label: '一部負担金割合', key: 'insuredPartialContributionRatio' },  // 1割負担=010
    { label: '未就学区分', key: 'preschoolClassification' },  // 1: 未就学  2: 就学中
    { label: '資格喪失事由', key: 'reasonOfLoss', func: 'reasonOfLoss', arg: ['reasonOfLoss'], alertNot: [''] }, // prefix=0 -> 01: 死亡  02: 生活保護受給開始  03: 医療保険等の資格取得  99: その他
  ],
  attributes2: [
    { label: '世帯主氏名', key: 'insuredName' },
    { label: '氏名', key: 'name' },
    { label: '氏名（その他）', key: 'nameOfOther' },
    { label: '氏名カナ', key: 'nameKana' },
    { label: '氏名カナ（その他）', key: 'nameOfOtherKana' },
    { label: '性別1', key: 'sex1', func: 'genderFromOqs', arg: ['sex1'] },  // 1: 男  2: 女  3: 未設定
    { label: '性別2', key: 'sex2', func: 'genderFromOqs', arg: ['sex2'] },  // 平成24年9月21日事務連絡 被保険者証の性別表記について」または「生活保護法による医療券等の記載要領について」（平成11年8月27日社援保第41号）に基づく取り扱いを実施している場合に設定する。
    { label: '生年月日', key: 'birthdate', func: 'dobWithAge', arg: ['birthdate'] },
    { label: '郵便番号', key: 'postNumber' },
    { label: '保険者登録住所', key: 'address' },  // 保険者に届け出ている住所 カルテの住所と一致しない場合がある
  ]
};

export const ROW_MENU_PVT = [
  { action: 'insure', name: '保険証確認' },
  { action: 'karte', name: 'カルテ' },
  { action: 'accounting', name: '会計' },
  { name: '--' },
  { action: 'unlock', name: 'ロック解除', destructive: true },
  { name: '--' },
  { action: 'delete', name: '削除', destructive: true }
];

export const PATIENT_SEARCH_SPEC = {
  entity: 'patient',
  attributes: [
    { key: 'ptId' },
    { key: 'fullName' },
    { key: 'kana' },
    { key: 'gender', func: 'genderFromOqs', arg: ['gender'] },
    { key: 'dob' },
    { key: 'age', func: 'ageAt', arg: ['dob'] },
    { key: 'mobile' },
  ]
};

export const ROW_MENU_SEARCH = [
  { action: 'pvt', name: '受付' }, { action: 'karte', name: 'カルテ' }
];
