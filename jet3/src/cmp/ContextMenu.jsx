import { useRef } from "react";
import styled from "styled-components";
import { useOutsideClick } from "../hook/useOutsideClick";
import { BaseButton } from "../aux/commonStyles";

const ContextMenu = ({ clickPoint, menus, onSelect, onCancel }) => {
  const ref = useRef(undefined);

  useOutsideClick(ref, () => {
    onCancel(false);
  });

  const handleSelect = (e) => {
    const index = e.currentTarget.getAttribute("data-key");
    const item = menus[index];
    onSelect(item);
  };

  return (
    <PopContainer
      className="w3-white w3-card w3-round-small"
      ref={ref}
      x={`${clickPoint.x}px`}
      y={`${clickPoint.y}px`}
    >
      {menus.map((item, i) => {
        const { name, destructive, disabled } = item;
        const key = item?.id ?? i;
        const separator = name === "-";
        return separator ? (
          <hr key={key} />
        ) : (
          <MenuButton
            key={key}
            type="button"
            className={
              destructive
                ? "w3-padding-small w3-hover-red"
                : "w3-padding-small w3-hover-light-gray"
            }
            data-key={i}
            onClick={handleSelect}
            disabled={disabled}
          >
            {name}
          </MenuButton>
        );
      })}
    </PopContainer>
  );
};

const PopContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  transform: translateX(min(${(props) => props.x}, calc(100vw - 100%)))
    translateY(min(${(props) => props.y}, calc(100vh - 100%)));
  padding: 1px;
  z-index: 20;
`;

const MenuButton = styled(BaseButton)`
  width: 100%;
  text-align: left;
`;

// https://mionskowski.pl/posts/positioning-a-context-menu-using-pure-css/
// translateX behaves similarly to left and moves an element along the X-axis.
// min takes the smaller of two values
// var(--mouse-x) dereferences a variable, in this case - the mouse position.
// calc performs a calculation
// 100vw is the viewport’s width, or simply put - the page width
// 100% when used inside a translate, yields the current element width
// So, the calc(100vw - 100%) directive returns the page width decreased by the width of the context menu.

export default ContextMenu;

