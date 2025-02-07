import moji from "moji";

export const hankana2Zenkana = str => {
  const kanaMap = {
    'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
    'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
    'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
    'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
    'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
    'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
    'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
    'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
    'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
    'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
    'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
    'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
    'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
    'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
    'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
    'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
    'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
    'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
    '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
  };

  const reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
  return str
    .replace(reg, function (match) {
      return kanaMap[match];
    })
    .replace(/ﾞ/g, '゛')
    .replace(/ﾟ/g, '゜');
};


// https://webllica.com/change-double-byte-to-half-width/
export const halfFrom = strVal => {
  if (!strVal) {
    return null;
  }
  let halfVal = strVal.replace(/[！-～]/g,
    function (tmpStr) {
      return String.fromCharCode(tmpStr.charCodeAt(0) - 0xFEE0);
    }
  );
  // 文字コードシフトで対応できない文字の変換
  return halfVal.replace(/”/g, "\"")
    .replace(/’/g, "'")
    .replace(/‘/g, "`")
    .replace(/￥/g, "\\")
    .replace(/　/g, " ")
    .replace(/〜/g, "~");
};

// https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
const toCamel = s => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = string => {
  return string.replace(/[\w]([A-Z])/g, function (m) {
    return m[0] + "_" + m[1];
  }).toLowerCase();
};

const isArray = a => {
  return Array.isArray(a);
};

const isObject = o => {
  return o === Object(o) && !isArray(o) && typeof o !== 'function';
};

export const keysToCamel = o => {
  if (isObject(o)) {
    const n = {};

    Object.keys(o)
      .forEach((k) => {
        n[toCamel(k)] = keysToCamel(o[k]);
      });

    return n;
  } else if (isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }

  return o;
};

export const keysToSnake = o => {
  if (isObject(o)) {
    const n = {};

    Object.keys(o)
      .forEach((k) => {
        n[toSnake(k)] = keysToSnake(o[k]);
      });

    return n;
  } else if (isArray(o)) {
    return o.map((i) => {
      return keysToSnake(i);
    });
  }

  return o;
};

export const isValidateEmail = email => {
  if (!email) {
    return false;
  }
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPassword = password => {
  // const pattern =  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,15}$/;
  // const pattern =  /^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*+]{6,15}$/;
  const pattern = /[a-zA-Z0-9!@#$%^&*+]{8,16}$/;
  return password.match(pattern);
};

export const isValidPhone = phone => {
  if (!phone) {
    return false;
  }
  const spec = phone.split('-');
  if (spec.length !== 3) {
    return false;
  }
  let ph = spec.join('');     // phone.replace(/-/g, '');
  if (!(ph.startsWith('090') || ph.startsWith('080') || ph.startsWith('070'))) {
    return false;
  }
  return ph.length === '07042224173'.length;
};

export const toE164Number = (number, country = 'JP') => {
  const spec = number.split('-');
  if (spec.length !== 3) {
    return null;
  }
  if (spec[0].startsWith('0')) {
    const len = spec[0].length;
    spec[0] = spec[0].substring(len - 2);  // 070 -> 70
  }
  const ph = spec.join('');
  if (country === 'JP') {
    return `+81${ph}`;
  }
  return ph;
};

export const last2Number = phone => {
  if (!phone || phone.length < 2) {
    return null;
  }
  return phone.substring(phone.length - 2);
};

export const isValidCode = code => {
  const pattern = /^[0-9]{6}$/;
  return code.match(pattern);
};

export const isDob = dob => {
  const pattern = /\d{4}-\d{1,2}-\d{1,2}/;
  return dob.match(pattern);
};

export const isTelephone = dob => {
  const pattern = /^0\d{1,4}-\d{1,4}-\d{3,4}$/;
  return dob.match(pattern);
};

export const telephoneFrom = (str, sep = ' ') => {
  // 045 571 6572
  // 090 4222 4173
  // 012 345 6789
  if (!str) {
    return '';
  }
  const test = str.replace(/-/g, '');
  if (!test || (test.length !== 10 && test.length !== 11)) {
    return str;
  }
  const second = str.length === 10 ? 6 : 7;
  const arr = [];
  arr.push(str.substring(0, 3));
  arr.push(str.substring(3, second));
  arr.push(str.substring(second));
  return arr.join(sep);
};

export const zipCodeFrom = (str, sep = '-') => {
  // 230 0074
  // 012 3456
  if (!str) {
    return '';
  }
  const test = str.replace(/-/g, '');
  if (test.length !== 7) {
    return str;
  }
  const arr = [];
  arr.push(test.substring(0, 3));
  arr.push(test.substring(3));
  return arr.join(sep);
};

export const addZero = (x, n) => {
  while (x.toString().length < n) {
    x = '0' + x;
  }
  return x + '';
};

export const padString = (pad, pos = 'top', str) => {
  if (pos === 'top') {
    return (pad + str).slice(-pad.length);
  }
  return (str + pad).substring(0, pad.length);
};

export const normalizeText = text => {
  // ひらがな->カタカナ  全角英数->半角
  return moji(text).convert('HG', 'KK').convert('ZE', 'HE').toString();
};

export const hiraToKana = text => {
  return text.replace(/[\u3042-\u3093]/g,
    m => String.fromCharCode(m.charCodeAt(0) + 96)
  );
};
