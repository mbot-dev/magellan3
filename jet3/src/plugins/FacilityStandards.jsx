import { useContext } from "react";
import PluginInterface from "./PluginInterface";
import { PluginContext } from "./PluginContext";
import ModalEditorLarge from "../cmp/ModalEditorLarge";

const MyUI = () => {
  const [{ execute }, dispatch] = useContext(PluginContext);

  const handleCancel = () => {
    dispatch({ type: "stop" });
  };

  return execute && (
      <ModalEditorLarge
        id="facility-standards"
        title="施設基準設定"
        cancelText="使用しない"
        onCancel={handleCancel}
        okText="使用する"
        okEnabled={true}
        onSubmit={handleCancel}
        width="480px"
      >
        <div>
          <p>生成 AI を使用して施設基準を選択しますか？</p>
        </div>
      </ModalEditorLarge>
    );
};

class FacilityStandards extends PluginInterface {
  constructor() {
    super();
    this.name = "facility_standards";
  }

  getName() {
    return this.name;
  }

  init() {
    console.log("Plugin facility_standards initialized");
  }

  render() {
    return <MyUI />;
  }
}

export default FacilityStandards;
