import { useEffect, useState } from "react";
import { useStateValue } from "../../reducers/state";
import { getSelectedRow } from "../../aux/FormUtil";
import claimFunc from "../../models/claimFunc";
import { useStampState } from "../../reducers/stampState";
import { isAdministration, isBodyPart, isComment, isInjectionMed, isMaterial, isMedicine, isOral, isProcedure, isTopical, procedureTypeName } from "../../models/claim";

// 点識別マッピング
const procedureTensuClass = flag => {
  switch (flag) {
    case '1':
      return '金';
    case '3':
      return '点';
    case '4':
      return '購';
    case '5':
      return '%加';
    case '6':
      return '%減';
    case '7':
      return '減点';
    case '8':
      return '点-';
    default:
      return '';
  }
};

// 医薬品 点識別
const medicineTensuClass = flag => {
  switch (flag) {
    case '1':
      return '金';
    case '7':
      return '減';
    default:
      return '';
  }
};

// 器材 点識別
const materialTensuClass = flag => {
  switch (flag) {
    case '1':
      return '金';
    case '2':
      return '購';
    case '5':
      return '%加';
    case '9':
      return '乗割';
    default:
      return '';
  }
};

const koseishinClass = flg => {
  switch (flg) {
    case '1':
      return '麻';
    case '2':
      return '毒';
    case '3':
      return '覚';
    case '5':
      return '向';
    default:
      return '';
  }
};

// マスター検索結果の点数部分マッピング
const tensuClass = (item, flag) => {
  if (isProcedure(item)) {
    return procedureTensuClass(flag);
  }
  if (isMedicine(item)) {
    return medicineTensuClass(flag);
  }
  if (isMaterial(item)) {
    return materialTensuClass(flag);
  }
  return '';
};

const kbnColorFromItem = item => {
  if (isProcedure(item)) {
    return [procedureTypeName(item), ''];
  }
  if (isMedicine(item)) {
    const { doseType } = item;
    if (isOral(doseType)) {
      return ['内用', 'z3-text-oral'];
    }
    if (isTopical(doseType)) {
      return ['外用', 'z3-text-topical'];
    }
    if (isInjectionMed(doseType)) {
      return ['注射', 'z3-text-injection'];
    }
  }
  if (isMaterial(item)) {
    return ['器材', ''];
  }
  if (isAdministration(item)) {
    return ['用法', ''];
  }
  if (isBodyPart(item)) {
    return ['部位', ''];
  }
  if (isComment(item)) {
    return ['コメント', ''];
  }

  return ['その他', ''];
};

const specificInfoFrom = item => {
  if (isProcedure(item)) {
    const { tensuKbn, kbnNo } = item;
    const test = parseInt(item?.kbnEda);
    const eda = (isNaN(test) || test === 0) ? '' : `-${test}`;
    return `${tensuKbn}${kbnNo}${eda}`;
  }
  if (isMedicine(item)) {
    const { koseishin } = item;
    return koseishinClass(koseishin);
  }
  return '';
};

const MasterSearchResults = ({ maxHeight }) => {
  const { settings } = useStateValue()[0];
  const [{ searchResults }, localDispatch] = useStampState();
  const [masterItem, setMasterItem] = useState(null);

  useEffect(() => {
    if (!masterItem) {
      return;
    }
    const claimItem = claimFunc['createClaimItem'](masterItem);
    localDispatch({ type: 'addItem', item: claimItem });

  }, [masterItem]);

  const handleSelect = e => {
    e.preventDefault();
    const row = getSelectedRow(e);
    const item = searchResults[row];
    setMasterItem(item);
  };

  return (
    <div className='z3-calc-scroll-container' style={{ '--max-height': maxHeight }}>
      <table className="w3-table w3-bordered w3-hoverable z3-karte">
        <tbody>
          {
            searchResults.map((item, index) => {
              const { code, name, unitCode, unit, tensu, tensuType } = item;
              const [cls, color] = kbnColorFromItem(item);
              const specificInfo = specificInfoFrom(item);
              return (
                <tr key={code} className={settings.isMasterColoring ? color : ''} data-item={index} onClick={handleSelect}>
                  <td>{cls}</td>
                  <td>{specificInfo}</td>
                  <td>{code}</td>
                  <td>{name}</td>
                  <td>{unitCode !== '0' ? unit : ''}</td>
                  <td className="w3-right-align">{tensu}</td>
                  <td>{tensuClass(item, tensuType)}</td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </div>
  );
};

export default MasterSearchResults;
