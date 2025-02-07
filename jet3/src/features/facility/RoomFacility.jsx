import { useState } from "react";
import withDisplayNull from "../../aux/withDisplayNull";
import FacilityEditor from "./FacilityEditor";
import Hyobo from "./Hyobo";
import UserManagement from "./UserManagement";
import { SUBMENU_SPEC_FACILITY } from "./userSpec";
import Room from "../lobby/Room";
import Standards from "./Standards";
import ProcedureSelection from "../tool/ProcedureSelection";
import InputSelection from "../tool/InputSelection";

const RoomFacility = () => {
  const [myChild, setMyChild] = useState(0);

  const handleChild = (i) => {
    setMyChild(i);
  };

  return (
    <Room subMenus={SUBMENU_SPEC_FACILITY} onChild={handleChild}>
      <FacilityEditor show={(myChild === 0).toString()} />
      <Hyobo show={(myChild === 1).toString()} />
      <ProcedureSelection show={(myChild === 2).toString()} />
      <InputSelection show={(myChild === 3).toString()} />
      <Standards show={(myChild === 4).toString()} />
      <UserManagement show={(myChild === 5).toString()} />
    </Room>
  );
};

const RoomFacilityWithDisplayNull = withDisplayNull(RoomFacility);
export default RoomFacilityWithDisplayNull;
