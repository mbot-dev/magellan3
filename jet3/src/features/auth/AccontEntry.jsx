import { useEffect, useReducer } from "react";
import { produce } from "immer";
import hash from "object-hash";
import { v4 } from "uuid";
import styled from "styled-components";
import { MEDICAL_LICENSES } from "../../models/karteCtx";
import { handleKeyDown } from "../../aux/FormUtil";
import { GridItem, rowAt } from "../../aux/commonStyles";
import { normalizeText } from "../../util/strings";
import DeptSelecter from "../facility/DeptSelecter";
import { useAttributes } from "../../hook/useAttributes";
import { KanjiInput } from "../../cmp/KanjiInput";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { ACCOUNT_SPEC } from "./authSpec";

const initilaState = {
  state: "pending",
  model: null,
  mandatories: [],
  oldModel: null,
  oldHash: "",
  showDeptSelecter: false,
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
      case "change":
        {
          const name = action.payload.name;
          const value = action.payload.value;
          draft.model[name] = value;
          const isDirty = hash(draft.model) !== draft.oldHash;
          const isFilled =
            draft.mandatories.length > 0
              ? draft.mandatories.filter((key) => draft.model[key] !== "")
                  .length === draft.mandatories.length
              : true;
          draft.state = isDirty && isFilled ? "dirty" : "editing";
          if (name === "depts") {
            draft.showDeptSelecter = false;
          }
        }
        break;
      case "toggleDeptSelecter":
        draft.showDeptSelecter = !draft.showDeptSelecter;
        break;
      default:
        break;
    }
  });
};

