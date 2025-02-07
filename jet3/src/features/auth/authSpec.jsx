
export const ACCOUNT_SPEC = {
    title: 'アカウント',
    entity: 'account',
    attributes: [
        {key: 'username', type: 'email', label: '電子メール'},
        {key: 'sirName', type: 'kanji', label: '姓（漢字）'},
        {key: 'givenName', type: 'kanji', label: '名（漢字）'},
        {key: 'sirNameKana', type: 'kana', label: '姓（カナ）'},
        {key: 'givenNameKana', type: 'kana', label: '名（カナ）'},
        {key: 'license', label: '医療資格'},
        {key: 'facilityName', type: 'kana', label: '医療機関名称'},
        {key: 'depts', label: '診療科'}
    ]
};