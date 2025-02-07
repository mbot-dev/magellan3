import styled from "styled-components";
import BasicInfo from "../karte/patient/BasicInfo";
import ContactInfo from "../karte/patient/ContactInfo";
import InsuranceInfo from "../karte/patient/InsuranceInfo";
import SummaryMemo from "../karte/patient/SummaryMemo";
import AccountingBoard from "../karte/board/AccountingBoard";
import withDisplayBlock from "../../aux/withDisplayBlock";

// レセプト
const AccountingInspector = ({ patient }) => {
  return (
    <Layout>
      <Side className="z3-karte">
        <BasicInfo patient={patient} />
        <SummaryMemo patient={patient} />
        <InsuranceInfo patient={patient} />
        <ContactInfo patient={patient} />
      </Side>
      <Header className="z3-karte"></Header>
      <Main>
        <AccountingBoard show={"true"} patient={patient} />
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

const EnhancedAccountingInspector = withDisplayBlock(AccountingInspector);
export default EnhancedAccountingInspector;
