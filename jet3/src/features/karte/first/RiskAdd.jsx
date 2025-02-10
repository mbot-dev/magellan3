import { useEffect, useReducer } from "react";
import { produce } from "immer";
import hash from "object-hash";
import styled from "styled-components";
import { newRiskContext } from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import { useKarteState } from "../karteState";
import { currFacility } from "../../../models/karteCtx";
import { ADD_TEXT, DONE_TEXT } from "../../../aux/FormUtil";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { KanjiInput } from "../../../cmp/KanjiInput";
import { useMargaret } from "../../../io/MargaretProvider";
import { useAttributes } from "../../../hook/useAttributes";
import CustomSelect2 from "../../../cmp/CustomSelect2";

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
      case "change":
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
      default:
        break;
    }
  });
};

const RiskAddEditor = ({ patient, spec, ...props }) => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const karteDispatch = useKarteState()[1];
  const [{ state, model }, localDispatch] = useReducer(reducer, initilaState);
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
    const m = attrKeys.reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    localDispatch({ type: "init", payload: { model: m, mandatories } });
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

  const handleAdd = () => {
    const asyncPost = async (entity, risk) => {
      try {
        await margaret.getApi("risk").upcertRisk(entity, risk);
        karteDispatch({ type: "upcertRisk", payload: { entity, risk } });
        Promise.resolve().then(() => {
          const next = attrKeys.reduce((acc, key) => {
            acc[key] = "";
            return acc;
          }, {});
          localDispatch({
            type: "init",
            payload: { model: next, mandatories },
          });
        });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facility = currFacility(user);
    const newRisk = {
      ...newRiskContext(facility, user, patient),
      ...JSON.parse(JSON.stringify(model)),
    };
    asyncPost(entity, newRisk);
  };

  const handleClose = () => {
    if (props.onAddCancel) {
      props.onAddCancel();
    }
  };

  return (
    model && (
      <ModalEditorLarge
        id="risk_editor"
        title={spec.title}
        cancelText={DONE_TEXT}
        onCancel={handleClose}
        okText={ADD_TEXT}
        okEnabled={state === "dirty"}
        onSubmit={handleAdd}
      >
        <div className="z3-flex-column" style={{ "--gap": "16px" }}>
          {attributes.map((attr, index) => {
            const { key, label, options, ph } = attr;
            const lbl = attr.isOption ? `${attr.label}${TEXT_OPTION}` : label;
            return (
              <div className="z3-flex" key={index} style={{ width: "100%" }}>
                <ItemName>{lbl}</ItemName>
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
                    style={{ flexGrow: 1 }}
                    onChange={handleTextChange}
                  />
                )}
              </div>
            );
          })}
        </div>
      </ModalEditorLarge>
    )
  );
};

// flex: grow shrink basis
const ItemName = styled.span`
  flex: 0 0 192px;
`;

const TEXT_OPTION = "（オプション）";

export default RiskAddEditor;
