import styled from "styled-components";
import Capture from "./cmp/Capture";
import QRCScan from "./cmp/QRCScan";
import { useStateValue } from "./reducer/state";

const App = () => {
  const { mode } = useStateValue()[0];

  const handleCapture = () => {};

  const handleScan = () => {};

  return (
    <Wrapper>
      <NavigationBar>
        <button
          className="w3-button"
          onClick={handleCapture}
          disabled={mode === "scan"}
        >
          撮影
        </button>
        <button
          className="w3-button"
          onClick={handleScan}
          disabled={mode === "capture"}
        >
          送信
        </button>
      </NavigationBar>
      <Lobby>
        <Capture show={(mode === "capture").toString()} />
        <QRCScan show={(mode === "scan").toString()} />
      </Lobby>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: black;
`;

const NavigationBar = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 44px;
  display: flex;
  overflow-y: visible;
  z-index: 2;
`;

const Lobby = styled.div`
  position: absolute;
  top: 44px;
  bottom: 0;
  width: 100%;
  overflow-y: scroll;
`;

export default App;
