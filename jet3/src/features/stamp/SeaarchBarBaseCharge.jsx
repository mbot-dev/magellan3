import { useState } from "react";
import styled from "styled-components";
import { COMMENT_KBN } from "../../models/claim";
import { useStampState } from "../../reducers/stampState";
import CustomSelect2 from "../../cmp/CustomSelect2";
import SearchBar from "./SearchBar";

const SELECT_COMMENT = "コメント選択";

const SearchBarBaseCharge = () => {
  const [{ procedureKbn, additions, numRecords }, localDispatch] =
    useStampState();
  const [procedureClass, setProcedureClass] = useState(null);
  const [commentClass, setCommentClass] = useState(null);

  const clearSearchResult = () => {
    localDispatch({ type: "setSearchResults", results: [] });
  };

  const handleProcedureSelect = (item) => {
    setProcedureClass(null);
    if (!item) {
      clearSearchResult();
      return;
    }
    Promise.resolve().then(() => {
      setProcedureClass(item); // invoke useEffect
    });
  };

  const filterAdditions = () => {
    localDispatch({ type: "filterAdditions" });
  };

  const handleCommentSelect = (item) => {
    setCommentClass(null);
    if (!item) {
      clearSearchResult();
    }
    Promise.resolve().then(() => {
      setCommentClass(item);
    });
  };

  return (
    <SearchBar
      procedureKbn={procedureKbn}
      procedureClass={procedureClass}
      commentClass={commentClass}
      localDispatch={localDispatch}
    >
      <CustomSelect2
        title={procedureKbn.menuTitle}
        options={procedureKbn.categories}
        labelGetter="name"
        valueGetter="id"
        onSelect={handleProcedureSelect}
        width={CUSTOM_WIDTH}
      />
      <button
        className="w3-button w3-border w3-round"
        disabled={additions.length === 0}
        onClick={filterAdditions}
      >
        <span>注加算</span>
      </button>
      <CustomSelect2
        title={SELECT_COMMENT}
        options={COMMENT_KBN.default}
        labelGetter="label"
        valueGetter="id"
        onSelect={handleCommentSelect}
        width={CUSTOM_WIDTH}
      />
      <div className="z3-flex-glue" />
      <NumRecords className="w3-small">{`${numRecords}件`}</NumRecords>
    </SearchBar>
  );
};

const CUSTOM_WIDTH = "160px";

const NumRecords = styled.span`
  flex: 0 0 64px;
  text-align: right;
`;

export default SearchBarBaseCharge;
