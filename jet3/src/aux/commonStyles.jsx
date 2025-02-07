import styled from "styled-components";
import { margaret, blueMist, greenCurtain } from "../assets/theme";

export const THEMES = [
  { disp: "ライラック", theme: margaret, name: "margaret" },
  { disp: "カーテン", theme: greenCurtain, name: "greenCurtain" },
  { disp: "ブルーミスト", theme: blueMist, name: "blueMist" },
];

export const findTheme = (name) => {
  const th = THEMES.find((x) => x.name === name);
  return th ? th.theme : blueMist;
};

export const GridColumn12 = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: ${(props) => props.align || "center"};
  column-gap: ${(props) => props.columnGap || 0};
  row-gap: ${(props) => props.rowGap || 0};
`;

export const GridItem = styled.div(
  ({ grid }) => `
    grid-column: ${grid.column};
    grid-row: ${grid.row};
`,
);

export const rowAt = (row, col, span = 1) => {
  return {
    row: `${row}`,
    column: `${col} / span ${span}`,
  };
};

export const FULL = 12;
export const HALF = 6;
export const THIRD = 4;
export const TWO_THIRD = 8;
export const QUARTER = 3;
export const THREE_QUARTER = 9;

// w3.css buttom + outline: 0
export const BaseButton = styled.button.attrs({
  className: "w3-button",
})``;

export const StickyColumn = styled.thead`
  & th {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--karte);
    color: var(--on-karte);
    &: first-child {
      left: 0;
      z-index: 3;
    }
  }
`;

export const StickyBody = styled.tbody`
  &th: first-child {
    position: sticky;
    left: 0;
    z-index: 2;
  }
`;

export const LABEL_MARGIN = { marginRight: "4px" };

export const FieldSet = styled.fieldset`
  border: 1px solid #ddd;
  border-radius: 4px;
`;

export const Legend = styled.legend`
  font-size: 12px;
  white-space: pre;
`;
