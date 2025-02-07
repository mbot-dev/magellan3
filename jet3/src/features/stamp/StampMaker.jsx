import { useEffect, useState } from "react";
import styled from "styled-components";
import Splitter, { SplitDirection } from "@devbookhq/splitter";
import { useLocalStorage } from "@react-hooks-library/core";
import StampTableDiagnosis from "./StampTableDiagnosis";
import StampTableBaseCharge from "./StampTableBaseCharge";
import StampTableRp from "./StampTableRp";
import StampTableSet from "./StampTableSet";
import StampTableLabTest from "./StampTableLabTest";
import StampTableImage from "./StampTableImage";
import SearchBarDisease from "./SearchBarDisease";
import SearchBarBaseCharge from "./SeaarchBarBaseCharge";
import SearchBarDefault from "./SearchBarDefalt";
import SearchBarRp from "./SearchBarRp";
import SearchBarTreatment from "./SearchBarTreatment";
import SearchBarTest from "./SearchBarTest";
import SearchBarImage from "./SearchBarImage";
import MasterSearchResults from "./MasterSearchResults";
import DiseaseSearchResult from "./DiseaseSerachResult";
import {
  findDeseaseByName,
  findDeseaseModifier,
  findICD10ByCode,
} from "../../io/masterIO";
import { useStampState } from "../../reducers/stampState";
import { useStateValue } from "../../reducers/state";
import claimFunc from "../../models/claimFunc";
import withDisplayBlock from "../../aux/withDisplayBlock";

const SUBS_HEIGHT_IN_TOOL = "20px";
const SUBS_HEIGHT_IN_KARTE = "48px";

