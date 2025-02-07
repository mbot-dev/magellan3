import { useEffect, useReducer } from "react";
import { produce } from "immer";
import hash from "object-hash";
import styled from "styled-components";
import { MEDICAL_LICENSES } from "../../models/karteCtx";
import { handleKeyDown } from "../../aux/FormUtil";
import { GridItem, rowAt } from "../../aux/commonStyles";
import { KanjiInput } from "../../cmp/KanjiInput";
import { normalizeText } from "../../util/strings";
import { useAttributes } from "../../hook/useAttributes";
import CustomSelect2 from "../../cmp/CustomSelect2";

const initilaState = {
  state: "pending",
  mode: "",
  model: null,
  mandatories: [],
  oldModel: null,
  oldHash: "",
};

const reducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "init":
        draft.mode = action.payload.mode;
        draft.model = action.payload.model;
        draft.mandatories = action.payload.mandatories;
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.state = "editing";
        break;
      case "change": {
        const { name, value } = action.payload;
        draft.model[name] = value;
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

const UserEditor = ({ spec, userToEdit, onDirty, submit, onSubmit }) => {
  const [{ state, mode, model }, localDispatch] = useReducer(
    reducer,
    initilaState,
  );
  const [title, entity, attributes, attrKeys, mandatories] =
    useAttributes(spec);

  useEffect(() => {
    if (!title || !entity || !attributes || !attrKeys || !mandatories) {
      return;
    }
    const mode = userToEdit ? "edit" : "add";
    if (mode === "add") {
      const m = attrKeys.reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
      localDispatch({ type: "init", payload: { mode, model: m, mandatories } });
      return;
    }
    if (mode === "edit") {
      const [sirName, givenName] = userToEdit.fullName.split(" ");
      const [sirNameKana, givenNameKana] = userToEdit.kana.split(" ");
      userToEdit.sirName = sirName;
      userToEdit.givenName = givenName;
      userToEdit.sirNameKana = sirNameKana;
      userToEdit.givenNameKana = givenNameKana;
      const m = attrKeys.reduce((acc, key) => {
        acc[key] = userToEdit[key] || "";
        return acc;
      }, {});
      localDispatch({ type: "init", payload: { mode, model: m, mandatories } });
    }
  }, [title, entity, attributes, attrKeys, mandatories, userToEdit]);

  useEffect(() => {
    onDirty(state === "dirty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!submit) {
      return;
    }
    const newModel = attrKeys.reduce((acc, key) => {
      acc[key] = model[key];
      return acc;
    }, {});
    newModel.fullName = `${model.sirName} ${model.givenName}`;
    newModel.kana = `${model.sirNameKana} ${model.givenNameKana}`;
    onSubmit(JSON.parse(JSON.stringify(newModel)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleKanaChange = (e) => {
    const { name, value } = e.target;
    localDispatch({
      type: "change",
      payload: { name, value: normalizeText(value) },
    });
  };

  const handleOptionChange = (item) => {
    const { name, value } = item;
    if (!value) {
      return;
    }
    localDispatch({ type: "change", payload: { name, value } });
  };

  return (
    model && (
      <ContentGrid>
        <Column1>{attributes[0].label}</Column1>
        <GridItem grid={rowAt(1, 2, 2)}>
          <input
            className="w3-input w3-border w3-round"
            type="email"
            name={attrKeys[0]}
            value={model[attrKeys[0]]}
            disabled={mode === "edit"}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </GridItem>
        <Column1>{attributes[1].label}</Column1>
        <Column2>
          <KanjiInput
            name={attrKeys[1]}
            value={model[attrKeys[1]]}
            onChange={handleTextChange}
          />
        </Column2>
        <Column3>{attributes[2].label}</Column3>
        <Column4>
          <KanjiInput
            name={attrKeys[2]}
            value={model[attrKeys[2]]}
            onChange={handleTextChange}
          />
        </Column4>
        <Column1>{attributes[3].label}</Column1>
        <Column2>
          <KanjiInput
            name={attrKeys[3]}
            value={model[attrKeys[3]]}
            onChange={handleTextChange}
            onBlur={handleKanaChange}
          />
        </Column2>
        <Column3>{attributes[4].label}</Column3>
        <Column4>
          <KanjiInput
            name={attrKeys[4]}
            value={model[attrKeys[4]]}
            onChange={handleTextChange}
            onBulur={handleKanaChange}
          />
        </Column4>
        <Column1>{attributes[5].label}</Column1>
        <Column2>
          <CustomSelect2
            please={true}
            name={attrKeys[5]}
            options={MEDICAL_LICENSES}
            valueGetter="value"
            labelGetter="name"
            onSelect={handleOptionChange}
          />
        </Column2>
        <Column1>{`${attributes[6].label}${TEXT_OPTION}`}</Column1>
        <Column2>
          <input
            className="w3-input w3-border w3-round"
            type="text"
            name={attrKeys[6]}
            value={model[attrKeys[6]]}
            disabled={!model.license || model.license !== "doctor"}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </Column2>
      </ContentGrid>
    )
  );
};

const ContentGrid = styled.div`
  width: 768px;
  display: grid;
  grid-template-columns: 2fr 4fr 2fr 4fr;
  grid-template-rows: auto;
  column-gap: 8px;
  row-gap: 16px;
  align-items: center;
`;

const Column1 = styled.div`
  grid-column: 1;
`;

const Column2 = styled.div`
  grid-column: 2;
`;

const Column3 = styled.div`
  grid-column: 3;
  text-align: right;
`;

const Column4 = styled.div`
  grid-column: 4;
`;

const TEXT_OPTION = "（オプション）";

export default UserEditor;
