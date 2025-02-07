import { useRef, useState } from "react";
import styled from "styled-components";
import { useOutsideClick } from "../hook/useOutsideClick";
import { BaseButton } from "../aux/commonStyles";
import { FiMoreHorizontal } from "react-icons/fi";

const MoreHorizClick = ({
  menus,
  onSelect,
  right = true,
  disabled = false,
  sourceIndex,
}) => {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef(undefined);

  useOutsideClick(ref, () => {
    setOpen(false);
  });

  const handleClick = () => {
    setOpen(!isOpen);
  };

  const handleMenuSelect = (e) => {
    const i = e.currentTarget.getAttribute("data-key");
    const item = menus[i];
    setOpen(!isOpen);
    if (sourceIndex !== undefined) {
      onSelect(item.action, sourceIndex);
      return;
    }
    onSelect(item.action);
  };

  return (
    <Dropdown>
      <DropdownBtn
        type="button"
        className="w3-padding-small"
        onClick={handleClick}
        disabled={disabled}
      >
        <FiMoreHorizontal size={ICON_SIZE} />
      </DropdownBtn>
      <div ref={ref}>
        <DropdownContent
          className="w3-white w3-card w3-round-small"
          style={{
            "--len": menus.length,
            "--disp": isOpen ? "block" : "none",
            "--r": right ? "0" : "auto",
          }}
        >
          {menus.map((item, i) => {
            const { name } = item;
            const key = item?.id ?? i;
            return name.startsWith("-") ? (
              <hr key={key} />
            ) : (
              <MenuButton
                key={key}
                type="button"
                className={
                  item.destructive
                    ? "w3-white w3-padding-small w3-round-small w3-hover-red"
                    : "w3-white w3-padding-small w3-round-small w3-hover-light-gray"
                }
                data-key={i}
                onClick={handleMenuSelect}
                disabled={item?.disabled}
              >
                {name}
              </MenuButton>
            );
          })}
        </DropdownContent>
      </div>
    </Dropdown>
  );
};

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const DropdownBtn = styled(BaseButton)`
  display: flex;
  align-items: center;
`;

const DropdownContent = styled.div`
  display: var(--disp);
  position: absolute;
  padding: 2px;
  z-index: 30;
  right: var(--r);
  contain-intrinsic-width: auto;
  contain-intrinsic-height: auto;
`;

const MenuButton = styled(BaseButton)`
  width: 100%;
  text-align: left;
`;

const ICON_SIZE = "20px";

export default MoreHorizClick;
