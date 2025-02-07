import { useEffect, useState } from "react";
import styled from "styled-components";
import { ageAt } from "../../../util/dt2";
import { useKarteState } from "../karteState";
import pvtFunc from "../../../models/pvtFunc";

const BasicInfo = ({ patient }) => {
  const { karteShape } = useKarteState()[0];
  const [nameInfo, setNameInfo] = useState('');
  const [kanaInfo, setKanaInfo] = useState('');
  const [karteInfo, setKarteInfo] = useState('');

  useEffect(() => {
    if (!patient || !karteShape) {
      return;
    }
    const { fullName, kana, gender, dob } = patient;    // gender
    const sex = pvtFunc['genderFromOqs'](gender);
    const age = patient?.age ?? ageAt(dob);
    setNameInfo(`${fullName} （${sex} ${age}）`);

    const [year, month, date] = dob.split('-');
    const dobWithAge = `${year}${TEXT_YEAR}${month}${TEXT_MONTH}${date}${TEXT_DAY}`;
    setKanaInfo(`${kana}  ${dobWithAge}`);

    const arr = [];
    if (karteShape.numKarte === 0) {
      arr.push(TEXT_FIRST_VISIT);
    } else {
      arr.push(`${TEXT_NUM_KARTE}: ${karteShape.numKarte}`);
      arr.push(`${TEXT_FIRST_VISIT}: ${karteShape.kartePeriod[0]}`);
      arr.push(`${TEXT_LAST_VISIT}: ${karteShape.kartePeriod[1]}`);
    }
    setKarteInfo(arr);

  }, [patient, karteShape]);

  return (
    <Layout>
      <table className="w3-table">
        <tbody>
          <tr><NameTd>{nameInfo}</NameTd></tr>
          <tr><MyTd>{kanaInfo}</MyTd></tr>
          <tr><MyTd>{karteInfo[0]}</MyTd></tr>
          {
            karteInfo.length > 1 &&
            <>
              <tr><MyTd>{karteInfo[1]}</MyTd></tr>
              <tr><MyTd>{karteInfo[2]}</MyTd></tr>
            </>
          }
        </tbody>
      </table>
    </Layout>
  );
};

const Layout = styled.div`
`;

const NameTd = styled.td`
    padding: 12px 4px 0 !important;
    white-space: pre;
    font-size: 1rem !important;
`;

const MyTd = styled.td`
    padding: 4px 4px !important;
    white-space: pre;
`;

const TEXT_FIRST_VISIT = '初診';
const TEXT_NUM_KARTE = 'カルテ枚数';
const TEXT_LAST_VISIT = '最終受診日';
const TEXT_YEAR = '年';
const TEXT_MONTH = '月';
const TEXT_DAY = '日';

export default BasicInfo;
