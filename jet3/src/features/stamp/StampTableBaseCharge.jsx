import { useState } from "react";
import { CODE_TEXT, NAME_TEXT, getSelectedRow } from "../../aux/FormUtil";
import { useStampState } from "../../reducers/stampState";
import {
  StickyBody,
  StickyColumn,
  FieldSet,
  Legend,
} from "../../aux/commonStyles";
import StampTabl from "./StampTable";
import withDisplayBlock from "../../aux/withDisplayBlock";

const StampTableBaseCharge = ({ origin = "tool", maxHeight }) => {
  const [{ myBundle }, localDispatch] = useStampState();
  const [selectedRow, setSelectedRow] = useState(-1);

  const handleSelect = (e) => {
    const row = getSelectedRow(e);
    setSelectedRow(row);
  };

  const getColumnStyle = (row) => {
    return row === selectedRow ? "w3-light-gray" : null;
  };

  const handleDelete = () => {
    if (selectedRow !== -1) {
      const item = myBundle.claimItems[selectedRow];
      localDispatch({ type: "removeItem", item: item });
      setSelectedRow(-1);
    }
  };

  return (
    myBundle && (
      <StampTabl
        origin={origin}
        maxHeight={maxHeight}
        selectedRow={selectedRow}
        onDelete={handleDelete}
      >
        <FieldSet>
          <Legend>{LEGEND}</Legend>
          <table className="w3-table w3-bordered">
            <StickyColumn>
              <tr>
                <th>{CODE_TEXT}</th>
                <th>{NAME_TEXT}</th>
              </tr>
            </StickyColumn>
            <StickyBody>
              {myBundle.claimItems.map((item, row) => {
                const { code, name } = item;
                return (
                  <tr key={code} data-item={row} onClick={handleSelect}>
                    <td className={getColumnStyle(row)}>{code}</td>
                    <td className={getColumnStyle(row)}>{name}</td>
                  </tr>
                );
              })}
            </StickyBody>
          </table>
        </FieldSet>
      </StampTabl>
    )
  );
};

const LEGEND = "複数の診療行為を登録できます";

const EnhancedStampTableBaseCharge = withDisplayBlock(StampTableBaseCharge);
export default EnhancedStampTableBaseCharge;
