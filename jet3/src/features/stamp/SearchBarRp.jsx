import { useEffect, useState } from "react";
import styled from "styled-components";
import { useMargaret } from "../../io/MargaretProvider";
import {
  ADMIN_EXT_MEDICINE_MENU,
  ADMIN_IN_MEDICINE_MENU,
} from "../../models/claim";
import { useStampState } from "../../reducers/stampState";
import { useStateValue } from "../../reducers/state";
import { isEnter } from "../../aux/FormUtil";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { SearchIcon } from "../../cmp/Icons";
import SearchBar from "./SearchBar";

const SearchBarRp = () => {
  const margaret = useMargaret();
  const dispatch = useStateValue()[1];
  const [{ procedureKbn, numRecords, myBundle }, localDispatch] =
    useStampState();
  const [oralClass, setOralClass] = useState(null);
  const [topicalClass, setTopicalClass] = useState(null);
  const [isComposing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!oralClass) {
      return;
    }
    const asyncGet = async (oralClass) => {
      const { admin_code, reg, timing_code } = oralClass;
      let data = [];
      try {
        if (reg && !timing_code) {
          data = await margaret
            .getApi("master")
            .findNaihukuByCodeReg(admin_code, reg);
        } else if (!reg && timing_code) {
          data = await margaret
            .getApi("master")
            .findNaihukuByCodeTiming(admin_code, timing_code);
        }
        localDispatch({ type: "setSearchResults", results: data });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet(oralClass);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oralClass]);

  useEffect(() => {
    if (!topicalClass) {
      return;
    }
    const asyncGet = async (topicalClass) => {
      const { admin_code, detail_code } = topicalClass;
      let data = [];
      try {
        if (admin_code && detail_code) {
          data = await margaret
            .getApi("master")
            .findGaiyoByCodeDetail(admin_code, detail_code);
        }
        localDispatch({ type: "setSearchResults", results: data });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet(topicalClass);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicalClass]);

  const clearSearchResult = () => {
    localDispatch({ type: "setSearchResults", results: [] });
  };

  const handleQuery = (e) => {
    const { value } = e.target;
    setQuery(value);
  };

  const handleOralSelect = (item) => {
    setQuery("");
    if (!item) {
      clearSearchResult();
    }
    Promise.resolve().then(() => {
      setOralClass(item);
    });
  };

  const handleTopicalSelect = (item) => {
    setQuery("");
    if (!item) {
      clearSearchResult();
    }
    Promise.resolve().then(() => {
      setTopicalClass(item);
    });
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
      localDispatch={localDispatch}
    >
      <SearchIcon />
      <SearchInput
        placeholder="医薬品名..."
        value={query}
        onChange={handleQuery}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <CustomSelect2
        title={ADMIN_IN_MEDICINE_MENU.menuTitle}
        options={ADMIN_IN_MEDICINE_MENU.categories}
        labelGetter="name"
        valueGetter="id"
        onSelect={handleOralSelect}
        width={CUSTOM_WIDTH}
        disabled={!(myBundle && (myBundle.oral || myBundle.prn))}
      />
      <CustomSelect2
        title={ADMIN_EXT_MEDICINE_MENU.menuTitle}
        options={ADMIN_EXT_MEDICINE_MENU.categories}
        labelGetter="name"
        valueGetter="id"
        onSelect={handleTopicalSelect}
        width="192px"
        disabled={!(myBundle && myBundle.topical)}
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

export default SearchBarRp;
