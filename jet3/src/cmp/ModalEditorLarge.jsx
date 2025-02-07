import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useEscKey } from "../hook/useEscKey";
import { useLockBodyScroll } from "../hook/useLockBodyScroll";
import Buttons from "./Buttons";
import { CANCEL_TEXT, OK_TEXT } from "../aux/FormUtil";
import Draggable from "react-draggable";
import CloseButton from "./CloseButton";
import { useStateValue } from "../reducers/state";

const DEFAULT_WIDTH = "512px";

const ModalEditorLarge = ({
  id = null,
  title,
  cancelText = CANCEL_TEXT,
  cancelEnabled = true,
  onCancel,
  optionText = null,
  optionEnabled = false,
  onOption = null,
  okText = OK_TEXT,
  okEnabled = true,
  onSubmit,
  children,
  width = DEFAULT_WIDTH,
}) => {
  const { settings } = useStateValue()[0];
  const [modalPos, setModalPos] = useState(null);
  const dragNode = useRef(null);
  useLockBodyScroll();
  useEscKey(onCancel);

  useEffect(() => {
    if (!id) {
      setModalPos({ x: 0, y: 0 });
      return;
    }
    const pos = window.localStorage.getItem(`${id}_pos`);
    if (!pos) {
      setModalPos({ x: 0, y: 0 });
      return;
    }
    setModalPos(JSON.parse(pos));
  }, [id]);

  const handleStop = (e, data) => {
    const pos = { x: data.x, y: data.y };
    Promise.resolve().then(() => {
      window.localStorage.setItem(`${id}_pos`, JSON.stringify(pos));
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return modalPos ? (
    <Modal>
      <Draggable
        nodeRef={dragNode}
        handle=".mg-handle"
        defaultPosition={modalPos}
        onStop={handleStop}
      >
        <form ref={dragNode} onSubmit={handleSubmit}>
          <ModalContent
            style={{ "--w": width }}
            animate={settings.isAnimate ? "w3-animate-bottom" : ""}
          >
            <Header className="z3-primary">
              <Title>{title}</Title>
              <FlexGrow />
              <CloseButton
                theme="z3-primary"
                disabled={false}
                size={20}
                onClick={onCancel}
              />
            </Header>
            <Main className="w3-border-top z3-background">{children}</Main>
            <Footer className="z3-background">
              <Buttons
                cancelText={cancelText}
                cancelEnabled={cancelEnabled}
                onCancel={onCancel}
                optionText={optionText}
                optionEnabled={optionEnabled}
                onOption={onOption}
                okText={okText}
                okEnabled={okEnabled}
                onOk={null}
                onSubmit={onSubmit}
              />
            </Footer>
          </ModalContent>
        </form>
      </Draggable>
    </Modal>
  ) : null;
};

const HEADER_HEIGHT = "50px";
const FOOTER_HEIGHT = "80px";

const Modal = styled.div.attrs({
  className: "w3-modal w3-show",
})`
  background-color: rgba(0, 0, 0, 0.05) !important;
  z-index: 20 !important;
`;

const ModalContent = styled.div.attrs((props) => ({
  className: `w3-modal-content w3-card w3-round ${props.animate}`,
}))`
  width: var(--w) !important;
  dispay: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  grid-template-areas:
    "header"
    "content"
    "footer";
`;

const Header = styled.div.attrs({
  className: "mg-handle",
})`
  grid-area: header;
  height: ${HEADER_HEIGHT} !important;
  padding: 0 16px 0 32px !important;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
`;

const Title = styled.span`
  font-size: 1rem;
  font-weight: 700;
`;

const Main = styled.div`
  grid-area: content;
  padding: 24px 32px;
`;

const Footer = styled.div`
  grid-area: footer;
  height: ${FOOTER_HEIGHT} !important;
  padding-right: 32px;
  border-radius: 0 0 4px 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  column-gap: 8px;
`;

const FlexGrow = styled.div`
  flex-grow: 1;
`;

export default ModalEditorLarge;
