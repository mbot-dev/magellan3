import { useEffect, useState } from "react";
import styled from "styled-components";
import { EMPTY_NEW, APPLY_RP, WHOLE_COPY } from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import { CREATE_TEXT } from "../../../aux/FormUtil";
import { GridColumn12, GridItem, rowAt } from "../../../aux/commonStyles";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import CustomSelect2 from "../../../cmp/CustomSelect2";

// 新規カルテ作成ダイアログ
const NewKarteDialog = ({
  empty,
  activeEmpty,
  newKarteParams,
  onSelect,
  onCancel,
}) => {
  const [isClerk, setClerk] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [dept, setDept] = useState(null);
  const [his, setHis] = useState(null);

  const { karteCreationMode } = useStateValue()[0];
  const [selected, setSelected] = useState(-1);
  const [importActive, setImportActive] = useState(false);

  useEffect(() => {
    setSelected(empty ? 0 : karteCreationMode);
    setImportActive(!activeEmpty);
  }, [empty, karteCreationMode, activeEmpty]);

  useEffect(() => {
    if (!newKarteParams) {
      return;
    }
    const {
      doctors,
      selectedDoctor, // index
      isClerk,
      depts,
      selectedDept, // index
      insurances,
      selectedInsurance, // index
    } = newKarteParams;
    setDoctor(doctors[selectedDoctor]);
    setDept(depts[selectedDept]);
    setHis(insurances[selectedInsurance]);
    setClerk(isClerk);
  }, [newKarteParams]);

  const handleSubmit = () => {
    let mode;
    switch (selected) {
      case 0:
        mode = EMPTY_NEW;
        break;
      case 1:
        mode = APPLY_RP;
        break;
      case 2:
        mode = WHOLE_COPY;
        break;
      default:
        mode = null;
    }
    const params = {
      mode,
      importActive,
      selectedDoctor: doctor,
      selectedDept: dept,
      selectedHis: his,
      isClerk,
    };
    onSelect(params);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleChange = (e) => {
    setSelected(Number(e.target.value));
  };

  const handleDoctorChange = (item) => {
    if (!item) {
      return;
    }
    setDoctor(item);
  };

  const handleDeptChange = (item) => {
    if (!item) {
      return;
    }
    setDept(item);
  };

  const handleHisChange = (item) => {
    if (!item) {
      return;
    }
    setHis(item);
  };

  const handleOptionChange = (e) => {
    const { target } = e;
    const { name, checked } = target;
    if (name === "importDiagnosis") {
      setImportActive(checked);
    }
  };

  const renderOptions = () => {
    return (
      <div className="z3-flex" style={{ "--gap": "16px" }}>
        <div className="z3-radio-box">
          <input
            className="w3-radio"
            type="radio"
            id="empty"
            value="0"
            checked={selected === 0}
            onChange={handleChange}
          />
          <label htmlFor="empty">{TEXT_EMPTY}</label>
        </div>
        <div className="z3-radio-box">
          <input
            className="w3-radio"
            type="radio"
            id="applyRp"
            value="1"
            checked={selected === 1}
            disabled={empty}
            onChange={handleChange}
          />
          <label htmlFor="applyRp">{TEXT_APPLY_RP}</label>
        </div>
        <div className="z3-radio-box">
          <input
            className="w3-radio"
            type="radio"
            id="wholeCopy"
            value="2"
            checked={selected === 2}
            disabled={empty}
            onChange={handleChange}
          />
          <label htmlFor="wholeCopy">{TEXT_WHOLE_COPY}</label>
        </div>
      </div>
    );
  };

  const renderImportDiagnosis = () => {
    return (
      <div className="z3-radio-box">
        <input
          className="w3-check"
          type="checkbox"
          name="importDiagnosis"
          id="importDiagnosis"
          checked={importActive}
          disabled={activeEmpty}
          onChange={handleOptionChange}
        />
        <label htmlFor="importDiagnosis">
          {TEXT_IMPORT_CONTINUED_DIAGNOSIS}
        </label>
      </div>
    );
  };

  const renderPhysician = () => {
    const { doctors } = newKarteParams;
    return (
      <div className="z3-flex">
        <SelectLabel>{TEXT_PHYSICIAN}</SelectLabel>
        <CustomSelect2
          options={doctors}
          labelGetter="fullName"
          valueGetter="username"
          selectedValue={doctor["username"]}
          onSelect={handleDoctorChange}
        />
      </div>
    );
  };

  const renderDept = () => {
    const { depts } = newKarteParams;
    return (
      <div className="z3-flex">
        <SelectLabel>{TEXT_DEPT}</SelectLabel>
        <CustomSelect2
          options={depts}
          labelGetter="deptName"
          valueGetter="deptId"
          selectedValue={dept["deptId"]}
          onSelect={handleDeptChange}
        />
      </div>
    );
  };

  const renderInsurance = () => {
    const { insurances } = newKarteParams;
    return (
      <div className="z3-flex">
        <SelectLabel>{TEXT_INSURANCE}</SelectLabel>
        <CustomSelect2
          options={insurances}
          labelGetter="insurerName" // OQS
          valueGetter="id"
          selectedValue={his["id"]}
          onSelect={handleHisChange}
        />
      </div>
    );
  };

  return (
    <ModalEditorLarge
      id="new_karte"
      title={TITLE}
      okText={CREATE_TEXT}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      width="580px"
    >
      <GridColumn12 rowGap="16px">
        <GridItem grid={rowAt(1, 1, 12)}>{renderOptions()}</GridItem>
        <GridItem grid={rowAt(2, 1, 12)}>{renderImportDiagnosis()}</GridItem>
        {isClerk && (
          <GridItem grid={rowAt(3, 1, 12)}>{renderPhysician()}</GridItem>
        )}
        <GridItem grid={rowAt(isClerk ? 4 : 3, 1, 12)}>
          {dept && renderDept()}
        </GridItem>
        <GridItem grid={rowAt(isClerk ? 5 : 4, 1, 12)}>
          {his && renderInsurance()}
        </GridItem>
      </GridColumn12>
    </ModalEditorLarge>
  );
};

const SelectLabel = styled.span`
  flex: 0 0 96px;
  margin-right: 8px;
`;

const TITLE = "新規カルテ作成";
const TEXT_EMPTY = "空白の新規カルテ";
const TEXT_APPLY_RP = "Do 処方を適用";
const TEXT_WHOLE_COPY = "前回カルテを全てコピー";
const TEXT_IMPORT_CONTINUED_DIAGNOSIS = "継続疾患を取り込む";
const TEXT_PHYSICIAN = "担当医:";
const TEXT_DEPT = "診療科:";
const TEXT_INSURANCE = "健康保険:";

export default NewKarteDialog;
