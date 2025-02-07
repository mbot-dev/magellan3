import { useEffect, useState, useReducer, useTransition } from "react";
import styled from "styled-components";
import { produce } from "immer";
import hash from "object-hash";
import { useStateValue } from "../../reducers/state";
import { updateFacility } from "../../io/facilityIO";
import { currFacility } from "../../models/karteCtx";
import { CANCEL_SHORT_TEXT, EDIT_TEXT, SAVE_TEXT } from "../../aux/FormUtil";
import { findAddressByZipCode } from "../../io/masterIO";
import { useAttributes } from "../../hook/useAttributes";
import { ENTITY_SPEC_FACILITY } from "./userSpec";
import { TextInput, KanjiInput } from "../../cmp/KanjiInput";
import withDisplayNull from "../../aux/withDisplayNull";

const useOwner = (user) => {
  const [isOwner, setOwner] = useState(false);
  useEffect(() => {
    if (!user) {
      return;
    }
    const fc = currFacility(user);
    setOwner(fc.owner === user.id);
  }, [user]);

  return isOwner;
};

const getZipCode = (zipCode) => {
  if (zipCode && zipCode.length === 8 && zipCode.includes("-")) {
    const [z1, z2] = zipCode.split("-");
    return [z1, z2];
  } else if (zipCode && zipCode.length === 7) {
    const z1 = zipCode.substr(0, 3);
    const z2 = zipCode.substr(3, 4);
    return [z1, z2];
  }
  return ["", ""];
};

const getTelephone = (telephone) => {
  if (telephone && telephone.length >= 10 && telephone.includes("-")) {
    const [t1, t2, t3] = telephone.split("-");
    return [t1, t2, t3];
  }
  return ["", "", ""];
};

const getInsuranceFcCode = (insuranceInstitution) => {
  if (insuranceInstitution && insuranceInstitution.length === 10) {
    const [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10] =
      insuranceInstitution.split("");
    return [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10];
  }
  return ["", "", "1", "", "", "", "", "", "", ""];
};

const initilaState = {
  state: "view",
  model: null,
  mandatories: [],
  oldHash: null,
  oldModel: null,
};

const reducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "init":
        draft.model = action.payload.model;
        draft.mandatories = action.payload.mandatories;
        draft.oldModel = draft.model;
        draft.oldHash = hash(draft.model);
        draft.state = "view";
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
        draft.state = isDirty && isFilled ? "dirty" : "edit";
        break;
      }
      case "changes": {
        const values = action.payload;
        values.forEach((v) => {
          draft.model[v.name] = v.value;
        });
        const isDirty2 = hash(draft.model) !== draft.oldHash;
        const isFilled2 =
          draft.mandatories.length > 0
            ? draft.mandatories.filter((key) => draft.model[key] !== "")
                .length === draft.mandatories.length
            : true;
        draft.state = isDirty2 && isFilled2 ? "dirty" : "edit";
        break;
      }
      case "cancel":
        draft.model = draft.oldModel;
        draft.state = "view";
        break;
      case "edit":
        draft.state = "edit";
        break;
      default:
        break;
    }
  });
};

