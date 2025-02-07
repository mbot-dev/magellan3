import { useState } from "react";
import styled from "styled-components";
import { isEnter } from "../../aux/FormUtil";
import { SearchIcon } from "../../cmp/Icons";
import SearchBar from "./SearchBar";

const SearchBarDisease = ({ onSearch, numRecords }) => {
  const [prefix, setPrefix] = useState("");
  const [query, setQuery] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isComposing, setComposing] = useState(false);

  const handlePrefix = (e) => {
    const { value } = e.target;
    setPrefix(value);
  };

  const handleQuery = (e) => {
    const { value } = e.target;
    setQuery(value);
  };

  const handleSuffix = (e) => {
    const { value } = e.target;
    setSuffix(value);
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
    const { name } = e.target;
    if (name === "prefix") {
      onSearch({ mode: name, text: prefix });
    } else if (name === "body") {
      const reg = new RegExp(/^[A-Z]/);
      const test = reg.test(query);
      if (test) {
        onSearch({ mode: "icd10", text: query });
      } else {
        onSearch({ mode: name, text: query });
      }
    } else if (name === "suffix") {
      onSearch({ mode: name, text: suffix });
    }
  };

  return (
    <SearchBar>
      <SearchIcon />
      <SearchInput
        placeholder="傷病名の一部またはICD10（前方一致）"
        name="body"
        value={query}
        onChange={handleQuery}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <SearchInput128
        type="text"
        className="w3-input w3-border-0"
        placeholder="接頭語..."
        name="prefix"
        value={prefix}
        onChange={handlePrefix}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <SearchInput128
        type="text"
        className="w3-input w3-border-0"
        placeholder="接尾後..."
        name="suffix"
        value={suffix}
        onChange={handleSuffix}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <div className="z3-flex-glue" />
      <NumRecords className="w3-small">{`${numRecords}件`}</NumRecords>
    </SearchBar>
  );
};

const NumRecords = styled.span`
  flex: 0 0 64px;
  text-align: right;
`;

const SearchInput = styled.input.attrs({
  className: "w3-input",
  type: "text",
})`
  outline: none;
  flex: 0 0 300px;
  border-top: none;
  border-bottom: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
`;

const SearchInput128 = styled.input`
  flex: 0 0 128px;
`;

export default SearchBarDisease;
