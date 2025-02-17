import { useEffect, useState } from "react";
import styled from "styled-components";
import dateFormat from "dateformat";
import { RECEIPT_AGGREGATE } from "../../../models/claim";
import { NumberInput } from "../../../cmp/KanjiInput";

const AccountingInvoice = ({
  facility,
  patient,
  karte,
  date,
  receiptPivot,
  mode,
  amount,
  onChange,
  onValidate,
}) => {
  const [data, setData] = useState([]);
  const [totalTensu, setTotalTensu] = useState(0); // 合計点数
  const [paymentRatio, setPaymentRatio] = useState(Number("0.3")); // 保険負担率
  const [hutangaku, setHutangaku] = useState(0); // 保険分負担額
  const [hokengai, setHokengai] = useState(0); // 保険外負担額
  const [konkaiSeikyu, setKonkaiSeikyu] = useState(0); // 今回請求額
  const [zandaka, setZandaka] = useState(0); // 前回繰越額
  const [totalSeikyu, setTotalSeikyu] = useState(0); // 合計請求金額
  // const [amount, setRyoshu] = useState(0);  // 領収金額

  useEffect(() => {
    if (!receiptPivot || !date || !karte) {
      return;
    }
    const invoice = [];
    let total = 0;
    Object.entries(RECEIPT_AGGREGATE).forEach(([key, value]) => {
      const order = key.length === 1 ? parseInt(`${key}0`) : parseInt(key);
      let bundleTensu = 0;
      karte.r
        .filter((x) => x.group.startsWith(key))
        .forEach((bundle) => {
          bundle.receiptItems.forEach((item) => {
            const { rcpTensu, rcpKaisu } = item;
            bundleTensu += rcpTensu && rcpKaisu ? Number(rcpTensu) : 0;
          });
        });
      invoice.push({ order, name: value, bundleTensu });
      total += bundleTensu;
    });
    invoice.sort((a, b) => a.order - b.order);
    setData(invoice);
    setTotalTensu(total); // 合計点数
    const payRatio = Number("0.3"); // 保険負担率
    const hokenbun = kingakuFromTensu(total, payRatio); // 保険分負担額
    const hokengai = Number("0"); // 保険外負担額
    const konkai = hokenbun + hokengai; // 今回請求額
    const zan = Number("0"); // 前回繰越額
    const seikyu = konkai + zan; // 今回請求額
    setPaymentRatio(payRatio);
    setHutangaku(hokenbun);
    setHokengai(hokengai); // 保険外負担額
    setKonkaiSeikyu(konkai); // 今回請求額
    setZandaka(zan); // 前回繰越額
    setTotalSeikyu(seikyu); // 合計請求金額
    // 領収金額
    if (onChange) {
      onChange("", seikyu);
    }
  }, [receiptPivot, date, karte]);

  const dt = (date = new Date()) => {
    return dateFormat(date, DATE_STYLE);
  };

  const dept = () => {
    return karte?.deptName ?? "";
  };

  const insurance = () => {
    return karte?.hisProviderName ?? "";
  };

  const format = (num) => {
    return num.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  };

  const kingakuFromTensu = (tensu, ratio) => {
    return Math.ceil((tensu * 10 * ratio) / 10) * 10; // 保険分負担額
  };

  return (
    <Layout>
      <Title>
        <div style={{ textAlign: "right", fontSize: "12px" }}>{dt()}</div>
        <div style={{ textAlign: "center", fontSize: "18px" }}>
          診療費請求書兼領収書
        </div>
      </Title>
      <Header>
        <HeaderLeft>
          <Label>患者番号</Label>
          <Value>{patient.ptId}</Value>
          <Label>患者氏名</Label>
          <Value
            style={{ fontSize: "18px", whiteSpace: "pre" }}
          >{`${patient.fullName}  様`}</Value>
        </HeaderLeft>
        <HeaderRight>
          <Label>診療日</Label>
          <Value>{dt(date)}</Value>
          <Label>診療科</Label>
          <Value>{dept()}</Value>
          <Label>保険種類</Label>
          <Value>{insurance()}</Value>
          <Label>本人家族</Label>
          <Value>本人</Value>
          <Label>負担割合</Label>
          <Value>{paymentRatio}</Value>
        </HeaderRight>
      </Header>
      <Content>
        <ContentLeft>
          <table className="w3-table w3-border w3-bordered">
            <tbody>
              {data.map((row, i) => {
                return (
                  <tr key={i}>
                    <td style={TdStyle1}>{row.name}</td>
                    <td style={TdStyle2}>
                      {row.bundleTensu !== 0 ? format(row.bundleTensu) : ""}
                    </td>
                    <td style={TdStyle3}>点</td>
                  </tr>
                );
              })}
              <tr>
                <td style={TdStyle1}>合計点数</td>
                <td style={TdStyle2}>{format(totalTensu)}</td>
                <td style={TdStyle3}>点</td>
              </tr>
            </tbody>
          </table>
        </ContentLeft>
        <ContentRight>
          <table className="w3-table w3-border w3-bordered">
            <tbody>
              <tr>
                <td style={TdStyle1}>保険分負担額</td>
                <td style={TdStyle2}>{format(hutangaku)}</td>
                <td style={TdStyle3}>円</td>
              </tr>
              <tr>
                <td style={TdStyle1}>保険外負担額</td>
                <td style={TdStyle2}>
                  {hokengai !== 0 ? format(hokengai) : ""}
                </td>
                <td style={TdStyle3}>円</td>
              </tr>
            </tbody>
          </table>
          <table className="w3-table w3-border w3-bordered">
            <tbody>
              <tr>
                <td style={TdStyle1}>今回請求額</td>
                <td style={TdStyle2}>{format(konkaiSeikyu)}</td>
                <td style={TdStyle3}>円</td>
              </tr>
              <tr>
                <td style={TdStyle1}>前回繰越額</td>
                <td style={TdStyle2}>{zandaka !== 0 ? format(zandaka) : ""}</td>
                <td style={TdStyle3}>円</td>
              </tr>
              <tr>
                <td style={TdStyle1}>合計請求金額</td>
                <td style={TdStyle2}>{format(totalSeikyu)}</td>
                <td style={TdStyle3}>円</td>
              </tr>
            </tbody>
          </table>
          <table className="w3-table w3-border w3-bordered">
            <tbody>
              <tr>
                <td style={TdStyle1}>領収金額</td>
                {mode === "receipt" && (
                  <td style={TdStyle2}>{format(amount)}</td>
                )}
                {mode === "invoice" && (
                  <td style={TdStyle2}>
                    <NumberInput
                      className="z3-primary"
                      name="amount"
                      value={amount}
                      onChange={onChange}
                      onValidate={onValidate}
                      onKeyDown={null}
                      placeholder={null}
                      disabled={false}
                      autoFocus={true}
                      style={{ width: "112px" }}
                    />
                  </td>
                )}
                <td style={TdStyle3}>円</td>
              </tr>
            </tbody>
          </table>
        </ContentRight>
      </Content>
      <Footer>
        <Facility style={{ fontSize: "12px" }}>
          領収書は再発行いたしかねますので、大切に保存してください。
        </Facility>
        <Facility style={{ fontSize: "12px" }}>
          厚生労働省が定める診療報酬や薬価等は、医療機関等が仕入れ時に負担する消費税が反映されています。
        </Facility>
        <Facility style={{ paddingTop: "16px" }}>{facility.name}</Facility>
        <Facility>{`郵便番号 ${facility.zipCode}`}</Facility>
        <Facility>{facility.address}</Facility>
        <Facility>{`電話 ${facility.telephone}`}</Facility>
      </Footer>
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  grid-template-areas:
    "t"
    "h"
    "c"
    "f";
  row-gap: 24px;
  overflow: hidden;
`;

const Title = styled.div`
  grid-template-area: t;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-flow: row;
`;

const Header = styled.div`
  grid-template-area: h;
  align-self: start;
  padding-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  grid-area: "hl hr";
  column-gap: 32px;
`;

const HeaderLeft = styled.div`
  grid-template-area: hl;
  align-self: start;
  display: grid;
  grid-template-columns: [labels] minmax(100px, 0) [values] 1fr;
  grid-auto-flow: row;
`;

const HeaderRight = styled.div`
  grid-template-area: hr;
  align-self: start;
  justify-self: center;
  display: grid;
  grid-template-columns: [labels] minmax(100px, 0) [values] 1fr;
  grid-auto-flow: row;
`;

const Content = styled.div`
  grid-template-area: c;
  align-self: start;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  column-gap: 32px;
`;

const ContentLeft = styled.div`
  grid-template-area: cl;
  grid-row: auto;
`;

const ContentRight = styled.div`
  grid-template-area: cr;
  align-self: start;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  grid-row: auto;
  row-gap: 16px;
`;

const Label = styled.div`
  grid-column: labels;
  grid-row: auto;
`;

const Value = styled.div`
  grid-column: values;
  grid-row: auto;
`;

const Footer = styled.div`
  grid-template-area: f;
  align-self: start;
  display: grid;
  grid-template-columns: [facility] minmax(0, 1fr);
  grid-auto-flow: row;
`;

const Facility = styled.div`
  grid-column: facility;
  grid-row: auto;
`;

const TdStyle1 = {
  padding: "8px 8px",
};

const TdStyle2 = {
  minWidth: "128px",
  width: "128px",
  maxWidth: "128px",
  padding: "8px 8px",
  textAlign: "right",
};

const TdStyle3 = {
  minWidth: "80px",
  width: "80px",
  maxWidth: "80px",
  padding: "8px 8px",
  textAlign: "right",
};

const DATE_STYLE = "yyyy年m月d日";

export default AccountingInvoice;