const AccountEntry = ({ userToEdit, onDirty, submit, onSubmit }) => {
  const [{ state, model, showDeptSelecter }, localDispatch] = useReducer(
    reducer,
    initilaState,
  );
  const [title, entity, attributes, attrKeys, mandatories] =
    useAttributes(ACCOUNT_SPEC);

  useEffect(() => {
    if (
      !userToEdit ||
      !title ||
      !entity ||
      !attributes ||
      !attrKeys ||
      !mandatories
    ) {
      return;
    }
    const m = attrKeys.reduce((acc, key) => {
      acc[key] = userToEdit[key] || "";
      return acc;
    }, {});
    localDispatch({ type: "init", payload: { model: m, mandatories } });
  }, [userToEdit, title, entity, attributes, attrKeys, mandatories]);

  useEffect(() => {
    onDirty(state === "dirty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!submit) {
      return;
    }
    const cp = { ...model };
    const user = createUser(cp);
    const facility = createFacility(cp);
    const depts = createDepts(cp);
    depts.forEach((d) => {
      d.facilityId = facility.id;
    });
    const payload = { user, facility, depts };
    onSubmit(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleSelect = (selected) => {
    const { name, value } = selected;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleKanaChange = (e) => {
    const { name, value } = e.target;
    localDispatch({
      type: "change",
      payload: { name, value: normalizeText(value) },
    });
    // localDispatch({ type: 'change', payload: { name, value: value } });
  };

  const handleShowDeptSelecter = () => {
    localDispatch({ type: "toggleDeptSelecter" });
  };

  const handleCancelDepts = () => {
    localDispatch({ type: "toggleDeptSelecter" });
  };

  const handleChangeDepts = (newDepts) => {
    localDispatch({
      type: "change",
      payload: { name: "depts", value: newDepts },
    });
  };

  const createUser = (model) => {
    return {
      id: v4(),
      username: model.username,
      fullName: `${model.sirName} ${model.givenName}`,
      kana: `${model.sirNameKana} ${model.givenNameKana}`,
      license: model.license,
      userRole: "admin",
    };
  };

  const createFacility = (model) => {
    return {
      id: v4(),
      name: model.facilityName,
    };
  };

  const createDepts = (model) => {
    return model.depts.map((d) => {
      return {
        id: v4(),
        name: d.name,
        code: d.code,
      };
    });
  };

  return (
    model && (
      <ContentGrid>
        <GridItem grid={rowAt(1, 1)}>{attributes[0].label}</GridItem>
        <GridItem grid={rowAt(1, 2, 2)}>
          <input
            className="w3-input w3-border w3-round"
            type="email"
            name={attrKeys[0]}
            value={model[attrKeys[0]]}
            disabled={true}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </GridItem>
        <GridItem grid={rowAt(2, 1)}>{attributes[1].label}</GridItem>
        <GridItem grid={rowAt(2, 2)}>
          <KanjiInput
            name={attrKeys[1]}
            value={model[attrKeys[1]]}
            autoFocus={true}
            onChange={handleChange}
          />
        </GridItem>
        <GridItem grid={rowAt(2, 3)}>
          <div className="z3-flex" style={{ "--justify": "center" }}>
            {attributes[2].label}
          </div>
        </GridItem>
        <GridItem grid={rowAt(2, 4)}>
          <KanjiInput
            name={attrKeys[2]}
            value={model[attrKeys[2]]}
            onChange={handleChange}
          />
        </GridItem>
        <GridItem grid={rowAt(3, 1)}>{attributes[3].label}</GridItem>
        <GridItem grid={rowAt(3, 2)}>
          <KanjiInput
            name={attrKeys[3]}
            value={model[attrKeys[3]]}
            onChange={handleChange}
            onBlur={handleKanaChange}
          />
        </GridItem>
        <GridItem grid={rowAt(3, 3)}>
          <div className="z3-flex" style={{ "--justify": "center" }}>
            {attributes[4].label}
          </div>
        </GridItem>
        <GridItem grid={rowAt(3, 4)}>
          <KanjiInput
            name={attrKeys[4]}
            value={model[attrKeys[4]]}
            onChange={handleChange}
            onBlur={handleKanaChange}
          />
        </GridItem>
        <GridItem grid={rowAt(4, 1)}>{attributes[5].label}</GridItem>
        <GridItem grid={rowAt(4, 2)}>
          <CustomSelect2
            name={attrKeys[5]}
            value={model[attrKeys[5]]}
            options={MEDICAL_LICENSES}
            labelGetter="name"
            valueGetter="value"
            onSelect={handleSelect}
          />
        </GridItem>
        <GridItem grid={rowAt(5, 1)}>{attributes[6].label}</GridItem>
        <GridItem grid={rowAt(5, 2, 3)}>
          <KanjiInput
            name={attrKeys[6]}
            value={model[attrKeys[6]]}
            onChange={handleChange}
          />
        </GridItem>
        <GridItem grid={rowAt(6, 1)}>{attributes[7].label}</GridItem>
        <GridItem grid={rowAt(6, 2, 2)}>
          {model.depts.length > 0 && (
            <div className="z3-flex" style={{ "--gap": "16px" }}>
              {model.depts.map((d, i) => {
                return (
                  <div key={i} style={{ flex: "0 0 auto" }}>
                    <span>{d.name}</span>
                  </div>
                );
              })}
            </div>
          )}
          {model.depts.length === 0 && <p>{TEXT_SELECT_MESSAGE}</p>}
        </GridItem>
        <GridItem grid={rowAt(6, 4)}>
          <button
            className="w3-button w3-round w3-padding-small"
            onClick={handleShowDeptSelecter}
          >
            {TEXT_SELECT_DEPT}
          </button>
        </GridItem>
        {showDeptSelecter && (
          <DeptSelecter
            depts={model.depts}
            onCancel={handleCancelDepts}
            onSave={handleChangeDepts}
          />
        )}
      </ContentGrid>
    )
  );
};

const ContentGrid = styled.div`
  width: 768px;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 2fr;
  grid-template-rows: auto;
  column-gap: 8px;
  row-gap: 16px;
  align-items: center;
`;

const TEXT_SELECT_DEPT = "診療科選択";
const TEXT_SELECT_MESSAGE = "右のボタンをクリックし診療科を選択してください";

export default AccountEntry;
