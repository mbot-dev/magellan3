import { useState, useEffect } from "react";
import styled from "styled-components";
import { CLAIM_INSTRUCTION, CLAIM_MEDICINE } from "../../models/claim";
import {
  CODE_TEXT,
  NAME_TEXT,
  DISPLAY_TEXT,
  QUANTITY_TEXT,
  UNIT_TEXT,
  TOTAL_QUANTITY_TEXT,
  getSelectedRow,
} from "../../aux/FormUtil";
import { useStampState } from "../../reducers/stampState";
import {
  StickyBody,
  StickyColumn,
  FieldSet,
  Legend,
} from "../../aux/commonStyles";
import { NumberInput } from "../../cmp/KanjiInput";
import DoseSelector from "./DoseSelector";
import withDisplayBlock from "../../aux/withDisplayBlock";
import StampTabl from "./StampTable";

const TEXT_ONE_TIME = "1回の量";
const TEXT_ONE_DAY = "1日の回数";
const TEXT_DAYS = "日数";
const TEXT_COUNT = "回";
const TEXT_DAY_AMOUNT = "日分";
const TEXT_PRN_AMOUNT = "回分";
const TEXT_ADMINISTRATION = "用法";
const TEXT_PER_DAY = "1日";
const TEXT_PER_ONCE = "1回";
const TEXT_SPLIT = "分";
const TEXT_EXTERNAL = "院外処方";
const TEXT_INTERNAL = "院内処方";
const TEXT_ORAL = "内服";
const TEXT_PRN = "頓服";
const TEXT_TOPICAL = "外用";

// Return boolean value to controle the display of the buttons
const useRp = (bundle) => {
  const [askDose, setaskDose] = useState(false);
  const [inMedicine, setInMedicine] = useState(false);
  const [outMedicine, setOutMedicine] = useState(false);
  const [oral, setOral] = useState(false);
  const [prn, setPrn] = useState(false);
  const [topical, setTopical] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [freqPerDay, setFreqPerDay] = useState("");

  useEffect(() => {
    if (!bundle) {
      return;
    }
    setaskDose(bundle?.askDose ?? false);
    setOral(bundle?.oral ?? false);
    setPrn(bundle?.prn ?? false);
    setTopical(bundle?.topical ?? false);
    setTemporary(bundle?.temporary ?? false);
    setInMedicine(bundle.issuedTo === "internal");
    setOutMedicine(bundle.issuedTo === "external");
    setQuantity(bundle?.quantity ?? "");
    setFreqPerDay(bundle?.freqPerDay ?? "");
  }, [bundle]);

  const ret = [
    askDose,
    inMedicine,
    outMedicine,
    oral,
    prn,
    topical,
    temporary,
    quantity,
    freqPerDay,
  ];
  return ret;
};

