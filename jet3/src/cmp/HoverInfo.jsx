import styled from "styled-components";

const HoverInfo = ({ messages, width, children }) => {
  return (
    <DropdownHover>
      {children}
      <DropdownContent style={{ "--w": width }}>
        {messages.map((msg, i) => {
          return (
            <span className="z3-text-08-rem" key={i}>
              {msg}
            </span>
          );
        })}
      </DropdownContent>
    </DropdownHover>
  );
};

const DropdownHover = styled.div.attrs({
  className: "w3-dropdown-hover",
})`
  background-color: inherit !important;
  color: inherit !important;
`;

const DropdownContent = styled.div.attrs({
  className: "w3-dropdown-content w3-bar-block w3-card",
})`
  min-width: var(--w) !important;
  width: var(--w) !important;
  max-width: var(--w) !important;
  padding: 4px 8px !important;
`;

export default HoverInfo;
