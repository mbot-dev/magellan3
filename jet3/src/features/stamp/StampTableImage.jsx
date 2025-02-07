import { useState } from "react";
import styled from "styled-components";
import {
  isEnter,
  getValue,
  CODE_TEXT,
  NAME_TEXT,
  QUANTITY_TEXT,
  UNIT_TEXT,
  getSelectedRow,
} from "../../aux/FormUtil";
import { useStampState } from "../../reducers/stampState";
import {
  StickyBody,
  StickyColumn,
  FieldSet,
  Legend,
} from "../../aux/commonStyles";
import { isEditableComment } from "../../models/claim";
import StampTabl from "./StampTable";
import { NumberInput } from "../../cmp/KanjiInput";
import withDisplayBlock from "../../aux/withDisplayBlock";

const StampTableImage = ({ origin = "tool", maxHeight }) => {
  const [{ myBundle }, localDispatch] = useStampState();
  const [isComposing, setComposing] = useState(false);
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

  const handleUpdateComment = (row, e) => {
    localDispatch({ type: "updateComment", index: row, comment: getValue(e) });
  };

  const handleCompositionStart = () => {
    setComposing(true);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
  };

  const handleKeyDown = (e) => {
    if (isEnter(e)) {
      if (isComposing) {
        return;
      }
      e.preventDefault();
      e.target.blur();
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
                    {isEditableComment(item) && (
                      <td className={getColumnStyle(index)} colSpan={3}>
                        <CommentInput
                          value={item.name}
                          onFocus={(e) => e.target.select()}
                          onCompositionStart={handleCompositionStart}
                          onCompositionEnd={handleCompositionEnd}
                          onChange={(e) => handleUpdateComment(index, e)}
                          onKeyDown={handleKeyDown}
                        />
                      </td>
                    )}
                    {!isEditableComment(item) && (
                      <td className={getColumnStyle(index)} colSpan={3}>
                        {item.name}
                      </td>
                    )}
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

// Stamp 数量入力
const CommentInput = styled.input.attrs({
  className:
    "w3-input w3-border w3-border-light-gray w3-round-small w3-padding-small w3-light-gray",
  type: "text",
})`
  width: 100%;
  text-align: left;
`;

const LEGEND = "診療行為・フィルム・造影剤・撮影部位をセットにしてください";

const EnhancedStampTableImage = withDisplayBlock(StampTableImage);
export default EnhancedStampTableImage;
