import { useState } from "react";
import styled from "styled-components";
import { useStampState } from "../../reducers/stampState";
import { isEnter } from "../../aux/FormUtil";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { SearchIcon } from "../../cmp/Icons";
import SearchBar from "./SearchBar";

const SINDAN_SENSHI_KBN = { kbn: "D", kbn_no: ["400", "419"] };
const HANDAN_RYO_KBN = { kbn: "D", kbn_no: ["026", "026"] };
const PLACE_HOLDER_SEARCH = "手技、医薬品、器材、区分、コード...";

const SearchBarTest = () => {
  const [{ procedureKbn, additions, numRecords }, localDispatch] =
    useStampState();
  const [procedureClass, setProcedureClass] = useState(null);
  const [isComposing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const clearSearchResult = () => {
    localDispatch({ type: "setSearchResults", results: [] });
  };

  const handleProcedureSelect = (item) => {
    setProcedureClass(null);
    setQuery("");
    if (!item) {
      clearSearchResult();
      return;
    }
    Promise.resolve().then(() => {
      setProcedureClass(item); // invoke useEffect
    });
  };

  const handleSenshi = () => {
    setProcedureClass(null);
    setQuery("");
    Promise.resolve().then(() => {
      const item = SINDAN_SENSHI_KBN;
      setProcedureClass(item);
    });
  };

  const handleSeachHandan = () => {
    setProcedureClass(null);
    setQuery("");
    Promise.resolve().then(() => {
      const item = HANDAN_RYO_KBN;
      setProcedureClass(item);
    });
  };

  const handleQuery = (e) => {
    const { value } = e.target;
    setQuery(value);
  };

  const filterAdditions = () => {
    localDispatch({ type: "filterAdditions" });
  };

  const handleCompositionStart = () => {
    setComposing(true);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
  };

  const handleKeyDown = (e) => {
    if (!isEnter(e) || isComposing) {
      return;
    }
    e.preventDefault();
    setSearch("");
    Promise.resolve().then(() => {
      setSearch(query);
    });
  };

  return (
    <SearchBar
      procedureKbn={procedureKbn}
      search={search}
      procedureClass={procedureClass}
      localDispatch={localDispatch}
    >
      <SearchIcon />
      <SearchInput
        placeholder={PLACE_HOLDER_SEARCH}
        value={query}
        onChange={handleQuery}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <VerticalLine />
      <CustomSelect2
        options={procedureKbn.categories}
        labelGetter="name"
        valueGetter="id"
        title={procedureKbn.menuTitle}
        onSelect={handleProcedureSelect}
        width={CUSTOM_WIDTH}
      />
      <button className="w3-button w3-border w3-round" onClick={handleSenshi}>
        穿刺・採取料
      </button>
      <button
        className="w3-button w3-border w3-round"
        onClick={handleSeachHandan}
      >
        判断料
      </button>
      <button
        className="w3-button w3-border w3-round"
        disabled={additions.length === 0}
        onClick={filterAdditions}
      >
        <span>注加算</span>
      </button>
      <div className="z3-flex-glue" />
      <NumRecords className="z3-text-08rem">{`${numRecords}件`}</NumRecords>
    </SearchBar>
  );
};

const CUSTOM_WIDTH = "160px";

const NumRecords = styled.span`
  flex: 0 0 64px;
  text-align: right;
`;

const SearchInput = styled.input.attrs({
  className: "w3-input",
  type: "text",
})`
  outline: none;
  flex: 0 0 280px;
  border-top: none;
  border-bottom: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
`;

const VerticalLine = styled.div`
  height: 80%;
  border-right: 1px solid var(--border-color);
`;

export default SearchBarTest;
