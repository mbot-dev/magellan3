import { v4 } from "uuid";

export const HOLIDAYS = [
    { name: 'sun', disp: '日曜日' },
    { name: 'holi', disp: '祝日' },
];

export const WEEK_DAYS = [
    { disp: '月', name: 'mon' },
    { disp: '火', name: 'tue' },
    { disp: '水', name: 'wed' },
    { disp: '木', name: 'thu' },
    { disp: '金', name: 'fri' },
    { disp: '土', name: 'sat' },
];

export const OFF_ENTRIES = [...HOLIDAYS, ...WEEK_DAYS];

const timeTable = {
    regularAmStart: '',
    regularAmEnd: '',
    regularPmStart: '',
    regularPmEnd: '',
    weekDays: [
        { day: 1, name: 'mon', disp: '月', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
        { day: 2, name: 'tue', disp: '火', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
        { day: 3, name: 'wed', disp: '水', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
        { day: 4, name: 'thu', disp: '木', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
        { day: 5, name: 'fri', disp: '金', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
        { day: 6, name: 'sat', disp: '土', amStart: '', amEnd: '', pmStart: '', pmEnd: '' },
    ],
    holidays: [...HOLIDAYS],
};

export const getDefaultTimeTable= (facility_id) => {
    const ret = JSON.parse(JSON.stringify(timeTable));
    ret.facility_id = facility_id;
    const amStart = '09:00';
    const amEnd = '13:00';
    const pmStart = '15:00';
    const pmEnd = '19:00';
    ret.regularAmStart = amStart;
    ret.regularAmEnd = amEnd;
    ret.regularPmStart = pmStart;
    ret.regularPmEnd = pmEnd;
    ret.weekDays.forEach(x => {
        x.amStart = amStart;
        x.amEnd = amEnd;
        x.pmStart = pmStart;
        x.pmEnd = pmEnd;
    });
    return ret;
};

export const setupRelations = (table) => {
    table.id = table.id || v4();
    table.weekDays.forEach(x => {
        x.id = x.id || v4();
        x.schedule_id = x.schedule_id || table.id;
    });
    table.holidays.forEach(x => {
        x.id = x.id || v4();
        x.schedule_id = x.schedule_id || table.id;
    });
};

export const getAMSimbol = (t, table) => {
    if (t.amStart === '' && t.amEnd === '') {
        return '-';
    }
    if (t.amStart !== table.regularAmStart || t.amEnd !== table.regularAmEnd) {
        return '*';
    }
    return '○';
};

export const getPMSimbol = (t, table) => {
    if (t.pmStart === '' && t.pmEnd === '') {
        return '-';
    }
    if (t.pmStart !== table.regularPmStart || t.pmEnd !== table.regularPmEnd) {
        return '*';
    }
    return '○';
};

export const isHoliday = (t, table) => {
    return table.holidays.find(x => x.name === t.name) || false;
};

export const isIrregular = (t, table) => {
    if (t.amStart === '' && t.amEnd === '' && t.pmStart === '' && t.pmEnd === '') {
        return false;
    }
    return t.amStart !== table.regularAmStart || t.amEnd !== table.regularAmEnd ||
        t.pmStart !== table.regularPmStart || t.pmEnd !== table.regularPmEnd;
};

export const irregularInfo = (t) => {
    const arr = [];
    if (t.amStart !== '') {
        arr.push(t.amStart);
    }
    if (t.amEnd !== '') {
        arr.push('\u{ff5e}');
        arr.push(t.amEnd);
    }
    if (t.pmStart !== '') {
        arr.push(t.pmStart);
    }
    if (t.pmEnd !== '') {
        arr.push('\u{ff5e}');
        arr.push(t.pmEnd);
    }
    if (arr.length > 0) {
        arr.unshift(`${t.disp}曜日`);
    }
    return arr.join(' ');
};