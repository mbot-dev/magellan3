import { useState, useCallback, useTransition } from "react";
import { v4 } from "uuid";
import styled from "styled-components";
import dateFormat from "dateformat";
import pvtFunc from "../../models/pvtFunc";
import { useStateValue } from "../../reducers/state";
import { useMargaret } from "../../io/MargaretProvider";
import { isDob, isTelephone, normalizeText } from "../../util/strings";
import { isEnter } from "../../aux/FormUtil";
import { currFacility, ISO_DATE_TIME } from "../../models/karteCtx";
import { SearchIcon } from "../../cmp/Icons";
import withDisplayNull from "../../aux/withDisplayNull";
import { PATIENT_SEARCH_SPEC, ROW_MENU_SEARCH } from "./pvtSpec";
import MoreHorizClick from "../../cmp/MoreHorizClick";

const createPvt = (patient, user) => {
  if (!patient || !user) {
    return null;
  }
  const facility = currFacility(user);
  const his = patient.healthInsurances[0];
  const visit = {};
  visit.id = v4();
  visit.facilityId = facility.id;
  visit.pvtDateTime = dateFormat(new Date(), ISO_DATE_TIME);
  visit.patient = patient;
  visit.patientId = patient.id;
  visit.phy_id = user.id;
  visit.phyFullName = user.fullName;
  visit.phyKana = user.kana;
  visit.deptId = facility.departments[0].code;
  visit.deptName = facility.departments[0].name;
  visit.hisId = his.id;
  visit.hisProviderName = his.providerName;
  visit.hisCombinationNumber = his.combinationNumber;
  visit.status = "waiting";
  visit.memo = "";
  return visit;
};

const PatientSearch = () => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleQuery = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyDown = (e) => {
    if (!isEnter(e)) {
      return;
    }
    e.preventDefault();
    const search = normalizeText(query);
    if (!search) {
      return;
    }
    const payload = {};
    payload.facility_id = currFacility(user).id; // ログインユーザーの医療機関ID
    if (isDob(search)) {
      payload.attribute = "dob";
    } else if (isTelephone(search)) {
      payload.attribute = "phone";
    } else {
      payload.attribute = "name";
    }
    payload.search = search;
    const asyncGET = async (params) => {
      try {
        const result = await margaret
          .getApi("patient")
          .find(params.facility_id, params.attribute, params.search);
        setList(result);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    startTransition(() => asyncGET(payload));
  };

  // Morehoriz click
  const handleSelect = (action, row) => {
    const patient = list[row];
    if (action === "karte") {
      dispatch({ type: "openKarte", patient: patient });
      return;
    }
    if (action === "pvt") {
      const pvt = createPvt(patient, user);
      startTransition(async () => {
        try {
          await margaret.getApi("pvt").save(pvt);
        } catch (err) {
          dispatch({ type: "setError", error: err });
        }
      });
    }
  };

  return (
    <Layout>
      <Header>
        <SearchIcon />
        <FlexWidth>
          <input
            type="text"
            className="w3-input w3-border w3-round"
            placeholder=""
            value={query}
            autoFocus={true}
            autoComplete="off"
            onChange={handleQuery}
            onKeyDown={handleKeyDown}
            disabled={isPending}
          />
        </FlexWidth>
        <span className="z3-text-08-rem">{SEARCH_INST}</span>
      </Header>
      <Main>
        <div className="z3-flex">
          <span className="z3-text-08-rem">
            {list.length
              ? `${TEXT_SEARCH_RESULTS} ${list.length}${TEXT_NUM_RESULTS}`
              : TEXT_SEARCH_RESULTS}
          </span>
        </div>
        <ScrollContent>
          <table className="w3-table w3-border w3-bordered">
            <tbody>
              {list.map((patient, row) => {
                return (
                  <tr key={patient.id}>
                    {PATIENT_SEARCH_SPEC.attributes.map((attr) => {
                      const { key, func, arg } = attr;
                      const args = arg ? arg.map((a) => patient[a]) : [];
                      return func ? (
                        <td key={key} className="z3-middle-td">
                          {pvtFunc[func](...args)}
                        </td>
                      ) : (
                        <td key={key} className="z3-middle-td">
                          {patient[key]}
                        </td>
                      );
                    })}
                    <td className="w3-right-align z3-middle-td">
                      <MoreHorizClick
                        menus={ROW_MENU_SEARCH}
                        sourceIndex={row}
                        onSelect={handleSelect}
                        right={true}
                        disabled={isPending}
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
  align-items: center;
  column-gap: 8px;
`;

const Main = styled.div`
  grid-area: m;
  height: 100%;
  display: flex;
  flex-direction: column;
  row-gap: 4px;
`;

const ScrollContent = styled.div`
  max-height: calc(100vh - 176px);
  overflow-y: auto;
`;

const FlexWidth = styled.div`
  flex: 0 0 256px;
`;

const SEARCH_INST =
  "姓、名（漢字、ひらがな、カタカナ）、ID、等が使用できます。";
const TEXT_SEARCH_RESULTS = "検索結果";
const TEXT_NUM_RESULTS = "件";

const EnhancedPatientSearch = withDisplayNull(PatientSearch);
export default EnhancedPatientSearch;
