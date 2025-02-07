import { useState } from "react";
import {
  CODE_TEXT,
  NAME_TEXT,
  QUANTITY_TEXT,
  UNIT_TEXT,
  getSelectedRow,
} from "../../aux/FormUtil";
import { useStampState } from "../../reducers/stampState";
import {
  FieldSet,
  Legend,
  StickyBody,
  StickyColumn,
} from "../../aux/commonStyles";
import StampTabl from "./StampTable";
import { NumberInput } from "../../cmp/KanjiInput";
import withDisplayBlock from "../../aux/withDisplayBlock";

const StampTableSet = ({ origin = "tool", maxHeight }) => {
  const [{ myBundle }, localDispatch] = useStampState();
  const [selectedRow, setSelectedRow] = useState(-1);

  const handleSelect = (e) => {
    setSelectedRow(getSelectedRow(e));
  };

  const handleDelete = () => {
    if (selectedRow !== -1) {
      const item = myBundle.claimItems[selectedRow];
      localDispatch({ type: "removeItem", item: item });
    }
  };

  const getColumnStyle = (row) => {
    return row === selectedRow ? "w3-light-gray" : null;
  };

  const handleQuantity = (row, value) => {
    localDispatch({ type: "setItemQuantity", index: row, quantity: value });
  };

  const handleValidateQuantity = (row, value) => {
    localDispatch({ type: "setItemQuantity", index: row, quantity: value });
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
                <th>{QUANTITY_TEXT}</th>
                <th>{UNIT_TEXT}</th>
              </tr>
            </StickyColumn>
            <StickyBody>
              {myBundle.claimItems.map((item, index) => {
                const hasUnit = item?.unit;
                return hasUnit ? (
                  <tr key={item.code} data-item={index} onClick={handleSelect}>
                    <td className={getColumnStyle(index)}>{item.code}</td>
                    <td className={getColumnStyle(index)}>{item.name}</td>
                    <td className={getColumnStyle(index)}>
                      <NumberInput
                        className="w3-pale-red"
                        name={index}
                        value={item.quantity}
                        onChange={handleQuantity}
                        onValidate={handleValidateQuantity}
                      />
                    </td>
                    <td className={getColumnStyle(index)}>{item.unit}</td>
                  </tr>
                ) : (
                  <tr key={item.code} data-item={index} onClick={handleSelect}>
                    <td className={getColumnStyle(index)}>{item.code}</td>
                    <td className={getColumnStyle(index)} colSpan={3}>
                      {item.name}
                    </td>
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

const LEGEND = "診療行為・医薬品・特定器材をセット単位に作成してください";

const StampTableSetWithDisplayNull = withDisplayBlock(StampTableSet);
export default StampTableSetWithDisplayNull;
