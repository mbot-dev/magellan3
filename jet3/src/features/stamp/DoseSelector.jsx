import styled from "styled-components";

const DoseSelector = ({ width = "384px", children }) => {
  return (
    <Modal>
      <ModalContent style={{ "--w": width }}>{children}</ModalContent>
    </Modal>
  );
};

const Modal = styled.div.attrs({
  className: "w3-modal w3-show",
})`
  background-color: rgba(0, 0, 0, 0.05) !important;
  z-index: 20;
`;

const ModalContent = styled.div.attrs({
  className: "w3-modal-content w3-card w3-round",
})`
  width: var(--w);
  padding: 24px;
`;

export default DoseSelector;
