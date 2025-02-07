
export const ageAt = (dob, end=new Date()) => {
    if (!dob) {
        return '';
    }
    const [year, month, date] = dob.split('-');
    const birthDate = new Date(Number(year), Number(month) - 1, Number(date));
    const [diffYear, diffMonth, diffDate] = dateDiff(birthDate, end);
    let ageDesc;
    if (diffYear > 0) {
        if (diffYear < 6) {
            ageDesc = `${diffYear}歳 ${diffMonth}ヶ月`;
        } else {
            ageDesc = `${diffYear}歳`;
        }
    } else if (diffMonth > 0) {
        ageDesc = `${diffMonth}ヶ月と${diffDate}日`;
    } else if (diffDate > 0) {
        ageDesc = `生後${diffDate}日`;
    }
    return ageDesc;
};

export const wareki = date => {
    const opt = {year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleDateString("ja-JP-u-ca-japanese", opt);
};

export const dateDiff = (b, e) => {
    let
        endYear = e.getFullYear(),
        endMonth = e.getMonth(),
        years = endYear - b.getFullYear(),
        months = endMonth - b.getMonth(),
        days = e.getDate() - b.getDate();
    if (months < 0) {
        years--;
        months += 12;
    }
    if (days < 0) {
        months--;
        days += new Date(endYear, endMonth, 0).getDate();
    }
    if (years || months || days) {
        return [years, months, days, 0, 0];
    }
    const hours = e.getHours() - b.getHours();
    const minuets = e.getMinutes() - b.getMinutes();
    if (hours > 0) {
        return [0, 0, 0, hours, 0];
    }
    if (minuets > 0) {
        return [0, 0, 0, 0, minuets];
    }
    return [0, 0, 0, 0, 0, 0];
};

export const fromNow = (b, suffix='前') => {
    if (!b) {
        return '';
    }
    const [diffYear, diffMonth, diffDate, diffHour, diffMinuets] = dateDiff(new Date(b), new Date());
    const arr = [];
    if (diffYear) {
        arr.push(diffYear);
        arr.push('年');
        if (diffMonth) {
            arr.push(diffMonth);
            arr.push('ヶ月');
        }
        arr.push(suffix);
        return arr.join('');
    }
    if (diffMonth) {
        arr.push(diffMonth);
        arr.push('ヶ月');
        if (diffDate) {
            arr.push('と');
            arr.push(diffDate);
            arr.push('日');
        }
        arr.push(suffix);
        return arr.join('');
    }
    if (diffDate) {
        arr.push(diffDate);
        arr.push('日');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffHour) {
        arr.push(diffHour);
        arr.push('時間');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffMinuets) {
        arr.push(diffMinuets);
        arr.push('分');
        arr.push(suffix);
        return arr.join('');
    }
    return 'たった今';
};

export const fromNowRough = (b, suffix='前') => {
    if (!b) {
        return '';
    }
    const [diffYear, diffMonth, diffDate, diffHour, diffMinuets] = dateDiff(new Date(b), new Date());
    const arr = [];
    if (diffYear) {
        arr.push(diffYear);
        arr.push('年');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffMonth) {
        arr.push(diffMonth);
        arr.push('ヶ月');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffDate) {
        arr.push(diffDate);
        arr.push('日');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffHour) {
        arr.push(diffHour);
        arr.push('時間');
        arr.push(suffix);
        return arr.join('');
    }
    if (diffMinuets) {
        arr.push(diffMinuets);
        arr.push('分');
        arr.push(suffix);
        return arr.join('');
    }
    return 'たった今';
};

export const isoStringFromString = str => {
    if (!str) {
        return null;
    }
    let normalized = str.replace(/\s+/g, '').replace(/-/g, '').replace(/\//g, '').replace(/:/g, '');
    const pad = '00000000000000';
    normalized = `${normalized}${pad}`.substring(0, pad.length);
    return isoStringFromNormalized(normalized);
};

export const isoStringFromNormalized = str => {
    // YYYYMMDDHHMMSS
    // 01234567890123
    if (!str || str.length !== 14) {
        return null;
    }
    const date = [];
    const time = [];
    date.push(str.substring(0, 4));
    date.push(str.substring(4, 6));
    date.push(str.substring(6, 8));
    time.push(str.substring(8, 10));
    time.push(str.substring(10, 12));
    time.push(str.substring(12));
    const datePart = date.join('-');
    const timePart = time.join(':');
    return `${datePart}T${timePart}`;
};
