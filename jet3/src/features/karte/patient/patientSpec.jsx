
export const ENTITY_SPEC_MAIN_INSURANCE = {
  entity: 'healthInsurances',
  attributes: [
    { label: '保険者番号', key: 'insurerNumber' },
    { label: '保険名称', key: 'insurerName' },
    { label: '記号', key: 'insuredCardSymbol' },
    { label: '番号', key: 'insuredIdentificationNumber' },
    { label: '本人家族区分', key: 'personalFamilyClassification', func: 'personFamilyClass', arg: ['personalFamilyClassification'] },
  ]
};

export const ENTITY_SPEC_PUBLIC_INSURANCE = {
  entity: 'publicInsurances',
  attributes: [
    { label: '公費名称', key: 'publicName' },
    { label: '負担者番号', key: 'insurerNumber' },
    { label: '受給者番号', key: 'insuredPersonNumber' },
    { label: '優先順位', key: 'priority' },
  ]
};

export const ENTITY_SPEC_CONTACT_INFO = {
  entity: 'contacts',
  attributes: [
    { label: '〒', key: 'zipCode' },
    { label: '住所', key: 'address' },
    { label: '電話', key: 'telephone' }
  ],
};
