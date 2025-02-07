import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import AccountingInspector from "./AccountingInspector";
import DiagnosisChanger from "../karte/board/DignosisChanger";
import BundleChanger from "../karte/board/BundleChanger";
import AccountingTab from "./AccountingTab";
import withDisplayBlock from "../../aux/withDisplayBlock";
import { KarteProvider } from "../karte/karteState";
import { initialKarteState, karteReducer } from "../karte/karteReducer";

const RoomAccounting = () => {
  const {
    accountingList,
    currentAccounting,
    diagnosisToChange,
    bundleToChange,
  } = useStateValue()[0];

  return (
    <Layout>
      <Empty />
      <Header>
        <AccountingTab />
      </Header>
      <Main>
        {accountingList.map((patient) => {
          const show = currentAccounting?.ptId === patient.ptId;
          return (
            <KarteProvider
              key={patient.ptId}
              initialState={initialKarteState}
              reducer={karteReducer}
            >
              <AccountingInspector show={show.toString()} patient={patient} />
            </KarteProvider>
          );
        })}
      </Main>
      {diagnosisToChange && <DiagnosisChanger target={diagnosisToChange} patient={currentAccounting} />}
      {bundleToChange && <BundleChanger target={bundleToChange} patient={currentAccounting} />}
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(25%, 0) 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "e h"
    "c c";
`;

const Empty = styled.div`
  grid-area: e;
`;

const Header = styled.div`
  grid-area: h;
`;

const Main = styled.div`
  grid-area: c;
`;

const RoomAccountingWithDisplayBlock = withDisplayBlock(RoomAccounting);
export default RoomAccountingWithDisplayBlock;
