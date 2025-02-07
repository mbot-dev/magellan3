import { useEffect } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import {
  ADD_TEXT,
  CLEAR_TEXT,
  CLOSE_TEXT,
  DELETE_TEXT,
} from "../../aux/FormUtil";
import { useStampState } from "../../reducers/stampState";
import SmallButtons from "../../cmp/SmallButtons";

const StampTabl = ({
  origin = "tool",
  maxHeight,
  selectedRow,
  onDelete,
  children,
}) => {
  const dispatch = useStateValue()[1];
  const [{ myBundle, myProduct }, localDispatch] = useStampState();

  useEffect(() => {
    // Submit the bundle array to the store 中継帰納
    if (!myProduct || !Array.isArray(myProduct)) {
      return;
    }
    dispatch({
      type: "submitBundleArray",
      entity: myProduct[0].entity,
      origin: origin,
      array: myProduct,
    });
  }, [myProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    localDispatch({ type: "submit" }); // origin = karte or tool
    handleClear();
  };

  const handleClear = () => {
    localDispatch({ type: "clear" });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleClose = () => {
    dispatch({ type: "toggleStampMaker" });
  };

  return (
    myBundle && (
      <form onSubmit={handleSubmit}>
        <Layout>
          <ScrolContainer style={{ "--max-height": maxHeight }}>
            {children}
          </ScrolContainer>
          <Side>
            <ButtonsContainer>
              <SmallButtons
                cancelText={origin === "karte" ? CLOSE_TEXT : null}
                cancelEnabled={origin === "karte" ? true : false}
                onCancel={origin === "karte" ? handleClose : null}
                optionText={DELETE_TEXT}
                onOption={handleDelete}
                optionEnabled={selectedRow !== -1}
                option2Text={CLEAR_TEXT}
                onOption2={handleClear}
                option2Enabled={myBundle?.claimItems?.length > 0}
                okText={ADD_TEXT}
                okEnabled={myBundle?.isValid}
                onSubmit={handleSubmit}
              />
            </ButtonsContainer>
          </Side>
        </Layout>
      </form>
    )
  );
};

const Layout = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr minmax(80px, 0);
  grid-template-rows: auto;
  align-items: start;
  column-gap: 16px;
  grid-template-areas: "tbl sd";
  overflow: hidden;
`;

// Scrollable container fo table
const ScrolContainer = styled.div`
  grid-area: tbl;
  height: 100%;
  max-height: calc(var(--max-height));
  overflow-y: auto;
`;

const Side = styled.div`
  grid-area: sd;
  padding-top: 40px;
  align-items: center;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  row-gap: 4px;
`;

export default StampTabl;
