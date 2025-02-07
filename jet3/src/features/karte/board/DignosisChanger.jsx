import { useEffect, useReducer } from "react";
import { produce } from "immer";
import styled from "styled-components";
import hash from "object-hash";
import dateFormat from "dateformat";
import { ISO_DATE_TIME } from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import { useAttributes } from "../../../hook/useAttributes";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { SAVE_TEXT } from "../../../aux/FormUtil";
import AllowEmptySelect from "../../../cmp/AllowEmptySelect";
import {
  ENTITY_SPEC_DIAGNOSIS,
  DIAGNOSIS_CATEGORY_OPTIONS,
  DIAGNOSIS_OUTCOME_OPTIONS,
} from "../diagnosis/diagnosisSpec";
import diagFunc from "../diagnosis/diagFunc";

const TITLE_TEXT = "傷病名編集";
const INPUT_DATE_FORMAT = "yyyy-mm-dd";

const initilaState = {
  state: "pending",
  model: null,
  mandatories: [],
  oldModel: null,
  oldHash: "",
};

const reducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "init":
        draft.model = action.payload.model;
        draft.mandatories = action.payload.mandatories;
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.state = "editing";
        break;
      case "change": {
        const { name, value } = action.payload;
        draft.model[name] = value;
        if (name === "outcome") {
          if (value && !draft.model["dateOfRemission"]) {
            draft.model["dateOfRemission"] = dateFormat(
              new Date(),
              INPUT_DATE_FORMAT,
            );
          } else if (!value) {
            draft.model["dateOfRemission"] = "";
          }
        }
        const isDirty = hash(draft.model) !== draft.oldHash;
        const isFilled =
          draft.mandatories.length > 0
            ? draft.mandatories.filter((key) => draft.model[key] !== "")
                .length === draft.mandatories.length
            : true;
        draft.state = isDirty && isFilled ? "dirty" : "editing";
        break;
      }
      default:
        break;
    }
  });
};

const DiagnosisChanger = ({ target, patient }) => {
  const [{ state, model }, localDispatch] = useReducer(reducer, initilaState);
  const [attributes, attrKeys, mandatories] = useAttributes(
    ENTITY_SPEC_DIAGNOSIS,
  ).slice(2);
  const dispatch = useStateValue()[1];

  useEffect(() => {
    if (!target || !attributes || !attrKeys || !mandatories) {
      return;
    }
    const [item] = target.claimItems; // [0]
    const m = attrKeys.reduce((acc, key) => {
      acc[key] = item?.[key] ?? "";
      return acc;
    }, {});
    localDispatch({ type: "init", payload: { model: m, mandatories } });
  }, [target, attributes, attrKeys, mandatories]);

  const handleSubmit = () => {
    const newBundle = { ...target };
    const item = { ...target.claimItems[0], ...model };
    // INPUT_DATE_FORMAT -> ISO_DATE_TIME
    const dr = model.dateOfRemission
      ? dateFormat(model.dateOfRemission, ISO_DATE_TIME)
      : "";
    item.dateOfRemission = dr;
    newBundle.claimItems = [item];
    dispatch({ type: "submitDiagnosisChange", bundle: newBundle, patient: patient }); // reducer close this editor
  };

  const handleCancel = () => {
    dispatch({ type: "setDiagnosisToChange", target: null });
  };

  const stringFromFunc = (attr) => {
    const args = attr.arg.map((key) => model[key]);
    return diagFunc[attr.func](...args);
  };

  const handleRemissionChange = (e) => {
    const d = e.target.value;
    const name = attributes[6].key; //. "dateOfRemission"
    localDispatch({ type: "change", payload: { name: name, value: d } });
  };

  return (
    model && (
      <ModalEditorLarge
        id="diagnosis_changer"
        title={TITLE_TEXT}
        okText={SAVE_TEXT}
        okEnabled={state.isDirty}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      >
        <Content>
          <Label>{attributes[2].label}</Label>
          <Control>{model[attributes[2].key]}</Control>
          <Label>{attributes[3].label}</Label>
          <Control>
            <AllowEmptySelect
              options={DIAGNOSIS_CATEGORY_OPTIONS}
              labelGetter="label"
              valueGetter="value"
              name={attributes[3].key}
              selectedValue={model[attributes[3].key]}
              onSelect={(opt) =>
                localDispatch({
                  type: "change",
                  payload: { name: opt.name, value: opt.value },
                })
              }
            />
          </Control>
          <Label>{attributes[4].label}</Label>
          <Control>
            <AllowEmptySelect
              options={DIAGNOSIS_OUTCOME_OPTIONS}
              labelGetter="label"
              valueGetter="value"
              name={attributes[4].key}
              selectedValue={model[attributes[4].key]}
              onSelect={(opt) =>
                localDispatch({
                  type: "change",
                  payload: { name: opt.name, value: opt.value },
                })
              }
            />
          </Control>
          <Label>{attributes[5].label}</Label>
          <Control>{stringFromFunc(attributes[5])}</Control>
          <Label>{attributes[6].label}</Label>
          <Control>
            <input
              type="date"
              className="w3-input w3-border w3-round"
              value={stringFromFunc(attributes[6])}
              onChange={handleRemissionChange}
              style={{ width: "256px" }}
            />
          </Control>
        </Content>
      </ModalEditorLarge>
    )
  );
};

const Content = styled.div`
  width: 768px;
  display: grid;
  grid-template-columns: [labels] minmax(160px, 0) [controls] 1fr;
  grid-auto-flow: row;
  column-gap: 16px;
  row-gap: 16px;
  align-items: center;
`;

const Label = styled.div`
  grid-column: labels;
  grid-row: auto; /* auto places the element in the next available row */
`;

const Control = styled.div`
  grid-column: controls;
  grid-row: auto;
`;

export default DiagnosisChanger;