// 処方のセットテーブル
const StampTableRp = ({ origin = "tool", maxHeight }) => {
  const [{ myBundle }, localDispatch] = useStampState();
  const [
    askDose,
    inMedicine,
    outMedicine,
    oral,
    prn,
    topical,
    temporary,
    quantity,
    freqPerDay,
  ] = useRp(myBundle);

  const [selectedMed, setSelectedMed] = useState(-1);
  const [selectedInst, setSelectedInst] = useState(-1);

  // 1回の量
  const handleQuantityPerOnce = (row, value) => {
    localDispatch({
      type: "setItemQuantityPerOnce",
      index: row,
      quantityPerOnce: value,
    });
  };

  const handleValidateQuantityPerOnce = (row, value) => {
    localDispatch({
      type: "setItemQuantityPerOnce",
      index: row,
      quantityPerOnce: value,
    });
  };

  // 日の服薬回数
  const handleFreqPerDay = (row, value) => {
    localDispatch({ type: "setBundleFreqPerDay", freqPerDay: value });
  };

  const handleValidateFreqPerDay = (row, value) => {
    localDispatch({ type: "setBundleFreqPerDay", freqPerDay: value });
  };

  // バンドル数量  日分 回数 外用=1
  const handleBundleQuantity = (row, value) => {
    localDispatch({ type: "setBundleQuantity", quantity: value });
  };

  const handleValidateBundleQuantity = (row, value) => {
    localDispatch({ type: "setBundleQuantity", quantity: value });
  };

  // 外用の全数量
  const handleQuantity = (row, value) => {
    localDispatch({ type: "setItemQuantity", index: row, quantity: value });
  };

  const handleValidateQuantity = (row, value) => {
    localDispatch({ type: "setItemQuantity", index: row, quantity: value });
  };

  const handleSelect = (e) => {
    const row = getSelectedRow(e);
    setSelectedMed(row);
    setSelectedInst(-1);
  };

  const getColumnStyle = (row) => {
    return row === selectedMed ? "w3-light-gray" : null; // null -> important
  };

  const handleDelete = () => {
    if (selectedMed !== -1) {
      const item = myBundle.claimItems.filter((x) => x.type === CLAIM_MEDICINE)[
        selectedMed
      ];
      localDispatch({ type: "removeItem", item: item });
      setSelectedMed(-1);
      return;
    }
    if (selectedInst !== -1) {
      const item = myBundle.claimItems.filter(
        (x) => x.type === CLAIM_INSTRUCTION,
      )[selectedInst];
      localDispatch({ type: "removeItem", item: item });
      setSelectedInst(-1);
    }
  };

  const handleInstSelect = (e) => {
    const row = getSelectedRow(e);
    setSelectedInst(row);
    setSelectedMed(-1);
  };

  const getInstColumnStyle = (row) => {
    return row === selectedInst ? "w3-light-gray" : null; // null -> important
  };

  // 内服選択
  const handleOral = (e) => {
    const { name, checked } = e.target;
    if (name === "oral") {
      localDispatch({ type: "setOral", on: checked });
    }
  };

  // 頓服選択
  const handlePRN = (e) => {
    const { name, checked } = e.target;
    if (name === "prn") {
      localDispatch({ type: "setPRN", on: checked });
    }
  };

  // 外用選択
  const handleTopical = (e) => {
    const { name, checked } = e.target;
    if (name === "topical") {
      localDispatch({ type: "setTopical", on: checked });
    }
  };

  // 院内処方
  const handleInternal = (e) => {
    const { name, value } = e.target;
    const on = value === "on";
    if (name === "internal") {
      localDispatch({ type: "setInMedicine", on: on });
    }
  };

  // 院外処方
  const handleExternal = (e) => {
    const { name, value } = e.target;
    const on = value === "on";
    if (name === "external") {
      localDispatch({ type: "setOutMedicine", on: on });
    }
  };

  const renderHeader = () => {
    if (oral || temporary) {
      return (
        <StickyColumn>
          <tr>
            <th>{CODE_TEXT}</th>
            <th>{NAME_TEXT}</th>
            <th>{TEXT_ONE_TIME}</th>
            <th>{TEXT_ONE_DAY}</th>
            <th>{TEXT_DAYS}</th>
            <th>{DISPLAY_TEXT}</th>
          </tr>
        </StickyColumn>
      );
    }
    if (prn) {
      return (
        <StickyColumn>
          <tr>
            <th>{CODE_TEXT}</th>
            <th>{NAME_TEXT}</th>
            <th>{TEXT_ONE_TIME}</th>
            <th>{QUANTITY_TEXT}</th>
            <th>{DISPLAY_TEXT}</th>
          </tr>
        </StickyColumn>
      );
    }
    if (topical) {
      return (
        <StickyColumn>
          <tr>
            <th>{CODE_TEXT}</th>
            <th>{NAME_TEXT}</th>
            <th>{TOTAL_QUANTITY_TEXT}</th>
            <th>{UNIT_TEXT}</th>
          </tr>
        </StickyColumn>
      );
    }
    return null;
  };

  const renderOral = (item, index) => {
    return (
      <tr key={item.code} data-item={index} onClick={handleSelect}>
        <td className={getColumnStyle(index)}>{item.code}</td>
        <td className={getColumnStyle(index)}>{item.name}</td>
        <td className={getColumnStyle(index)}>
          <div className="z3-flex" style={{ "--gap": "4px" }}>
            <NumberInput
              className="w3-pale-red"
              name={index}
              value={item.quantityPerOnce}
              onChange={handleQuantityPerOnce}
              onValidate={handleValidateQuantityPerOnce}
            />
            <span>{item.unit}</span>
          </div>
        </td>
        <td className={getColumnStyle(index)}>
          <div className="z3-flex" style={{ "--gap": "4px" }}>
            <NumberInput
              className={index === 0 ? "w3-pale-red" : null}
              name={index}
              value={freqPerDay}
              onChange={handleFreqPerDay}
              onValidate={handleValidateFreqPerDay}
              disabled={index !== 0}
            />
            <span>{TEXT_COUNT}</span>
          </div>
        </td>
        <td className={getColumnStyle(index)}>
          <div className="z3-flex" style={{ "--gap": "4px" }}>
            <NumberInput
              className={index === 0 ? "w3-pale-red" : null}
              name={index}
              value={quantity}
              onChange={handleBundleQuantity}
              onValidate={handleValidateBundleQuantity}
              disabled={index !== 0}
            />
            <span>{TEXT_DAY_AMOUNT}</span>
          </div>
        </td>
        <td
          className={getColumnStyle(index)}
        >{`${TEXT_PER_DAY}${item.quantity}${item.unit} (${TEXT_SPLIT}${freqPerDay}x${quantity}TD)`}</td>
      </tr>
    );
  };

  const renderPrn = (item, index) => {
    return (
      <tr key={item.code} data-item={index} onClick={handleSelect}>
        <td className={getColumnStyle(index)}>{item.code}</td>
        <td className={getColumnStyle(index)}>{item.name}</td>
        <td className={getColumnStyle(index)}>
          <div className="z3-flex" style={{ "--gap": "4px" }}>
            <NumberInput
              className="w3-pale-red"
              name={index}
              value={item.quantityPerOnce}
              onChange={handleQuantityPerOnce}
              onValidate={handleValidateQuantityPerOnce}
            />
            <span>{item.unit}</span>
          </div>
        </td>
        <td className={getColumnStyle(index)}>
          <div className="z3-flex" style={{ "--gap": "4px" }}>
            <NumberInput
              className="w3-pale-red"
              name={index}
              value={quantity}
              onChange={handleBundleQuantity}
              onValidate={handleValidateBundleQuantity}
            />
            <span>{TEXT_PRN_AMOUNT}</span>
          </div>
        </td>
        <td
          className={getColumnStyle(index)}
        >{`${TEXT_PER_ONCE}${item.quantityPerOnce}${item.unit} (${quantity}P)`}</td>
      </tr>
    );
  };

  const renderTopical = (item, index) => {
    return (
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
    );
  };

  return (
    myBundle && (
      <StampTabl
        origin={origin}
        maxHeight={maxHeight}
        selectedRow={selectedMed}
        onDelete={handleDelete}
      >
        <Layout>
          <OptionsBar>
            <Legend>{LEGEND_1}</Legend>
            <div className="z3-radio-box">
              <input
                className="w3-radio"
                type="radio"
                name="oral"
                id="oral"
                checked={oral}
                onChange={(e) => handleOral(e)}
              />
              <label htmlFor="oral">{TEXT_ORAL}</label>
            </div>
            <div className="z3-radio-box">
              <input
                className="w3-radio"
                type="radio"
                name="prn"
                id="prn"
                checked={prn}
                onChange={(e) => handlePRN(e)}
              />
              <label htmlFor="prn">{TEXT_PRN}</label>
            </div>
            <div className="z3-radio-box">
              <input
                className="w3-radio"
                type="radio"
                name="topical"
                id="topical"
                checked={topical}
                onChange={(e) => handleTopical(e)}
              />
              <label htmlFor="topical">{TEXT_TOPICAL}</label>
            </div>
            <div className="z3-flex-width" style={{ "--w": "192px" }} />
            <div className="z3-radio-box">
              <input
                className="w3-radio"
                type="radio"
                name="external"
                id="external"
                checked={outMedicine}
                onChange={(e) => handleExternal(e)}
              />
              <label htmlFor="external">{TEXT_EXTERNAL}</label>
            </div>
            <div className="z3-radio-box">
              <input
                className="w3-radio"
                type="radio"
                name="internal"
                id="internal"
                checked={inMedicine}
                onChange={(e) => handleInternal(e)}
              />
              <label htmlFor="internal">{TEXT_INTERNAL}</label>
            </div>
          </OptionsBar>
          <FieldSet>
            <Legend>{LEGEND_2}</Legend>
            <table className="w3-table" style={{ cursor: "pointer" }}>
              {renderHeader()}
              <StickyBody>
                {myBundle.claimItems
                  .filter((x) => x.type === CLAIM_MEDICINE)
                  .map((item, index) => {
                    if (oral || temporary) {
                      return renderOral(item, index);
                    }
                    if (prn) {
                      return renderPrn(item, index);
                    }
                    if (topical) {
                      return renderTopical(item, index);
                    }
                    return null;
                  })}
              </StickyBody>
            </table>
          </FieldSet>
          <InstBar>
            <Legend>{LEGEND_3}</Legend>
            <table className="w3-table" style={{ cursor: "pointer" }}>
              <StickyBody>
                {myBundle.claimItems
                  .filter((x) => x.type === CLAIM_INSTRUCTION)
                  .map((item, index) => {
                    return (
                      <tr
                        key={item.code}
                        data-item={index}
                        onClick={handleInstSelect}
                      >
                        <td
                          className={getInstColumnStyle(index)}
                        >{`[${TEXT_ADMINISTRATION}] ${item.name}`}</td>
                      </tr>
                    );
                  })}
              </StickyBody>
            </table>
          </InstBar>
          {askDose && (
            <DoseSelector>
              <FieldSet>
                <Legend>{`${TEXT_ORAL}か${TEXT_PRN}かを選択してください`}</Legend>
                <div className="z3-flex" style={{ "--gap": "32px" }}>
                  <div className="z3-radio-box">
                    <input
                      className="w3-radio"
                      type="radio"
                      name="oral"
                      id="oral"
                      checked={oral}
                      onChange={(e) => handleOral(e)}
                    />
                    <label htmlFor="oral">{TEXT_ORAL}</label>
                  </div>
                  <div className="z3-radio-box">
                    <input
                      className="w3-radio"
                      type="radio"
                      name="prn"
                      id="prn"
                      checked={prn}
                      onChange={(e) => handlePRN(e)}
                    />
                    <label htmlFor="prn">{TEXT_PRN}</label>
                  </div>
                </div>
              </FieldSet>
            </DoseSelector>
          )}
        </Layout>
      </StampTabl>
    )
  );
};

const Layout = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr 1fr;
  row-gap: 16px;
`;

const OptionsBar = styled(FieldSet)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 16px;
`;

const InstBar = styled(FieldSet)``;

const LEGEND_1 = "１．処方の種類を選択してください ";
const LEGEND_2 =
  "２．医薬品をセットにしてください（内服の場合は同一用法でまとめます）";
const LEGEND_3 = "３．用法を選択してください ";

const EnhancedStampTableRp = withDisplayBlock(StampTableRp);
export default EnhancedStampTableRp;
