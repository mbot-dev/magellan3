import { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useOutsideClick } from "../hook/useOutsideClick";
import { BaseButton } from "../aux/commonStyles";
import { MdArrowDropDown } from "react-icons/md";

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

const ClickDropdown = ({
  title,
  options,
  labelGetter = "name",
  onSelect,
  padding = "default",
  border = "default",
  round = "default",
  disabled = false,
}) => {
  const [isOpen, setOpen] = useState(false);
  const dropdownStyle = useDropdownStyle({ padding, border, round });
  const ref = useRef(undefined);

  useOutsideClick(ref, () => {
    setOpen(false);
  });

  const handleClick = () => {
    setOpen(!isOpen);
  };

  const handleMenuSelect = (e) => {
    const index = e.currentTarget.getAttribute("data-key");
    const item = options[index];
    setOpen(!isOpen);
    onSelect(item);
  };

  return (
    <Dropdown>
      <DropdownBtn
        type="button"
        className={dropdownStyle}
        onClick={handleClick}
        disabled={disabled}
      >
        {title}
        <MdArrowDropDown size="20px" />
      </DropdownBtn>
      <div ref={ref}>
        <DropdownContent
          className="w3-white w3-card w3-round-small"
          style={{
            "--len": options.length > MAX_ITEMS ? MAX_HEIGHT : "",
            "--overFlowY": options.length > MAX_ITEMS ? "scroll" : "hidden",
            "--disp": isOpen ? "block" : "none",
          }}
        >
          {options.map((op, index) => {
            const key = op?.id ?? index;
            const label = op[labelGetter];
            const separator = label === "-";
            return separator ? (
              <hr key={key} />
            ) : (
              <MenuButton
                key={key}
                type="button"
                className="w3-round-small w3-hover-light-gray"
                data-key={index}
                onClick={handleMenuSelect}
              >
                {label}
              </MenuButton>
            );
          })}
        </DropdownContent>
      </div>
    </Dropdown>
  );
};

const MAX_ITEMS = 7;
const MAX_HEIGHT = "272px";

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const DropdownBtn = styled(BaseButton)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:focus {
    outline: 1px solid var(--shadow-color);
  }
`;

const DropdownContent = styled.div`
    display: var(--disp);
    position: absolute;
    padding: 1px;
    z-index: 30;
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

export default ClickDropdown;
