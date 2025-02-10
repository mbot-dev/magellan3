import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import formatDate from "intl-dateformat";
import { useStateValue } from "../../reducers/state";
import { ageAt } from "../../util/dt2";
import { useMargaret } from "../../io/MargaretProvider";
import { currFacility } from "../../models/karteCtx";
import withDisplayNull from "../../aux/withDisplayNull";
import { PVT_STATUS_SPEC, ROW_MENU_PVT } from "./pvtSpec";
import MoreHorizClick from "../../cmp/MoreHorizClick";
import HoverInfo from "../../cmp/HoverInfo";
import {
  FiCreditCard,
  FiFlag,
  FiLock,
  FiAlertTriangle,
  FiAward,
} from "react-icons/fi";
import { MdOutlineWatchLater } from "react-icons/md";
import pvtFunc from "../../models/pvtFunc";
import InsureCardView from "./InsureCardView";
import ModalEditorLarge from "../../cmp/ModalEditorLarge";

const ORANGE = "#ff9800";
const GRAY = "#717171";
const RED = "#f44336";
const DT_FORMAT = "YYYY年 MM月 DD日（ddd）";

const statusIcon = (lockedBy, status, newPatient, newHis) => {
  if (lockedBy) {
    return (
      <FiLock size="22px" color={GRAY} style={{ verticalAlign: "middle" }} />
    );
  }
  if (status === "pending") {
    return (
      <FiAlertTriangle
        size="22px"
        color={RED}
        style={{ verticalAlign: "middle" }}
      />
    );
  }
  if (newPatient || newHis) {
    return (
      <FiAward size="22px" color={ORANGE} style={{ verticalAlign: "middle" }} />
    );
  }
  if (status === "waiting") {
    return (
      <MdOutlineWatchLater
        size="24px"
        color={GRAY}
        style={{ verticalAlign: "middle" }}
      />
    );
  }
  if (status === "onPayment") {
    return (
      <FiCreditCard
        size="20px"
        color={GRAY}
        style={{ verticalAlign: "middle" }}
      />
    );
  }
  if (status === "done") {
    return (
      <FiFlag size="22px" color={ORANGE} style={{ verticalAlign: "middle" }} />
    );
  }
};

