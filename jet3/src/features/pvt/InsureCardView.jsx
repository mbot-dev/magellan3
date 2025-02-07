import React from "react";
import styled from "styled-components";
import { INSURE_CARD_SPEC } from "./pvtSpec";
import pvtFunc from "../../models/pvtFunc";

const InsureCardView = ({ insure }) => {
  return (
    <Layout>
      <Left>
        {
          INSURE_CARD_SPEC.attributes1.map((attr) => {
            const { label, key, func, arg, alertNotEqual } = attr;
            const args = arg ? arg.map((a) => insure[a]) : [];
            if (label.startsWith('--')) {
              return <hr key={key} />
            }
            if (func) {
              const data = pvtFunc[func](...args);
              const danger = alertNotEqual ? pvtFunc['alertNotEqual'](data, alertNotEqual) : false;
              return (
                <React.Fragment key={key}>
                  <Label>{label}</Label>
                  <Control style={danger ? { 'color': 'var(--danger)' } : { 'color': 'inherit' }}>{data}</Control>
                </React.Fragment>
              )
            }
            return (
              <React.Fragment key={key}>
                <Label>{label}</Label>
                <Control>{insure[key]}</Control>
              </React.Fragment>
            )
          })
        }
      </Left>
      <Right>
        {
          INSURE_CARD_SPEC.attributes2.map((attr) => {
            const { label, key, func, arg } = attr;
            const args = arg ? arg.map((a) => insure[a]) : [];
            if (label.startsWith('--')) {
              return <hr key={key} />
            }
            if (func) {
              return (
                <React.Fragment key={key}>
                  <Label>{label}</Label>
                  <Control>{pvtFunc[func](...args)}</Control>
                </React.Fragment>
              )
            }
            return (
              <React.Fragment key={key}>
                <Label>{label}</Label>
                <Control>{insure[key]}</Control>
              </React.Fragment>
            )
          })
        }
      </Right>
    </Layout>
  )
};

const ROW_GAP = 16;

const Layout = styled.div`
  width: 1024px;
  padding: 0 0 0 32px;
  display: grid;
  grid-template-columns: [left] 1fr [right] 1fr;
  grid-template-rows: auto;
  column-gap: 8px;
  align-items: start;
`;

const Left = styled.div`
  grid-column: left;
  display: grid;
  grid-template-columns: [labels] 1fr [controles] 1fr;
  grid-auto-frow: row;
  column-gap: 8px;
  row-gap: ${ROW_GAP}px;
`;

const Right = styled.div`
  grid-column: right;
  display: grid;
  grid-template-columns: [labels] 1fr [controles] 1fr;
  grid-auto-frow: row;
  column-gap: 8px;
  row-gap: ${ROW_GAP}px;
`;

const Label = styled.div`
  grid-column: labels;
  grid-row: auto;
`;

const Control = styled.div`
  grid-column: controles;
  grid-row: auto;
  color: var(--color);
`;

export default InsureCardView;
