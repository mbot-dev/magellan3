import { dateDiff } from '../util/dt2';
import { hankana2Zenkana } from '../util/strings';

class PvtFunc {

  halfToFullKana(value) {
    if (!value) {
      return '';
    }
    return hankana2Zenkana(value)
  }

  ageAt(dob, end = new Date()) {
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
  }

  dateFromOqs(value) {
    if (!value) {
      return '';
    }
    const nrm = value.replace('-', '');
    if (value.length !== 8) {
      return;
    }
    const yyyy = nrm.substring(0, 4);
    const mm = nrm.substring(4, 6);
    const dd = nrm.substring(6, 8);
    return `${yyyy}-${mm}-${dd}`;
  }

  dobWithAge(birthdate) {
    if (!birthdate) {
      return '';
    }
    const dob = this.dateFromOqs(birthdate);
    const age = this.ageAt(dob);
    return `${dob}（${age}）`;
  }

  genderFromOqs(value) {
    if (!value) {
      return '';
    }
    const test = `${value}`;
    return test === '1' ? 'M' : test === '2' ? 'F' : 'U';
  }

  personFamilyClass(kbn) {
    if (!kbn) {
      return '';
    }
    const test = `${kbn}`;
    return test === '1' ? '本人' : test === '2' ? '家族' : '';
  }

  payRatio(ratio) {
    if (!ratio) {
      return '';
    }
    const r = Number(ratio) * 10;
    return `${r}割`;
  }

  insurerWithNameNumber(name, number) {
    if (!name || !number) {
      return '';
    }
    return `${name}（${number}）`
  }

  qualificationValidity(value) {
    if (!value) {
      return '未確認';  // Face Visit=Never, Search Visit=value=''
    }
    if (value === '1') {
      return '有効';
    }
    if (value === '2') {
      return '無効';
    }
    if (value === '3') {
      return '無効（新しい資格あり）';
    }
    if (value === '4') {
      return '該当資格なし';
    }
    if (value === '5') {
      return '複数該当';
    }
    if (value === '6') {
      return '有効（未登録）';
    }
  }

  reasonOfLoss(value) {
    if (!value) {
      return '';
    }
    // prefix=0 -> 01: 死亡  02: 生活保護受給開始  03: 医療保険等の資格取得  99: その他
    if (value === '01') {
      return '死亡';
    }
    if (value === '02') {
      return '生活保護受給開始';
    }
    if (value === '03') {
      return '医療保険等の資格取得';
    }
    if (value === '99') {
      return 'その他';
    }
    return 'Error';
  }

  alertNotEqual(data, values) {
    const test = values.some(item => {
      return item !== data ? true : false;
    })
    return test;
  }
}

const instance = new PvtFunc();
export default instance;
