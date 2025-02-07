import { useEffect, useReducer } from "react";
import { produce } from "immer";
import hash from "object-hash";
import styled from "styled-components";
import { newRiskContext } from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import { useKarteState } from "../karteState";
import { currFacility } from "../../../models/karteCtx";
import { CLOSE_TEXT, getSelectedRow } from "../../../aux/FormUtil";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { GridItem, rowAt } from "../../../aux/commonStyles";
import { KanjiInput } from "../../../cmp/KanjiInput";
import { FirstWrapper } from "./firstStyle";
import { deleteRisk, upcertRisk } from "../../../io/riskIO";
import { useAttributes } from "../../../hook/useAttributes";
import CustomSelect2 from "../../../cmp/CustomSelect2";

const PENDING = "pending";
const SELECTED = "selected";
const EDITING = "editing";
const DIRTY = "dirty";
const TRANSITION = "transition";
const MODAL_WIDTH = "920px";

const initilaState = {
  state: PENDING,
  model: null,
  attrKeys: null,
  mandatories: null,
  selectedRow: -1,
  oldModel: null,
  oldHash: null,
};

const createEmptyModel = (attributes) => {
  return attributes.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});
};

const reducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "init":
        draft.attrKeys = action.payload.attrKeys;
        draft.mandatories = action.payload.mandatories;
        draft.model = createEmptyModel(draft.attrKeys);
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.selectedRow = -1;
        draft.state = PENDING;
        break;
      case "select":
        if (!(draft.state === PENDING || draft.state === SELECTED)) {
          return;
        }
        if (draft.selectedRow !== action.payload) {
          draft.selectedRow = action.payload;
        } else {
          draft.selectedRow = -1;
        }
        draft.state = draft.selectedRow === -1 ? PENDING : SELECTED;
        break;
      case "create":
        draft.model = createEmptyModel(draft.attrKeys);
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.selectedRow = -1;
        draft.state = EDITING;
        break;
      case "update":
        draft.model = action.payload.model;
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.selectedRow = -1;
        draft.state = EDITING;
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
        draft.state = isDirty && isFilled ? DIRTY : EDITING;
        break;
      }
      case "cancel":
        draft.model = createEmptyModel(draft.attrKeys);
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.selectedRow = -1;
        draft.state = PENDING;
        break;
      case "save":
        draft.state = TRANSITION;
        break;
      case "endSave":
        draft.model = createEmptyModel(draft.attrKeys);
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.selectedRow = -1;
        draft.state = PENDING;
        break;
      default:
        break;
    }
  });
};

