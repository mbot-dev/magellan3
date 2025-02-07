import dateFormat from 'dateformat';

const VALUE_FORM = [
    'U（以上）', 'E（以下）', 'L（未満）', 'O（釣果）', 'B（結果なし）'
];

const REF_VALUE_CLASS = [
     '-（範囲）', 'E（以下）', 'L（未満）', 'U（以上）'
];

const valueFromFlags = (str, flags) => {
    if (!str) {
        return str;
    }
    let value = '';
    flags.some(fg => {
        if (fg.startsWith(str)) {
            const start = fg.indexOf('（');
            const end = fg.lastIndexOf('）');
            value = fg.substring(start+1, end);
            return true;
        }
        return false;
    });
    return value;
};

export const labValueForm = (str) => {
    return valueFromFlags(str, VALUE_FORM);
};

export const refValueClass = (str) => {
    return valueFromFlags(str, REF_VALUE_CLASS);
};

export const labDateString = (isoString, format) => {
    if (!isoString) {
        return null;
    }
    return dateFormat(new Date(isoString), format);
};

export const sortTestCode = list => {
    list.sort((a, b) => {
        if (a.testCode < b.testCode) return -1;
        if (a.testCode > b.testCode) return 1;
        return 0;
    });
};
