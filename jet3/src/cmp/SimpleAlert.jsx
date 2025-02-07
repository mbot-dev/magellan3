import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useLockBodyScroll } from "../hook/useLockBodyScroll";
import { useEscKey } from "../hook/useEscKey";
import { OK_TEXT } from "../aux/FormUtil";
import { FULL, GridColumn12, GridItem, rowAt } from '../aux/commonStyles';

const SimpleAlert = ({ width = '384px', okText = OK_TEXT, onCancel, children }) => {
  useLockBodyScroll();
  useEscKey(onCancel);
  const defaultButton = useRef(undefined);

  useEffect(() => {
    if (defaultButton && defaultButton.current) {
      defaultButton.current.focus();
    }
  }, [defaultButton]);

  const handleSubmit = e => {
    e.preventDefault();
    onCancel();
  };

  return (
    <Modal>
      <ModalContent style={{ '--w': width }}>
        <form onSubmit={handleSubmit}>
          <ContentWrapper>
            <GridItem grid={rowAt(1, 1, FULL)}>
              {children}
            </GridItem>
            <GridItem grid={rowAt(2, 1, FULL)}>
              <button
                className='w3-button w3-round w3-block z3-primary'
                type='submit'
                ref={defaultButton}
              >
                {okText}
              </button>
            </GridItem>
          </ContentWrapper>
        </form>
      </ModalContent>
    </Modal>
  );
};

const Modal = styled.div.attrs({
  className: 'w3-modal w3-show'
})`
    background-color: rgba(0, 0, 0, 0.05) !important;
    z-index: 20;
`;

const ModalContent = styled.div.attrs({
  className: 'w3-modal-content w3-card w3-round'
})`
    width: var(--w);
`;

const ContentWrapper = styled(GridColumn12)`
    grid-template-rows: repeat(3, auto);
    row-gap: 16px;
    padding: 24px 32px;
`;

export default SimpleAlert;
