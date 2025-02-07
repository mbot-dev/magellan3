import { useEffect, useState } from 'react';
import styled from 'styled-components';
import dateFormat from 'dateformat';
import { RECEIPT_CODE_NAME } from "../../../models/claim";

const AccountingDetail = (props) => {
  const { facility, patient, karte, date, receiptPivot } = props;
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!receiptPivot || !date || !karte) {
      return;
    }
    const data = Object.keys(receiptPivot).sort().map((g) => {
      const rowIndex = receiptName(g);
      const entries = receiptPivot[g]?.[date] ?? [];
      const bundles = (entries?.length && karte?.r?.length) ? karte.r.filter(x => entries.includes(x.id)) : [];
      const items = [];
      bundles.forEach(bundle => {
        bundle.receiptItems.forEach(item => {
          const { id, name, quantity, unit, rcpTensu, rcpKaisu } = item;
          const itName = (quantity && unit) ? `${name} ${quantity}${unit}` : name;
          const kaisu = rcpTensu && rcpKaisu ? rcpKaisu : '';
          items.push({ id, name: itName, rcpTensu, kaisu });
        });
      });
      return {
        rowIndex,
        items,
      };
    });
    setData(data);

  }, [receiptPivot, date, karte]);

  const receiptName = rowGroup => {
    const group = rowGroup;
    const rc = group.substring(0, 2);
    return RECEIPT_CODE_NAME[rc];
  };

  const dt = (date = new Date()) => {
    return dateFormat(date, DATE_STYLE);
  };

  const dept = () => {
    return karte?.deptName ?? '';
  };

  const insurance = () => {
    return karte?.hisProviderName ?? '';
  };

  const format = (num) => {
    if (!num) {
      return '';
    }
    return num.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
  };

  return (
    <Layout>
      <Title>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>{dt()}</div>
        <div style={{ textAlign: 'center', fontSize: '18px' }}>診療明細書</div>
      </Title>
      <Header>
        <HeaderLeft>
          <Label>患者番号</Label>
          <Value>{patient.ptId}</Value>
          <Label>氏名</Label>
          <Value style={{ fontSize: '18px' }}>{`${patient.fullName}　様`}</Value>
        </HeaderLeft>
        <HeaderRight>
          <Label>診療日</Label>
          <Value>{dt(date)}</Value>
          <Label>診療科</Label>
          <Value>{dept()}</Value>
          <Label>保険種類</Label>
          <Value>{insurance()}</Value>
          <Label>本人家族</Label>
          <Value></Value>
          <Label>負担割合</Label>
          <Value></Value>
        </HeaderRight>
      </Header>
      <Content>
        <table className='w3-table w3-border w3-bordered'>
          <thead>
            <tr>
              <th style={TdStyle1}>区分</th>
              <th style={TdStyle2}>項目名</th>
              <th style={TdStyle3}>点数</th>
              <th style={TdStyle3}>回数</th>
            </tr>
          </thead>
          <tbody>
            {
              data.map((row) => {
                const { rowIndex, items } = row;
                return (
                  items.map((item, j) => {
                    return (
                      <tr key={item.id}>
                        {j === 0 && <td rowSpan={items.length} style={TdStyle1}>{rowIndex}</td>}
                        <td style={TdStyle2}>{item.name}</td>
                        <td style={TdStyle3}>{format(item.rcpTensu)}</td>
                        <td style={TdStyle3}>{item.kaisu}</td>
                      </tr>
                    );
                  })
                );
              })
            }
          </tbody>
        </table>
      </Content>
      <Fotter>
        <div style={{ fontSize: '12px' }}>
          厚生労働省が定める診療報酬や薬価等は、医療機関等が仕入れ時に負担する消費税が反映されています。
        </div>
        <Facility style={{ paddingTop: '16px' }}>{facility.name}</Facility>
        <Facility>{`郵便番号 ${facility.zipCode}`}</Facility>
        <Facility>{facility.address}</Facility>
        <Facility>{`電話 ${facility.telephone}`}</Facility>
      </Fotter>
    </Layout>
  );
};

const Layout = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas: 
        't'
        'h'
        'c'
        'f';
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    grid-template-areas:
        'hl hr';
    column-gap: 48px;
`;

const HeaderLeft = styled.div`
    grid-area: hl;
    align-self: start;
    display: grid;
    grid-template-columns: [labels] minmax(100px, 0) [values] 1fr;
    grid-auto-flow: row;
`;

const HeaderRight = styled.div`
    grid-area: hr;
    align-self: start;
    justify-self: center;
    display: grid;
    grid-template-columns: [labels] minmax(100px, 0) [values] 1fr;
    grid-auto-flow: row;
`;

const Content = styled.div`
    grid-template-area: c;
    align-self: start;
`;

const Label = styled.div`
    grid-column: labels;
    grid-row: auto;
`;

const Value = styled.div`
    grid-column: values;
    grid-row: auto;
`;

const Fotter = styled.div`
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
  padding: '8px 8px',
};

const TdStyle2 = {
  padding: '8px 8px',
  borderLeft: '1px solid #ddd',
};

const TdStyle3 = {
  padding: '8px 8px',
  borderLeft: '1px solid #ddd',
  textAlign: 'right',
};

const DATE_STYLE = 'yyyy年m月d日';

export default AccountingDetail;
