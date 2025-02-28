import { useEffect, useState } from "react";
import { v4 } from "uuid";
import styled from "styled-components";
import BasicInfo from "./patient/BasicInfo";
import AllergyInfo from "./patient/AllergyInfo";
import ContactInfo from "./patient/ContactInfo";
import InsuranceInfo from "./patient/InsuranceInfo";
import LabTestPivot from "./labTest/LabTestPivot";
import FirstEncounter from "./first/FirstEncounter";
import KarteBoard from "./board/KarteBoard";
import SummaryMemo from "./patient/SummaryMemo";
import MedicalDocument from "./doc/MedicalDocument";
import Diagnosis from "./diagnosis/Dignosis";
import Ping from "../ping/Ping";
import withDisplayBlock from "../../aux/withDisplayBlock";
import PastHistoryInfo from "./patient/PastHistoryInfo";
import { useMargaret } from "../../io/MargaretProvider";
import { useStateValue } from "../../reducers/state";
import { currFacility } from "../../models/karteCtx";
import { useKarteState } from "./karteState";

const MY_SECTIONS = [
  { id: v4(), name: "経過記録" },
  { id: v4(), name: "傷病名" },
  { id: v4(), name: "検査結果" },
  { id: v4(), name: "初診時情報" },
  { id: v4(), name: "文書管理" },
  { id: v4(), name: "ピング" },
];

// 患者インスペクター
// 左側: 基本情報、メモ、アレルギー、病名、住所、健康保険
// 右側: カルテ、病名、検査結果、初診時情報、文書
// patient: 対象患者
const Inspector = ({ patient }) => {
  const margaret = useMargaret();
  const { user } = useStateValue()[0];
  const karteDispatch = useKarteState()[1];
  const [tabIndex, setTabIndex] = useState(0); // カルテ文書の切り替え

  useEffect(() => {
    if (!patient || !user || !karteDispatch) {
      return;
    }
    const arr = [];
    const fc_id = currFacility(user).id;
    const pt_id = patient.id;
    arr.push(margaret.getApi("diagnosis").getContinuedDisease(fc_id, pt_id));
    arr.push(margaret.getApi("risk").getEntities("allergy", fc_id, pt_id));
    arr.push(margaret.getApi("risk").getEntities("past_history", fc_id, pt_id));
    Promise.all(arr)
      .then((res) => {
        const [disease, allergies, pastHistories] = res;
        karteDispatch({
          type: "setRiskList",
          payload: { entity: "continued", list: disease },
        });
        karteDispatch({
          type: "setRiskList",
          payload: { entity: "allergy", list: allergies },
        });
        karteDispatch({
          type: "setRiskList",
          payload: { entity: "past_history", list: pastHistories },
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }, [patient, user, karteDispatch]);

  const handleClick = (e) => {
    const index = parseInt(e.target.dataset.index);
    setTabIndex(index);
  };

  return (
    <Layout>
      <Side className="z3-karte">
        <BasicInfo patient={patient} />
        <SummaryMemo patient={patient} />
        <AllergyInfo patient={patient} />
        <PastHistoryInfo patient={patient} />
        <InsuranceInfo patient={patient} />
        <ContactInfo patient={patient} />
      </Side>
      <Header className="z3-karte">
        <div className="z3-padding-box" style={{ "--pdd": "0 16px 16px 0" }}>
          <div className="z3-flex">
            <div className="z3-flex-grow" />
            <div className="z3-sub-menu-ul z3-text-09-rem">
              {MY_SECTIONS.map((s, index) => {
                const { id, name } = s;
                const selected = tabIndex === index;
                return (
                  <li
                    className={
                      selected
                        ? "z3-sub-menu-li z3-surface"
                        : "z3-sub-menu-li z3-karte"
                    }
                    key={id}
                    data-index={index}
                    onClick={handleClick}
                  >
                    {name}
                  </li>
                );
              })}
            </div>
          </div>
        </div>
      </Header>
      <Main>
        <KarteBoard show={(tabIndex === 0).toString()} patient={patient} />
        <Diagnosis show={(tabIndex === 1).toString()} patient={patient} />
        <LabTestPivot show={(tabIndex === 2).toString()} patient={patient} />
        <FirstEncounter show={(tabIndex === 3).toString()} patient={patient} />
        <MedicalDocument show={(tabIndex === 4).toString()} patient={patient} />
        <Ping show={(tabIndex === 5).toString()} patient={patient} />
      </Main>
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: auto minmax(0, 1fr); /* important  scroll*/
  grid-template-areas:
    "side hd"
    "side karte";
`;

// 患者情報
const Side = styled.div`
  grid-area: side;
  align-self: start;
  padding: 10px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* important */
  grid-template-rows: auto;
  row-gap: 24px;
  max-height: calc(100vh - var(--status-height) - 60px);
  overflow-y: auto;
  font-size: 0.9rem;
`;

// 文書切り替えタブ
const Header = styled.div`
  grid-area: hd;
`;

// カルテ情報
const Main = styled.div`
  grid-area: karte;
  overflow-y: auto;
`;

const InspectorWithDisplayBlock = withDisplayBlock(Inspector);
export default InspectorWithDisplayBlock;
