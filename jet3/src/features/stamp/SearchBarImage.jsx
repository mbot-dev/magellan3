import { useEffect, useState } from "react";
import styled from "styled-components";
import { listContrastMedium } from "../../io/masterIO";
import { COMMENT_KBN } from "../../models/claim";
import { useStampState } from "../../reducers/stampState";
import { useStateValue } from "../../reducers/state";
import { isEnter } from "../../aux/FormUtil";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { SearchIcon } from "../../cmp/Icons";
import SearchBar from "./SearchBar";

const FIND_FILM_TEXT = "画像記録用フィルム";
const PLACE_HOLDER_SEARCH = "手技、医薬品、器材、区分、コード...";

const SearchBarImage = () => {
  const dispatch = useStateValue()[1];
  const [{ procedureKbn, additions, numRecords }, localDispatch] =
    useStampState();
  const [procedureClass, setProcedureClass] = useState(null);
  const [commentClass, setCommentClass] = useState(null);
  const [contrastSerach, setContrastSerach] = useState(false);
  const [isComposing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!contrastSerach) {
      return;
    }
    const asyncGet = async () => {
      try {
        const data = await listContrastMedium();
        localDispatch({ type: "setSearchResults", results: data });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrastSerach]);

  const handleQuery = (e) => {
    const { value } = e.target;
    setQuery(value);
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

  const filterAdditions = () => {
    localDispatch({ type: "filterAdditions" });
  };

  const handleCommentSelect = (item) => {
    setCommentClass(null);
    setQuery("");
    if (!item) {
      clearSearchResult();
    }
    Promise.resolve().then(() => {
      setCommentClass(item);
    });
  };

  const findFilm = () => {
    setQuery("");
    setSearch("");
    Promise.resolve().then(() => {
      setSearch(FIND_FILM_TEXT);
    });
  };

  const handleContrastMedium = () => {
    setContrastSerach(false);
    setQuery("");
    Promise.resolve().then(() => {
      setContrastSerach(true);
    });
  };

  return (
    <SearchBar
      procedureKbn={procedureKbn}
      search={search}
      procedureClass={procedureClass}
      commentClass={commentClass}
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
        width={CUSTOM_WIDTH_WIDE}
      />
      <CustomSelect2
        options={COMMENT_KBN.imagingPart}
        labelGetter="label"
        valueGetter="id"
        title="撮影部位"
        onSelect={handleCommentSelect}
        width={BODY_PART_WIDTH}
      />
      <button className="w3-button w3-border w3-round" onClick={findFilm}>
        <span>フィルム</span>
      </button>
      <button
        className="w3-button w3-border w3-round"
        onClick={handleContrastMedium}
      >
        <span>造影剤</span>
      </button>
      <button
        className="w3-button w3-border w3-round"
        disabled={additions.length === 0}
        onClick={filterAdditions}
      >
        <span>注加算</span>
      </button>
      <div className="z3-flex-glue" />
      <NumRecords className="w3-small">{`${numRecords}件`}</NumRecords>
    </SearchBar>
  );
};

const CUSTOM_WIDTH_WIDE = "256px";
const BODY_PART_WIDTH = "100px";

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

export default SearchBarImage;