const PatientVisit = () => {
  const margaret = useMargaret();
  const [{ user, updateVisit }, dispatch] = useStateValue();
  const [visits, setVisits] = useState([]);
  const [currentStatus, setCurrentStatus] = useState({ numVisits: 0, waiting: 0, pending: 0, payment: 0, done: 0 });
  const [insureToConfirm, setInsureToConfirm] = useState(null);
  const pvtDate = useRef(new Date());

  useEffect(() => {
    const asyncGet = async (fcId, date, limit, offset) => {
      try {
        const results = await margaret.getApi("pvt").getPatientVisits(fcId, date, limit, offset);
        // console.log(JSON.stringify(results, null, 3));
        // debugger;
        setVisits(results);
        const initialState = { numVisits: 0, waiting: 0, pending: 0, payment: 0, done: 0 };
        const st = results.reduce(
          (acc, pvt) => {
            const key = pvt.status;
            acc[key] += 1;
            return acc;
          }, initialState);
        setCurrentStatus(st);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facilityId = currFacility(user).id;
    const offset = 0; // Fetch all records visits.length;
    const limit = 1000;
    const date = formatDate(pvtDate.current, "YYYY-MM-DD");
    asyncGet(facilityId, date, limit, offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateVisit]);

  // MoreHoriz Selected
  const handleSelect = (action, row) => {
    const visit = visits[row];
    // console.log(JSON.stringify(visit, null, 3));
    // debugger;
    if (action === "insure") {
      const test = visit["patient"]?.["healthInsurances"] ?? [];
      if (test.length === 0) {
        return;
      }
      const his = test[0];
      const addition = ['qualificationValidity', 'qualificationConfirmationDate'];
      addition.forEach((key) => {
        his[key] = visit[key];
      });
      console.log(JSON.stringify(his, null, 3));
      setInsureToConfirm(his);
    }
    if (action === "karte" || action === "accounting") {
      const asyncLock = async (fc_id, userName, visitId) => {
        try {
          const lock = await margaret.getApi("pvt").getVisitLock(fc_id, userName, visitId);
          if (!lock.lock) {
            return;
          }
          // Upside Down  visit has patient -> patient.hasVisit
          const { patient } = visit;
          const uPatient = JSON.parse(JSON.stringify(patient));
          const uVisit = { ...visit, patient: undefined }; // exclude patient

          const { pvtDateTime, ...others } = uVisit;
          const changed = { pvtDateTime: pvtDateTime, ...others };
          uPatient.visit = changed;
          // console.log(JSON.stringify(uPatient, null, 3));
          if (action === "karte") {
            dispatch({ type: "openKarte", patient: uPatient });
            return;
          }
          if (action === "accounting") {
            dispatch({ type: "openAccounting", patient: uPatient });
            return;
          }
        } catch (err) {
          dispatch({ type: "setError", error: err });
        }
      };
      asyncLock(currFacility(user).id, user.fullName, visit.id);
    }
    if (action === "delete") {
      const asyncDelete = async (fcId, pvtId) => {
        try {
          await margaret.getApi("pvt").deleteVisit(fcId, pvtId);
        } catch (err) {
          dispatch({ type: "setError", error: err });
        }
      };
      const facilityId = currFacility(user).id;
      asyncDelete(facilityId, visit.id);
    }
  };

  return (
    <Layout>
      <Header>
        <span>{formatDate(pvtDate.current, DT_FORMAT)}</span>
        {PVT_STATUS_SPEC.attributes.map((attr) => {
          const key = attr.key;
          return (
            <span key={key}>
              {attr.label}: {currentStatus ? currentStatus[key] : ""}
            </span>
          );
        })}
        <FlexWidth />
      </Header>
      <Main>
        <ScrollContent>
          <table className="w3-table w3-border w3-bordered w3-hoverable">
            <tbody>
              {visits.map((pvt, row) => {
                const {
                  id,
                  patient,
                  pvtDateTime,
                  hisProviderName,
                  qualificationValidity,
                  deptName,
                  phyFullName,
                  lockedBy,
                  newPatient,
                  newHis,
                  status,
                } = pvt;
                const { ptId, fullName, kana, gender, dob } = patient;
                const sex = pvtFunc["genderFromOqs"](gender);
                pvt.age = pvt.age || ageAt(dob);
                const visitTime = pvtDateTime.substring(11, 16); // yyyy-mm-ddThh:mm:ss+0900
                const valid = pvtFunc["qualificationValidity"](
                  qualificationValidity,
                );
                return (
                  <tr key={id}>
                    <td className="z3-middle-td">{`${row + 1}`}</td>
                    <td className="z3-middle-td">{visitTime}</td>
                    <td className="z3-middle-td">{ptId}</td>
                    <td className="z3-middle-td">{fullName}</td>
                    <td className="z3-middle-td">{kana}</td>
                    <td className="z3-middle-td">{sex}</td>
                    <td className="z3-middle-td">{`${dob}（${pvt.age}）`}</td>
                    <td className="z3-middle-td">{hisProviderName}</td>
                    <td className="z3-middle-td">{valid}</td>
                    <td className="z3-middle-td">{deptName}</td>
                    <td className="z3-middle-td">{phyFullName}</td>
                    <td className="z3-middle-td">
                      {lockedBy && (
                        <HoverInfo
                          messages={[user.fullName]}
                          width="max-content"
                        >
                          {statusIcon(lockedBy, status, newPatient, newHis)}
                        </HoverInfo>
                      )}
                      {!lockedBy &&
                        statusIcon(lockedBy, status, newPatient, newHis)}
                    </td>
                    <td className="w3-right-align z3-middle-td">
                      <MoreHorizClick
                        menus={ROW_MENU_PVT}
                        onSelect={handleSelect}
                        sourceIndex={row}
                        right={true}
                        disabled={false}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ height: "192px" }} />
        </ScrollContent>
      </Main>
      {
        insureToConfirm &&
        <ModalEditorLarge
          id="insure_card_view"
          title="保険証確認"
          onCancel={() => setInsureToConfirm(null)}
          onSubmit={() => setInsureToConfirm(null)}
          width="1024px"
        >
          <InsureCardView
            insure={insureToConfirm}
          />
        </ModalEditorLarge>
      }
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, auto) 1fr;
  grid-template-areas:
    "h"
    "m";
  row-gap: 16px;
`;

const Header = styled.div`
  grid-area: h;
  display: flex;
  justify-content: flex-end;
  column-gap: 32px;
`;

const Main = styled.div`
  grid-area: m;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ScrollContent = styled.div`
  max-height: calc(100vh - 200px);
  overflow-y: auto;
`;

const FlexWidth = styled.div`
  flex: 0 0 32px;
`;

const EnhancedPatientVisit = withDisplayNull(PatientVisit);
export default EnhancedPatientVisit;
