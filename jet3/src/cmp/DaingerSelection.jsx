import { useRef, useEffect } from "react";
import styled from "styled-components";
import { useLockBodyScroll } from "../hook/useLockBodyScroll";
import { useEscKey } from "../hook/useEscKey";
import { CANCEL_TEXT, DELETE_TEXT } from "../aux/FormUtil";
import { GridColumn12, GridItem, rowAt, FULL } from "../aux/commonStyles";
import { useOutsideClick } from "../hook/useOutsideClick";

const DaingerSelection = ({
  messages,
  description = "",
  onDainger,
  onCancel,
  width = "384px",
  daingerText = DELETE_TEXT,
  cancelText = CANCEL_TEXT,
}) => {
  useLockBodyScroll();
  useEscKey(() => onCancel());
  const defaultButton = useRef(undefined);
  const modalContent = useRef(undefined);
  useOutsideClick(modalContent, () => onCancel());

  useEffect(() => {
    if (defaultButton && defaultButton.current) {
      defaultButton.current.focus(); // Cancel button
    }
  }, [defaultButton]);

  const handleCancel = (e) => {
    e.preventDefault();
    onCancel();
  };

  const handleDelete = () => {
    onDainger();
  };

  return (
    <Modal>
      <ModalContent ref={modalContent} style={{ "--w": width }}>
        <form onSubmit={handleCancel}>
          <ContentWrapper>
            <GridItem grid={rowAt(1, 1, FULL)}>
              {messages.map((msg, i) => {
                return <p key={i}>{msg}</p>;
              })}
              {description && <p>{description}</p>}
            </GridItem>

            <GridItem grid={rowAt(2, 1, FULL)}>
              <button
                className="w3-button w3-round w3-block w3-border"
                ref={defaultButton}
                type="submit"
              >
                {cancelText}
              </button>
            </GridItem>

            <GridItem grid={rowAt(3, 1, FULL)}>
              <button
                className="w3-button w3-round w3-block w3-border w3-red"
                type="button"
                onClick={handleDelete}
              >
                {daingerText}
              </button>
            </GridItem>
          </ContentWrapper>
        </form>
      </ModalContent>
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
`;

const ContentWrapper = styled(GridColumn12)`
  grid-template-rows: repeat(3, auto);
  row-gap: 16px;
  padding: 24px 32px;
`;

export default DaingerSelection;