const StampMaker = ({ origin }) => {
  const [{ stampEntity, stampToEdit }, dispatch] = useStateValue();
  const [{ myBundle, procedureKbn }, localDispatch] = useStampState();
  //-----------------------------------------
  const [searchMode, setSearchMode] = useState(""); // diagnosis: body prefix suffix
  const [data, setData] = useState([]); // SearchResult diagnosis
  const [target, setTarget] = useState(null); // Selected disease to send table
  //-----------------------------------------
  const [subsHeight, setSubsHeight] = useState(SUBS_HEIGHT_IN_TOOL);
  const [splitSizes, setSplitSizes] = useLocalStorage(
    "stamp_editor_v2",
    [35, 65],
  );
  const [v1, setV1] = useState(0);
  const [v2, setV2] = useState(0);

  useEffect(() => {
    setSubsHeight(
      origin === "karte" ? SUBS_HEIGHT_IN_KARTE : SUBS_HEIGHT_IN_TOOL,
    );
  }, [origin]);

  useEffect(() => {
    if (!splitSizes) {
      return;
    }
    setV1(`((100vh - ${subsHeight}) * ${splitSizes[0]} / 100 - 20px)`); // 20??
    setV2(`((100vh - ${subsHeight}) * ${splitSizes[1]} / 100 - 40px)`);
  }, [splitSizes]);

  // stampEntity: StampBox のタブクリック -> reducer > useStateValue
  useEffect(() => {
    if (!localDispatch || !stampEntity) {
      return;
    }
    if (stampEntity === "input") {
      // dispatch({ type: 'setStampEntity', entity: 'baseCharge' });
      dispatch({ type: "setStampEntity", entity: "input" });
    } else {
      const target = claimFunc["createBundle"]([stampEntity]);
      // stampReducer で myBundle, isBaseCharge, isRpがセットされる
      localDispatch({ type: "setBundle", bundle: target });
    }
  }, [dispatch, localDispatch, stampEntity]);

  // dropStamp -> reducer -> stampToEdit -> setBundle -> myBundle
  useEffect(() => {
    if (!localDispatch || !stampToEdit) {
      return;
    }
    localDispatch({ type: "setBundle", bundle: stampToEdit });
  }, [localDispatch, stampToEdit]);

  const handleResize = (gutterIdx, allSizes) => {
    setSplitSizes(allSizes);
  };

  // 病名検索 -> findDeseaseModifier, findDeseaseByName, findICD10ByCode
  const handleSearch = (search) => {
    if (!search) {
      return;
    }
    const asyncGet = async (mode, text) => {
      let results = [];
      try {
        if (mode === "prefix" || mode === "suffix") {
          results = await findDeseaseModifier(text);
        }
        if (mode === "body") {
          results = await findDeseaseByName(text);
        }
        if (mode === "icd10") {
          results = await findICD10ByCode(text);
        }
        setData(results);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const { mode, text } = search;
    setSearchMode(mode);
    asyncGet(mode, text);
  };

  // マスター検索結果で選択された項目 -> Diagnosis変換
  // DiagnosisMakerTable で編集
  const handleSelect = (item) => {
    const diag = claimFunc["createDiagnosisItem"](item);
    setTarget({ mode: searchMode, magellan: diag });
  };

  // 編集された病名をサブミット -> diagnosisSubmitted へ wrap される
  const handleAdd = (diagList) => {
      const bundles = diagList.map((diag) => {
        return claimFunc["createBundle"](["disease", diag]);
      });
      const data = {
        type: "submitDiagnosisArray",
        entity: bundles[0].entity, // diagnosis...
        origin: origin,
        array: bundles,
      }
      dispatch(data);
  };

  return (
    myBundle && (
      <Layout className="w3-gray">
        <Splitter
          direction={SplitDirection.Vertical}
          initialSizes={[splitSizes[0], splitSizes[1]]}
          onResizeFinished={handleResize}
          gutterClassName={"custom-gutter-vertical"}
          draggerClassName={"custom-dragger-vertical"}
        >
          <TopPane className="z3-karte">
            <StampTableDiagnosis
              show={(procedureKbn.entity === "diagnosis").toString()}
              target={target}
              onAdd={handleAdd}
              origin={origin}
              maxHeight={v1}
            />
            <StampTableBaseCharge
              show={(procedureKbn.entity === "baseCharge").toString()}
              origin={origin}
              maxHeight={v1}
            />
            <StampTableRp
              show={(procedureKbn.entity === "rp").toString()}
              origin={origin}
              maxHeight={v1}
            />
            <StampTableLabTest
              show={(procedureKbn.entity === "labTest").toString()}
              origin={origin}
              maxHeight={v1}
            />
            <StampTableImage
              show={(procedureKbn.entity === "image").toString()}
              origin={origin}
              maxHeight={v1}
            />
            <StampTableSet
              show={(
                procedureKbn.entity !== "diagnosis" &&
                procedureKbn.entity !== "rp" &&
                procedureKbn.entity !== "baseCharge" &&
                procedureKbn.entity !== "labTest" &&
                procedureKbn.entity !== "image"
              ).toString()}
              origin={origin}
              maxHeight={v1}
            />
          </TopPane>
          <BottomPane className="z3-karte">
            <>
              {procedureKbn.entity === "diagnosis" && (
                <SearchBarDisease
                  onSearch={handleSearch}
                  numRecords={data.length}
                />
              )}
              {procedureKbn.entity === "baseCharge" && <SearchBarBaseCharge />}
              {procedureKbn.entity === "management" && <SearchBarDefault />}
              {procedureKbn.entity === "home" && <SearchBarDefault />}
              {procedureKbn.entity === "rp" && <SearchBarRp />}
              {procedureKbn.entity === "injection" && <SearchBarDefault />}
              {procedureKbn.entity === "treatment" && <SearchBarTreatment />}
              {procedureKbn.entity === "surgery" && <SearchBarDefault />}
              {procedureKbn.entity === "labTest" && <SearchBarTest />}
              {procedureKbn.entity === "physiology" && <SearchBarDefault />}
              {procedureKbn.entity === "image" && <SearchBarImage />}
              {procedureKbn.entity === "rehabilitation" && <SearchBarDefault />}
              {procedureKbn.entity === "psychiatric" && <SearchBarDefault />}
              {procedureKbn.entity === "radiotherapy" && <SearchBarDefault />}
              {procedureKbn.entity === "anesthesia" && <SearchBarDefault />}
              {procedureKbn.entity === "pathology" && <SearchBarDefault />}
            </>
            <>
              {procedureKbn.entity === "diagnosis" && (
                <DiseaseSearchResult
                  maxHeight={v2}
                  data={data}
                  onSelect={handleSelect}
                />
              )}
              {procedureKbn !== "diagnosis" && (
                <MasterSearchResults maxHeight={v2} />
              )}
            </>
          </BottomPane>
        </Splitter>
      </Layout>
    )
  );
};

const Layout = styled.div`
  width: 100%;
  height: calc(100vh - 20px);
  max-height: calc(100vh - 20px);
`;

const TopPane = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const BottomPane = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const EnhancedStampMaker = withDisplayBlock(StampMaker);
export default EnhancedStampMaker;