const FacilityEditor = () => {
  const [{ user }, dispatch] = useStateValue();
  const [{ state, model }, localDispatch] = useReducer(reducer, initilaState);
  const [title, entity, attributes, attrKeys, mandatories] =
    useAttributes(ENTITY_SPEC_FACILITY);
  const [isPending, startTransition] = useTransition();
  const isOwner = useOwner(user);

  useEffect(() => {
    if (
      !user ||
      !title ||
      !entity ||
      !attributes ||
      !attrKeys ||
      !mandatories
    ) {
      return;
    }
    const facility = { ...currFacility(user) };
    console.log(facility.insuranceFacilityCode);
    const [zip1, zip2] = getZipCode(facility?.zipCode ?? "");
    const [tel1, tel2, tel3] = getTelephone(facility?.telephone ?? "");
    const [fax1, fax2, fax3] = getTelephone(facility?.facsimile ?? "");
    const [
      inst1,
      inst2,
      inst3,
      inst4,
      inst5,
      inst6,
      inst7,
      inst8,
      inst9,
      inst10,
    ] = getInsuranceFcCode(facility?.insuranceFacilityCode ?? "");
    facility.zip1 = zip1;
    facility.zip2 = zip2;
    facility.tel1 = tel1;
    facility.tel2 = tel2;
    facility.tel3 = tel3;
    facility.fax1 = fax1;
    facility.fax2 = fax2;
    facility.fax3 = fax3;
    facility.inst1 = inst1;
    facility.inst2 = inst2;
    facility.inst3 = inst3 || "1";
    facility.inst4 = inst4;
    facility.inst5 = inst5;
    facility.inst6 = inst6;
    facility.inst7 = inst7;
    facility.inst8 = inst8;
    facility.inst9 = inst9;
    facility.inst10 = inst10;
    const m = attrKeys.reduce((acc, key) => {
      acc[key] = facility[key] || "";
      return acc;
    }, {});
    localDispatch({ type: "init", payload: { model: m, mandatories } });
  }, [user, title, entity, attributes, attrKeys, mandatories]);

  const handleChangeMode = () => {
    localDispatch({ type: "edit" });
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    localDispatch({ type: "change", payload: { name, value } });
  };

  const handleSearchAddress = () => {
    const asyncSearch = async (zip_code) => {
      try {
        const address = await findAddressByZipCode(zip_code);
        // console.log(JSON.stringify(address, null, 3));
        if (!address || !address.prefecture) {
          return;
        }
        const arr = [];
        arr.push(address.city);
        arr.push(address.town);
        const values = [];
        values.push({ name: "prefecture", value: address.prefecture });
        values.push({ name: "address", value: arr.join("") });
        const [i1, i2] = address.prefecture_code.split("");
        values.push({ name: "inst1", value: i1 });
        values.push({ name: "inst2", value: i2 });
        localDispatch({ type: "changes", payload: values });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const zip_code = `${model.zip1}${model.zip2}`;
    asyncSearch(zip_code);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const facility_id = user.currFc;
    const newModel = { ...model };
    newModel.prefecture_code = `${newModel.inst1}${newModel.inst2}`;
    newModel.zipCode = `${newModel.zip1}-${newModel.zip2}`;
    newModel.telephone = `${newModel.tel1}-${newModel.tel2}-${newModel.tel3}`;
    newModel.facsimile = `${newModel.fax1}-${newModel.fax2}-${newModel.fax3}`;
    newModel.insuranceFacilityCode = `${newModel.inst1}${newModel.inst2}${newModel.inst3}${newModel.inst4}${newModel.inst5}${newModel.inst6}${newModel.inst7}${newModel.inst8}${newModel.inst9}${newModel.inst10}`;
    startTransition(async() => {
      try {
        await updateFacility(facility_id, newModel);
        dispatch({ type: "updateFacility", attributes: newModel });
        localDispatch({
          type: "init",
          payload: { model: newModel, mandatories },
        });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    });
  };

  const handleCancel = () => {
    localDispatch({ type: "cancel" });
  };

  return (
    model && (
      <form onSubmit={handleSubmit}>
        <Layout>
          <Main>
            <Label>{attributes[0].label}</Label>
            <Control>
              <KanjiInput
                name={attrKeys[0]}
                value={model[attrKeys[0]]}
                mode={state}
                onChange={handleTextChange}
                autoFocus={true}
              />
            </Control>
            <Label>{attributes[1].label}</Label>
            <Control>
              <KanjiInput
                mode={state}
                name={attrKeys[1]}
                value={model[attrKeys[1]]}
                onChange={handleTextChange}
              />
            </Control>

            <Label>{attributes[2].label}</Label>
            <Control>
              <KanjiInput
                mode={state}
                name={attrKeys[2]}
                value={model[attrKeys[2]]}
                onChange={handleTextChange}
              />
            </Control>

            <Label>{attributes[3].label}</Label>
            <Control>
              <KanjiInput
                mode={state}
                name={attrKeys[3]}
                value={model[attrKeys[3]]}
                onChange={handleTextChange}
              />
            </Control>

            <Label>{attributes[4].label}</Label>
            <Control>
              {state === "view" && (
                <div
                  className="z3-padding-box"
                  style={{ "--pdd": "8px 8px 8px 8px" }}
                >
                  {model.zip1}-{model.zip2}
                </div>
              )}
              {state !== "view" && (
                <div className="z3-flex" style={{ "--gap": "8px" }}>
                  <TextInput
                    name={attrKeys[4]}
                    value={model[attrKeys[4]]}
                    onChange={handleTextChange}
                    mode={state}
                    style={{ flex: "0 0 96px" }}
                  />
                  <span>-</span>
                  <TextInput
                    name={attrKeys[5]}
                    value={model[attrKeys[5]]}
                    onChange={handleTextChange}
                    mode={state}
                    style={{ flex: "0 0 96px" }}
                  />
                  <button
                    type="button"
                    className="w3-button w3-round w3-border"
                    style={{
                      display: state !== "view" ? "block" : "none",
                      flex: "0 0 auto",
                    }}
                    disabled={!isOwner}
                    onClick={handleSearchAddress}
                  >
                    {TEXT_ADDRESS_SEARCH}
                  </button>
                  <div className="z3-flex-glue" />
                </div>
              )}
            </Control>
            <Label>{attributes[6].label}</Label>
            <Control>
              <KanjiInput
                name={attrKeys[6]}
                value={model[attrKeys[6]]}
                mode={state}
                onChange={handleTextChange}
                style={{ width: "128px" }}
              />
            </Control>
            <Label>{attributes[7].label}</Label>
            <Control>
              <KanjiInput
                name={attrKeys[7]}
                value={model[attrKeys[7]]}
                mode={state}
                onChange={handleTextChange}
              />
            </Control>
            <Label>{attributes[8].label}</Label>
            <Control>
              {state === "view" && (
                <div
                  className="z3-padding-box"
                  style={{ "--pdd": "8px 8px 8px 8px" }}
                >
                  {model.tel1}-{model.tel2}-{model.tel3}
                </div>
              )}
              {state !== "view" && (
                <div className="z3-flex" style={{ "--gap": "8px" }}>
                  <TextInput
                    name={attrKeys[8]}
                    value={model[attrKeys[8]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <span>-</span>
                  <TextInput
                    name={attrKeys[9]}
                    value={model[attrKeys[9]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <span>-</span>
                  <TextInput
                    name={attrKeys[10]}
                    value={model[attrKeys[10]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <div className="z3-flex-glue" />
                </div>
              )}
            </Control>
            <Label>{`${attributes[11].label}${TEXT_OPTION}`}</Label>
            <Control>
              {state === "view" && (
                <div
                  className="z3-padding-box"
                  style={{ "--pdd": "8px 8px 8px 8px" }}
                >
                  {model.fax1}-{model.fax2}-{model.fax3}
                </div>
              )}
              {state !== "view" && (
                <div className="z3-flex" style={{ "--gap": "8px" }}>
                  <TextInput
                    name={attrKeys[11]}
                    value={model[attrKeys[11]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <span>-</span>
                  <TextInput
                    name={attrKeys[12]}
                    value={model[attrKeys[12]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <span>-</span>
                  <TextInput
                    name={attrKeys[13]}
                    value={model[attrKeys[13]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 96px" }}
                  />
                  <div className="z3-flex-glue" />
                </div>
              )}
            </Control>
            <Label>{`${attributes[14].label}${TEXT_OPTION}`}</Label>
            <Control>
              <TextInput
                name={attrKeys[14]}
                value={model[attrKeys[14]]}
                mode={state}
                onChange={handleTextChange}
                style={{ width: "336px" }}
              />
            </Control>
            <Label>{attributes[15].label}</Label>
            <Control>
              {state === "view" && (
                <div
                  className="z3-flex"
                  style={{
                    "--gap": "8px",
                    "--align": "baseline",
                    paddingTop: "8px",
                  }}
                >
                  {model[attrKeys[15]].split("").map((c, i) => {
                    return <span key={i}>{c}</span>;
                  })}
                </div>
              )}
              {state !== "view" && (
                <div className="z3-flex" style={{ "--gap": "8px" }}>
                  <TextInput
                    name={attrKeys[16]}
                    value={model[attrKeys[16]]}
                    mode={state}
                    disabled={true}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[17]}
                    value={model[attrKeys[17]]}
                    mode={state}
                    disabled={true}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[18]}
                    value={model[attrKeys[18]]}
                    mode={state}
                    disabled={true}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[19]}
                    value={model[attrKeys[19]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[20]}
                    value={model[attrKeys[20]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[21]}
                    value={model[attrKeys[21]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[22]}
                    value={model[attrKeys[22]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[23]}
                    value={model[attrKeys[23]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[24]}
                    value={model[attrKeys[24]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                  <TextInput
                    name={attrKeys[25]}
                    value={model[attrKeys[25]]}
                    mode={state}
                    onChange={handleTextChange}
                    style={{ flex: "0 0 32px" }}
                  />
                </div>
              )}
            </Control>
          </Main>
          <Command>
            <div className="z3-flex-column" style={{ "--gap": "4px" }}>
              <button
                type="button"
                className="w3-button w3-border w3-round w3-padding-small"
                disabled={!(isOwner && state === "view")}
                onClick={handleChangeMode}
              >
                {EDIT_TEXT}
              </button>
              <button
                type="button"
                className="w3-button w3-border w3-round w3-padding-small"
                disabled={!(state !== "view")}
                onClick={handleCancel}
              >
                {CANCEL_SHORT_TEXT}
              </button>
              <button
                className="w3-button w3-border w3-round w3-padding-small"
                disabled={state !== "dirty" || isPending}
                onClick={handleSubmit}
              >
                {SAVE_TEXT}
              </button>
            </div>
          </Command>
        </Layout>
      </form>
    )
  );
};

const Layout = styled.div`
  width: 1024px;
  padding: 0 0 0 32px;
  display: grid;
  grid-template-columns: 11fr 1fr;
  grid-template-rows: auto;
  column-gap: 16px;
  grid-template-areas: "main cmd";
`;

const Main = styled.div`
  grid-area: main;
  display: grid;
  grid-template-columns: [labels] minmax(160px, 0) [controls] 1fr;
  grid-auto-flow: row;
  column-gap: 16px;
  row-gap: 16px;
`;

const Label = styled.div`
  grid-column: labels;
  grid-row: auto; /* auto places the element in the next available row */
  padding-top: 8px;
`;

const Control = styled.div`
  grid-column: controls;
  grid-row: auto;
`;

const Command = styled.div`
  grid-area: cmd;
`;

const TEXT_ADDRESS_SEARCH = "住所検索";
const TEXT_OPTION = "（オプション）";

const NamedFacilityEditor = withDisplayNull(FacilityEditor);
export default NamedFacilityEditor;
