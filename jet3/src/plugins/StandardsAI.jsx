import PluginInterface from "./PluginInterface";
import ModalEditorLarge from "../cmp/ModalEditorLarge";
import { useStateValue } from "../reducers/state";
import { currFacility } from "../models/karteCtx";
import { useMargaret } from "../io/MargaretProvider";

const MyUI = ({ start, onStop, onData }) => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();

  const handleGet = async () => {
    const fcId = currFacility(user).id;
    try {
      const results = await margaret.getApi("facility").listNotifications(fcId);
      onData(results);
      onStop();
    } catch (err) {
      dispatch({ type: "setError", error: err });
    }
  };

  const handleCancel = () => {
    onStop();
  };

  return (
    start && (
      <ModalEditorLarge
        id="standards-ai"
        title="施設基準設定"
        cancelText="使用しない"
        onCancel={handleCancel}
        okText="使用する"
        okEnabled={true}
        onSubmit={handleGet}
        width="480px"
      >
        <div>
          <p>AI を使用して施設基準を選択しますか？</p>
        </div>
      </ModalEditorLarge>
    )
  );
};

class StandardsAI extends PluginInterface {
  constructor() {
    super();
    this.plugPoint = "facilityStandards";
  }

  getPlugPoint() {
    return this.plugPoint;
  }

  init() {
    console.log("AI Plugin Facility Standards initialized");
  }

  render(props) {
    return <MyUI {...props} />;
  }
}

export default StandardsAI;
