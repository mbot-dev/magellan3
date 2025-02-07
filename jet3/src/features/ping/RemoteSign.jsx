import { useState } from "react";
import ModalEditorLarge from "../../cmp/ModalEditorLarge";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { SEND_TEXT } from "../../aux/FormUtil";
import {
  GridColumn12,
  GridItem,
  rowAt,
  LABEL_MARGIN,
  THIRD,
  TWO_THIRD,
} from "../../aux/commonStyles";

const VACCINATION_LIST = [
  { name: "COVID-19", code: "covid19" },
  { name: "インフルエンザ", code: "influenza" },
  { name: "肺炎球菌", code: "pneumococcal" },
  { name: "Hib", code: "hib" },
  { name: "狂犬病", code: "rabies" },
  { name: "コレラ", code: "cholera" },
  { name: "日本脳炎", code: "encephalitis" },
  { name: "百日咳", code: "pertussis" },
  { name: "A型肝炎", code: "hepatitisA" },
  { name: "B型肝炎", code: "hepatitisB" },
  { name: "子宮頸癌", code: "papillomavirus" },
];

const RemoteSign = ({ patient, onSubmit, onCancel }) => {
  const [vaccinationCode, setVaccinationCode] = useState("");
  const [isUsed, setUsed] = useState(false);
  const [isHandOver, setHandOver] = useState(false);

  const handleSubmit = () => {
    const vaccination = VACCINATION_LIST.find(
      (x) => x.code === vaccinationCode,
    );
    if (vaccination) {
      onSubmit(vaccination);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleVaccineChange = (item) => {
    setVaccinationCode(item?.code ?? "");
  };

  const handleDocUsed = (e) => {
    setUsed(e.target.checked);
  };

  const handleHandOver = (e) => {
    setHandOver(e.target.checked);
  };

  return (
    <ModalEditorLarge
      id="ping_editor"
      title="リモート署名"
      okText={SEND_TEXT}
      okEnabled={vaccinationCode !== "none" && isUsed && isHandOver}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <GridColumn12 rowGap="16px">
        <GridItem grid={rowAt(1, 1, THIRD)}>
          <span>患者氏名</span>
        </GridItem>
        <GridItem grid={rowAt(1, THIRD + 1, TWO_THIRD)}>
          <span>{patient.fullName}</span>
        </GridItem>

        <GridItem grid={rowAt(2, 1, THIRD)}>
          <span>カナ</span>
        </GridItem>
        <GridItem grid={rowAt(2, THIRD + 1, TWO_THIRD)}>
          <span>{patient.kana}</span>
        </GridItem>

        <GridItem grid={rowAt(3, 1, THIRD)}>
          <span>性別</span>
        </GridItem>
        <GridItem grid={rowAt(3, THIRD + 1, TWO_THIRD)}>
          <span>{patient.gender}</span>
        </GridItem>

        <GridItem grid={rowAt(4, 1, THIRD)}>
          <span>生年月日</span>
        </GridItem>
        <GridItem grid={rowAt(4, THIRD + 1, TWO_THIRD)}>
          <span>{`${patient.dob}（${patient.age}）`}</span>
        </GridItem>

        <GridItem grid={rowAt(5, 1, THIRD)}>
          <span>メールアドレス</span>
        </GridItem>
        <GridItem grid={rowAt(5, THIRD + 1, TWO_THIRD)}>
          <span>{patient.email || "kazushi.minagawa@mac.com"}</span>
        </GridItem>

        <GridItem grid={rowAt(6, 1, THIRD)}>
          <span>ワクチン名</span>
        </GridItem>
        <GridItem grid={rowAt(6, THIRD + 1, TWO_THIRD)}>
          <CustomSelect2
            please={true}
            labelGetter="name"
            valueGetter="code"
            options={VACCINATION_LIST}
            onSelect={handleVaccineChange}
          ></CustomSelect2>
        </GridItem>
        <GridItem grid={rowAt(7, 1, THIRD)}>
          <span>説明文書</span>
        </GridItem>
        <GridItem grid={rowAt(7, THIRD + 1, TWO_THIRD)}>
          <div className="z3-flex" style={{ "--gap": "16px" }}>
            <label>
              <input
                className="w3-check"
                type="checkbox"
                style={LABEL_MARGIN}
                checked={isUsed}
                onChange={handleDocUsed}
              />
              使用した
            </label>
            <label>
              <input
                className="w3-check"
                type="checkbox"
                style={LABEL_MARGIN}
                checked={isHandOver}
                onChange={handleHandOver}
              />
              渡した
            </label>
          </div>
        </GridItem>
      </GridColumn12>
    </ModalEditorLarge>
  );
};

export default RemoteSign;
