import { useEffect, useState } from "react";
import { useStateValue } from "../../reducers/state";
import withDisplayNull from "../../aux/withDisplayNull";
import ProcedureSelection from "./ProcedureSelection";
import InputSelection from "./InputSelection";
import { TOOL_SUB_MENU_SPEC } from "./toolSpec";
import Room from "../lobby/Room";

// Procedure Editor Room
const RoomTool = () => {
  const [{ stampEntity }, dispatch] = useStateValue();
  const [myChild, setMyChild] = useState(0);

  useEffect(() => {
    if (!dispatch || !stampEntity) {
      return;
    }
    if (stampEntity === "input") {
      dispatch({ type: "setStampEntity", entity: "input" });
      setMyChild(1);
    }
  }, [dispatch, stampEntity]);

  const handleChild = (i) => {
    setMyChild(i);
    if (i === 1) {
      dispatch({ type: "setStampEntity", entity: "input" });
    }
  };

  return (
    <Room subMenus={TOOL_SUB_MENU_SPEC} onChild={handleChild}>
      <InputSelection show={(myChild === 0).toString()} />
      <ProcedureSelection show={(myChild === 1).toStrring()} />
    </Room>
  );
};

const EnhancedRoomTool = withDisplayNull(RoomTool);
export default EnhancedRoomTool;
