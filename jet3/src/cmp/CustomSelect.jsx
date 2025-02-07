import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BaseButton } from "../aux/commonStyles";
import { MdArrowDropDown } from "react-icons/md";
import { useOutsideClick } from "../hook/useOutsideClick";

const useDropdownStyle = ({ padding, border, round }) => {
  const [className, setClassName] = useState("");

  useEffect(() => {
    const arr = [];
    arr.push(
      padding === "none"
        ? ""
        : padding === "small"
          ? "w3-padding-small"
          : "w3-padding",
    ); // small default large
    arr.push(border === "none" ? "" : "w3-border");
    arr.push(
      border === "none" || round === "none"
        ? ""
        : round === "small"
          ? "w3-round-small"
          : "w3-round",
    );
    setClassName(arr.join(" "));
  }, [padding, border, round]);

  return className;
};

// name: attributes key
const CustomSelect = ({
  startTitle = "",
  name, // attributes key to return
  value,
  onSelect,
  options,
  valueGetter = "value",
  labelGetter = "label",
  padding = "default",
  border = "default",
  round = "default",
  disabled = false,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownStyle = useDropdownStyle({ padding, border, round });
  const ref = useRef(undefined);

  useOutsideClick(ref, () => {
    setOpen(false);
  });

  useEffect(() => {
    if (!options) {
      return;
    }
    if (value !== null && value !== undefined) {
      const index = options.findIndex((op) => op[valueGetter] === value);
      if (index === -1) {
        setSelectedOption(null);
        return;
      }
      setSelectedOption(options[index]);
      return;
    }
  }, [value, options, valueGetter]);

  const toggling = () => {
    setOpen(!isOpen);
  };

  const handleOptionSelected = (e) => {
    setOpen(!isOpen);
    const index = e.currentTarget.getAttribute("data-key");
    const item = options[index];
    setSelectedOption(item);
    if (name) {
      // Call 側で obj[name]=value するため
      onSelect({ name, value: item[valueGetter] });
    } else {
      onSelect(item);
    }
  };

  const renderTitle = () => {
    return (
      <>
        <span>
          {selectedOption
            ? selectedOption[labelGetter]
            : startTitle || "選択してください"}
        </span>
        <MdArrowDropDown size="20px" />
      </>
    );
  };

  return (
    <DropDown>
      <DropdownButton
        type="button"
        className={dropdownStyle}
        onClick={toggling}
        disabled={disabled}
      >
        {renderTitle()}
      </DropdownButton>
      <div ref={ref}>
        <DropdownContent
          className="w3-white w3-card w3-round-small"
          style={{
            "--len": options.length > MAX_ITEMS ? MAX_HEIGHT : "",
            "--overFlowY": options.length > MAX_ITEMS ? "scroll" : "hidden",
            "--disp": isOpen ? "block" : "none",
          }}
        >
          {options.map((op, row) => {
            const key = op?.id ?? row;
            const label = op[labelGetter];
            const separator = label === "-";
            return separator ? (
              <hr key={key} />
            ) : (
              <MenuButton
                key={key}
                type="button"
                className="w-round-small w3-hover-light-gray"
                data-key={row}
                onClick={handleOptionSelected}
              >
                {label}
              </MenuButton>
            );
          })}
        </DropdownContent>
      </div>
    </DropDown>
  );
};

const MAX_ITEMS = 7;
const MAX_HEIGHT = "272px";

const DropDown = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const DropdownButton = styled(BaseButton)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  &focus: {
    outline: 1px solid #333;
  }
`;

const DropdownContent = styled.div`
    display: var(--disp);
    position: absolute;
    padding: 1px;
    z-iondex: 30;
    content-visibility: auto;
    contain-intrinsic-width: auto;
    contain-intrinsic-height: auto;
    max-height: var(--len);                                                                                                                                                                                                                                                                                                                                                                                               ar(--len);
    overflow-y: var(--overFlowY);
`;

const MenuButton = styled(BaseButton)`
  width: 100%;
  text-align: left;
`;

export default CustomSelect;
