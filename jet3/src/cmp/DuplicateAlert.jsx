import styled from "styled-components";
import SimpleAlert from "./SimpleAlert";

const DuplicateAlert = ({ messages, description, onAccept }) => {
  return (
    <SimpleAlert onCancel={onAccept}>
      {messages.map((msg, i) => {
        return <p key={i}>{msg}</p>;
      })}
      {description && (
        <DescriptionContent>
          <p>{description}</p>
        </DescriptionContent>
      )}
    </SimpleAlert>
  );
};

const DescriptionContent = styled.div`
  margin: 16px 0 16px 0;
  padding: 0 16px;
`;

export default DuplicateAlert;