const EntryBox = ({ patient, spec, riskList, ...props }) => {
  const [{ user }, dispatch] = useStateValue();
  const karteDispatch = useKarteState()[1];
  const [{ state, model, selectedRow }, localDispatch] = useReducer(
    reducer,
    initilaState,
  );
  const [title, entity, attributes, attrKeys, mandatories] =
    useAttributes(spec);

  useEffect(() => {
    if (
      !patient ||
      !user ||
      !title ||
      !entity ||
      !attributes ||
      !attrKeys ||
      !mandatories
    ) {
      return;
    }
    localDispatch({ type: "init", payload: { attrKeys, mandatories } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, user, title, entity, attributes, attrKeys, mandatories]);

  const handleOptionSelect = (item) => {
    const { name, value } = item;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleSave = () => {
    let risk = null;
    if (!model.id) {
      const facility = currFacility(user);
      risk = { ...newRiskContext(facility, user, patient), ...model };
    } else {
      const original = riskList.find((r) => r.id === model.id);
      risk = { ...original, ...model };
    }
    handlePost(entity, risk);
  };

  const handlePost = async (entity, risk) => {
    localDispatch({ type: "save" });
    try {
      await upcertRisk(entity, risk);
      karteDispatch({ type: "upcertRisk", payload: { entity, risk } });
    } catch (err) {
      dispatch({ type: "setError", error: err });
    } finally {
      localDispatch({ type: "endSave" });
    }
  };

  const handleSelect = (e) => {
    localDispatch({ type: "select", payload: getSelectedRow(e) });
  };

  const handleCreate = () => {
    localDispatch({ type: "create" });
  };

  const handleUpdate = () => {
    const selected = riskList[selectedRow];
    const m = attrKeys.reduce((acc, key) => {
      acc[key] = selected[key] ?? "";
      return acc;
    }, {});
    m.id = selected.id;
    localDispatch({ type: "update", payload: { model: m } });
  };

  const handleCancelEdit = () => {
    localDispatch({ type: "cancel" });
  };

  const handleDelete = () => {
    const asyncDelete = async (entity, pk) => {
      localDispatch({ type: "save" });
      try {
        await deleteRisk(entity, pk);
        karteDispatch({ type: "deleteRisk", payload: { entity, pk } });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      } finally {
        localDispatch({ type: "endSave" });
      }
    };
    const toDelete = riskList[selectedRow];
    asyncDelete(entity, toDelete.id);
  };

  const handleClose = () => {
    karteDispatch({ type: "setRiskToEdit", payload: null });
  };

  return (
    model && (
      <ModalEditorLarge
        id="risk_editor"
        title={title}
        cancelText={CLOSE_TEXT}
        onCancel={handleClose}
        onOk={null}
        onSubmit={null}
        width={MODAL_WIDTH}
      >
        <Wrapper>
          <GridItem grid={rowAt(1, 1)}>
            <div
              className="z3-flex-column"
              style={{ "--gap": "16px", "--align": "flex-start" }}
            >
              <div
                className="z3-flex"
                style={{ "--justify": "flex-end", "--gap": "1px" }}
              >
                <button
                  className="w3-button w3-round w3-padding-small"
                  type="button"
                  disabled={!(state === PENDING || state === SELECTED)}
                  onClick={handleCreate}
                >
                  {TEXT_NEW}
                </button>
                <button
                  className="w3-button w3-round w3-padding-small"
                  type="button"
                  disabled={!(state === EDITING || state === DIRTY)}
                  onClick={handleCancelEdit}
                >
                  {TEXT_CANCEL}
                </button>
                <button
                  className="w3-button w3-round w3-padding-small"
                  type="button"
                  disabled={state !== DIRTY}
                  onClick={handleSave}
                >
                  {TEXT_SAVE}
                </button>
              </div>
              {attributes.map((attr, index) => {
                const { key, label, options, ph } = attr;
                const lbl = attr.isOption
                  ? `${attr.label}${TEXT_OPTION}`
                  : label;
                return (
                  <div
                    className="z3-flex-column"
                    key={index}
                    style={{ "--gap": "4px", "--align": "flex-start" }}
                  >
                    <span className="w3-small">{lbl}</span>
                    {options ? (
                      <CustomSelect2
                        name={key}
                        selectedValue={model[key]}
                        options={options}
                        valueGetter="value"
                        labelGetter="label"
                        onSelect={handleOptionSelect}
                      />
                    ) : (
                      <KanjiInput
                        name={key}
                        value={model[key]}
                        placeholder={ph || ""}
                        disabled={!(state === EDITING || state === DIRTY)}
                        onChange={handleTextChange}
                        style={{ width: "256px" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </GridItem>
          <GridItem grid={rowAt(1, 2)}>
            <div
              className="z3-flex-column"
              style={{
                height: "100%",
                "--gap": "4px",
                "--align": "center",
                "--justify": "center",
              }}
            >
              <button
                className="w3-button w3-round w3-padding-small"
                type="button"
                disabled={state !== SELECTED}
                onClick={handleUpdate}
              >
                {TEXT_EDIT}
              </button>
              <button
                className="w3-button w3-round w3-padding-small"
                type="button"
                disabled={state !== SELECTED}
                onClick={handleDelete}
              >
                {TEXT_DELETE}
              </button>
            </div>
          </GridItem>
          <GridItem grid={rowAt(1, 3)}>
            <FirstWrapper length={riskList.length}>
              <thead>
                <tr className="w3-border-top w3-border-bottom">
                  {attributes.map((attr, index) => {
                    return <th key={index}>{attr.label}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {riskList.map((entry, row) => {
                  return (
                    <tr key={entry.id} data-item={row} onClick={handleSelect}>
                      {attributes.map((attr, col) => {
                        return (
                          <td
                            key={row + col}
                            style={
                              selectedRow === row
                                ? {
                                    backGroundColor: "w3-hover-light-gray",
                                    cursor: "pointer",
                                  }
                                : {
                                    backGroundColor: "inherit",
                                    cursor: "pointer",
                                  }
                            }
                          >
                            {entry?.[attr.key] ?? ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </FirstWrapper>
          </GridItem>
        </Wrapper>
      </ModalEditorLarge>
    )
  );
};

const Wrapper = styled.div`
  width: 100% !important;
  display: grid;
  grid-template-columns: 2fr 1fr 4fr;
  grid-te1mplate-rows: auto;
  align-items: start;
`;

const TEXT_NEW = "新規";
const TEXT_EDIT = "編集";
const TEXT_DELETE = "削除";
const TEXT_CANCEL = "取消";
const TEXT_SAVE = "保存";
const TEXT_OPTION = "（オプション）";

export default EntryBox;
