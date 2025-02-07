
export const FIRST_ENCOUNTER_ENTRIES = [
    { entity: 'allergy', label: 'アレルギー', default: true },
    { entity: 'past_history', label: '既往歴', default: true },
    { entity: 'infection', label: '感染症' },
    { entity: 'vaccination', label: '予防接種' },
    { entity: 'family_history', label: '家族歴' },
    { entity: 'childhood', label: '出生時情報' },
    { entity: 'blood_type', label: '血液型' },
    { entity: 'life_style', label: '生活習慣' }
];

export const ENTITY_SPEC_ALLERGY = {
    title: 'アレルギー',
    entity: 'allergy',
    attributes: [
        { key: 'substance', label: '原因物質', ph: 'アレルギーの原因物質' },
        { key: 'severity', isOption: true, label: '重症度', options: [{label: 'Mild', value: 'Mild'}, {label: 'Moderate', value: 'Moderate'}, {label: 'Severe', value: 'Severe'}, {label: 'No allergic reaction', value: 'No allergic reaction'}] },
        { key: 'identifiedAt', isOption: true, label: '同定日', ph: '幼稚園の頃等...' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_INFECTION = {
    title: '感染症',
    entity: 'infection',
    attributes: [
        { key: 'factor', label: '要因' },
        { key: 'examValue', isOption: true, label: '検査値' },
        { key: 'identifiedAt', isOption: true, label: '同定日' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_PAST_HISTORY = {
    title: '既往歴',
    entity: 'past_history',
    attributes: [
        { key: 'eventExpression', label: '医学イベント' },
        { key: 'timeExpression', label: '時間表現' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_FAMILIY_HISTORY = {
    title: '家族歴',
    entity: 'family_history',
    attributes: [
        { key: 'relation', label: '続柄' },
        { key: 'diagnosis', label: '疾患' },
        { key: 'age', isOption: true, label: '年齢' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_VACCINATION = {
    title: '予防接種',
    entity: 'vaccination',
    attributes: [
        { key: 'vaccine', label: 'ワクチン' },
        { key: 'injected', label: '接種有無', options: [{label: '有', value: '有'}, {label: '無', value: '無'}] },
        { key: 'age', isOption: true, label: '年齢' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_CHILDHOOD = {
    title: '出生時情報',
    entity: 'childhood',
    attributes: [
        { key: 'facility', isOption: true, label: '出生施設' },
        { key: 'deliveryWeeks', isOption: true, label: '分娩週数' },
        { key: 'deliveryMethod', isOption: true, label: '分娩方法' },
        { key: 'bodyHeight', isOption: true, label: '身長' },
        { key: 'bodyWeight', isOption: true, label: '体重' },
        { key: 'chestCircumference', isOption: true, label: '胸囲' },
        { key: 'headCircumference', isOption: true, label: '頭囲' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_LIFE_STYLE = {
    title: '生活習慣',
    entity: 'life_style',
    attributes: [
        { key: 'occupation', label: '職業' },
        { key: 'tobacco', label: 'タバコ' },
        { key: 'alcohol', label: '酒' },
        { key: 'other', isOption: true, label: 'その他' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};

export const ENTITY_SPEC_BLOOD_TYPE = {
    title: '血液型',
    entity: 'blood_type',
    attributes: [
        { key: 'abo', label: 'ABO式', options: [{label: 'A', value: 'A'}, {label: 'B', value: 'B'}, {label: 'O', value: 'O'}, {label: 'AB', value: 'AB'}] },
        { key: 'rh', isOption: true, label: 'RH式', options: [{label: 'RH+', value: 'RH+'}, {label: 'RH-', value: 'RH-'}] },
        { key: 'other', isOption: true, label: 'その他' },
        { key: 'memo', isOption: true, label: 'メモ' }
    ]
};