import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import debounce from "lodash.debounce";
import { useStateValue } from "../../../reducers/state";
import { useOutsideClick } from "../../../hook/useOutsideClick";
import { useEscKey } from "../../../hook/useEscKey";
import { BaseButton } from "../../../aux/commonStyles";
import { normalizeText } from "../../../util/strings";
import { lightenBundle } from "./pManager";
import claimFunc from "../../../models/claimFunc";

const REAL_TIME = true;

const StampSearcher = ({ disabled }) => {
  const [{ stampList }, dispatch] = useStateValue();
  const [query, setQuery] = useState("");
  const [isComposing, setComposing] = useState(false);
  const [matched, setMatched] = useState([]);
  const ref = useRef(null);

  useEscKey(() => {
    setQuery("");
    setMatched([]);
  });

  useOutsideClick(ref, () => {
    setQuery("");
    setMatched([]);
  });

  const debouncedSearch = debounce((word) => {
    const hit = search(word);
    setMatched(hit);
  }, 300);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    let go = query;
    go = go && query.length > 1;
    go = REAL_TIME ? go : !isComposing;
    if (go) {
      const hit = search(query);
      setMatched(hit);
    }
  }, [query, isComposing]);

  const handleSelect = (s, e) => {
    e.preventDefault();
    if (s.entity === "disease") {
      const copy = JSON.parse(JSON.stringify(s));
      const diagBundle = claimFunc["createBundle"]([s.entity, copy]);  // entity = disesease to diagnosis
      const lightened = lightenBundle(diagBundle);
      dispatch(
        { type: "dropStamp", stamp: lightened },
      );
    } else {
      const lightened = lightenBundle(s); // make bundle lightened
      const copy = JSON.parse(JSON.stringify(lightened)); // deep copy why?
      dispatch({ type: "dropStamp", stamp: copy }); 
    }
    setQuery("");
    setMatched([]);
  };

  const search = (text) => {
    const norm = normalizeText(text);
    const arr = [];
    Object.keys(stampList).forEach((key) => {
      const entry = stampList[key];
      entry.forEach((x) => {
        if (x.stampName.includes(norm)) {
          arr.push(x);
        } else if (x.claimItems) {
          const has = x.claimItems.filter((i) => i.name.includes(norm));
          if (has.length > 0) {
            arr.push(x);
          }
        }
      });
    });
    return arr;
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleCompositionStart = () => {
    setComposing(true);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const first = ref.current.querySelector("button");
      if (first) {
        first.focus();
      }
    }
  };

  const handleNavigate = (e) => {
    let index = parseInt(e.currentTarget.getAttribute("data-index"));
    if (e.key === "ArrowDown") {
      index = index < matched.length - 1 ? index + 1 : 0;
    } else if (e.key === "ArrowUp") {
      index = index > 0 ? index - 1 : matched.length - 1;
    }
    ref.current.querySelector(`button[data-index="${index}"]`).focus();
  };

  return (
    <Dropdown>
      <SearchInput
        placeholder="診療行為..."
        disabled={disabled}
        value={query}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
      />
      <DropdownContent
        ref={ref}
        className="w3-white w3-card w3-round-small"
        style={{
          "--len": matched.length > MAX_ITEMS ? MAX_HEIGHT : "",
          "--overFlowY": matched.length > MAX_ITEMS ? "scroll" : "hidden",
          "--disp": matched.length > 0 ? "block" : "none",
        }}
      >
        {matched.map((s, index) => {
          return (
            <MenuButton
              key={s.id}
              type="button"
              className="w3-round-small w3-hover-light-gray"
              data-index={`${index}`}
              onClick={(e) => handleSelect(s, e)}
              onKeyDown={handleNavigate}
            >
              {s.stampName}
            </MenuButton>
          );
        })}
      </DropdownContent>
    </Dropdown>
  );
};

const SearchInput = styled.input.attrs({
  className: "w3-input w3-border w3-round-large w3-padding-small",
  type: "text",
})`
  flex: 0 0 256px;
`;

const MAX_ITEMS = 7;
const MAX_HEIGHT = "272px";

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const DropdownContent = styled.div`
    display: var(--disp);
    position: absolute;
    padding: 4px;
    z-index: 30;
    content-visibility: auto;
    contain-intrinsic-width: auto;
    contain-intrinsic-height: auto;
    max-height: var(--len);                                                                                                                                                                                                                                                                                                                                                                                               ar(--len);
    overflow-y: var(--overFlowY);
`;

// w3-button
const MenuButton = styled(BaseButton)`
  width: 100%;
  text-align: left;
  &:focus {
    outline: 0;
    background-color: #f1f1f1;
  }
`;

export default StampSearcher;
