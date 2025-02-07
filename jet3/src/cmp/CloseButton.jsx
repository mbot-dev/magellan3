import React from "react";
import { MdOutlineClear } from "react-icons/md";
import styled from "styled-components";
import { BaseButton } from "../aux/commonStyles";

const CloseButton = ({ theme, disabled, onClick, size = "14px" }) => {
  return (
    <MyStyle
      type="button"
      className={theme ? { theme } : "z3-background"}
      disabled={disabled}
      onClick={onClick}
    >
      <MdOutlineClear size={size} />
    </MyStyle>
  );
};

const MyStyle = styled(BaseButton)`
  padding: 4px;
  display: flex;
  justify-content: center;
  aligin-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
`;

export default CloseButton;

