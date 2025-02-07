import { useEffect, useState, useReducer } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { currFacility, listDepartments } from "../../models/karteCtx";
import {
  ADD_TEXT,
  CLEAR_TEXT,
  CLOSE_TEXT,
  CODE_TEXT,
  DELETE_TEXT,
} from "../../aux/FormUtil";
import { getSelectedRow } from "../../aux/FormUtil";
import SmallButtons from "../../cmp/SmallButtons";
import {
  StickyBody,
  StickyColumn,
  FieldSet,
  Legend,
} from "../../aux/commonStyles";
import withDisplayBlock from "../../aux/withDisplayBlock";

const useDeptList = (user) => {
  const [deptList, setDeptList] = useState([]);
  useEffect(() => {
    const facility = currFacility(user);
    setDeptList(listDepartments(facility));
  }, [user]);
  return deptList;
};

const initialState = {
  deptIndex: 0,
  selected: -1,
  list: [],
};

const reducer = (state, action) => {
  let newList = [];

  switch (action.type) {
    case "ADD_DIAGNOSIS": {
      const { toAdd } = action;
      const diag = state.list.find((x) => x.code === toAdd.code);
      if (!diag) {
        newList = [...state.list];
        newList.push(toAdd);
        return {
          ...state,
          list: newList,
          selected: newList.length - 1,
        };
      } else {
        return {
          ...state,
        };
      }
    }
    case "ADD_PREFIX": {
      const { prefix } = action;
      newList = [...state.list];
      const addPrefix = { ...newList[state.selected] };
      addPrefix.code = prefix.code + addPrefix.code;
      addPrefix.name = prefix.name + addPrefix.name;
      newList.splice(state.selected, 1, addPrefix);
      return {
        ...state,
        list: newList,
      };
    }
    case "ADD_SUFFIX": {
      const { suffix } = action;
      newList = [...state.list];
      const addSuffix = { ...newList[state.selected] };
      addSuffix.code = addSuffix.code + suffix.code;
      addSuffix.name = addSuffix.name + suffix.name;
      newList.splice(state.selected, 1, addSuffix);
      return {
        ...state,
        list: newList,
      };
    }
    case "REMOVE_INDEX": {
      const index = action.index;
      newList = [...state.list];
      newList.splice(index, 1);
      let newSelected;
      if (!newList.length) {
        newSelected = -1;
      } else if (newList.length === index) {
        newSelected = newList.length - 1;
      } else {
        newSelected = index;
      }
      return {
        ...state,
        list: newList,
        selected: newSelected,
      };
    }
    case "SET_SELECTED":
      return {
        ...state,
        selected: action.selected,
      };
    case "SET_DEPT_INDEX":
      return {
        ...state,
        deptIndex: action.index,
      };
    case "CLEAR":
      return {
        ...state,
        list: [],
        selected: -1,
        deptIndex: 0,
      };
    default:
      return state;
  }
};

const StampTableDiagnosis = ({ target, onAdd, origin = "tool", maxHeight }) => {
  const [{ user }, dispatch] = useStateValue();
  const deptList = useDeptList(user); // 診療科リスト
  const [{ deptIndex, list, selected }, localDispatch] = useReducer(
    reducer,
    initialState,
  );

  useEffect(() => {
    if (!target) {
      return;
    }
    const { mode, magellan } = target;
    if (mode === "body" || mode === "icd10") {
      localDispatch({ type: "ADD_DIAGNOSIS", toAdd: magellan });
      return;
    }
    if (mode === "prefix" && list.length) {
      localDispatch({ type: "ADD_PREFIX", prefix: magellan });
      return;
    }
    if (mode === "suffix" && list.length) {
      localDispatch({ type: "ADD_SUFFIX", suffix: magellan });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const handleClear = () => {
    localDispatch({ type: "CLEAR" });
  };

  // 親へ
  const handleSubmit = (e) => {
    e.preventDefault();
    const { deptId, deptName } = deptList[deptIndex];
    const dept = {
      deptId,
      deptName,
    };
    const arrayToAdd = list.map((diag) => {
      return { ...diag, ...dept };
    });
    onAdd(arrayToAdd);
    handleClear();
  };

  const handleDelete = () => {
    if (selected === -1) {
      return;
    }
    localDispatch({ type: "REMOVE_INDEX", index: selected });
  };

  const handleRowSelect = (e) => {
    e.preventDefault();
    const row = getSelectedRow(e);
    localDispatch({ type: "SET_SELECTED", selected: row });
  };

  const handleClose = () => {
    dispatch({ type: "toggleStampMaker" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Layout>
        <ScrolContainer style={{ "--max-height": maxHeight }}>
          <Legend>{LEGEND}</Legend>
          <table className="w3-table w3-bordered">
            <StickyColumn>
              <tr>
                <th>{CODE_TEXT}</th>
                <th>{TEXT_DISEASE}</th>
                <th>ICD10</th>
                <th></th>
              </tr>
            </StickyColumn>
            <StickyBody>
              {list.map((diag, index) => {
                const color =
                  index === selected
                    ? { backgroundColor: "#e1e1e1" }
                    : { backgroundColor: "#fff" };
                const { code, name, icd1012, icd1022 } = diag;
                return (
                  <tr
                    key={code}
                    style={color}
                    data-item={index}
                    onClick={handleRowSelect}
                  >
                    <td>{code}</td>
                    <td>{name}</td>
                    <td>{icd1012}</td>
                    <td>{icd1022}</td>
                  </tr>
                );
              })}
            </StickyBody>
          </table>
        </ScrolContainer>
        <Side>
          <ButtonContainer>
            <SmallButtons
              cancelText={origin === "karte" ? CLOSE_TEXT : null}
              cancelEnabled={origin === "karte" ? true : false}
              onCancel={origin === "karte" ? handleClose : null}
              optionText={DELETE_TEXT}
              optionEnabled={selected !== -1}
              onOption={handleDelete}
              option2Text={CLEAR_TEXT}
              option2Enabled={list.length > 0}
              onOption2={handleClear}
              okText={ADD_TEXT}
              okEnabled={list.length > 0}
              onSubmit={handleSubmit}
            />
          </ButtonContainer>
        </Side>
      </Layout>
    </form>
  );
};

const Layout = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr minmax(80px, 0);
  grid-template-rows: auto;
  align-items: start;
  column-gap: 16px;
  row-gap: 16px;
  grid-template-areas: "tbl sd";
  overflow: hidden;
`;

// Scrollable container fo table
const ScrolContainer = styled(FieldSet)`
  grid-area: tbl;
  height: 100%;
  max-height: calc(var(--max-height));
  overflow-y: auto;
`;

const Side = styled.div`
  grid-area: sd;
  padding-top: 40px;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  row-gap: 4px;
`;

const TEXT_DISEASE = "傷病名";
const LEGEND =
  "複数の傷病名を登録できます。修飾語は傷病名を選択した状態でセットします）";

const EnhancedStampTableDiagnosis = withDisplayBlock(StampTableDiagnosis);
export default EnhancedStampTableDiagnosis;
