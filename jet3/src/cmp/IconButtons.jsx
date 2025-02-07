import styled from "styled-components";
import { BaseButton } from "../aux/commonStyles";
import { FiRotateCw, FiRotateCcw } from "react-icons/fi";
import { MdOutlineMoreHoriz, MdRemove } from "react-icons/md";

export const RedoButton = ({
  onClick,
  disabled = false,
  size = "20px",
  padding = "default",
}) => {
  return (
    <MyStyle
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={
        padding === "small" ? { "--pdd": "4px 8px" } : { "--pd": "8px 16px" }
      }
    >
      <FiRotateCw size={size} />
    </MyStyle>
  );
};

export const UndoButton = ({
  onClick,
  disabled = false,
  size = "20px",
  padding = "default",
}) => {
  return (
    <MyStyle
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={
        padding === "small" ? { "--pdd": "4px 8px" } : { "--pd": "8px 16px" }
      }
    >
      <FiRotateCcw size={size} />
    </MyStyle>
  );
};

export const EditButton = ({
  onClick,
  disabled = false,
  size = "20px",
  padding = "small",
}) => {
  return (
    <MyStyle
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={
        padding === "small"
          ? { "--pd": "4px 8px", "--brd": "2px" }
          : { "--pd": "8px 16px", "--brd": "2px" }
      }
    >
      <MdOutlineMoreHoriz size={size} color="#818181" />
    </MyStyle>
  );
};

export const RemoveButton = ({
  onClick,
  disabled = false,
  size = "18px",
  padding = "small",
}) => {
  return (
    <MyStyle
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={
        padding === "small"
          ? { "--pd": "4px 4px", "--brd": "50%" }
          : { "--pd": "8px 8px", "--brd": "50%" }
      }
    >
      <MdRemove size={size} />
    </MyStyle>
  );
};

// Undo, Redo
export const MyStyle = styled(BaseButton)`
  padding: var(--pd);
  display: flex;
  justify-content: center;
  aligin-items: center;
  border-radius: var(--brd, 0);
`;
