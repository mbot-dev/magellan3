import { useState } from "react";
import withDisplayNull from "../../aux/withDisplayNull";
import PatientVisit from "./PatientVisit";
import PatientSearch from "./PatientSearch";
import { PATIENT_MENU_SPEC } from "./pvtSpec";
import Room from "../lobby/Room";

const RoomPatient = () => {
  const [myChild, setMyChild] = useState(0);

  const handleChild = (i) => {
    setMyChild(i);
  };

  return (
    <Room subMenus={PATIENT_MENU_SPEC} onChild={handleChild}>
      <PatientVisit show={(myChild === 0).toString()} />
      <PatientSearch show={(myChild === 1).toString()} />
    </Room>
  );
};

const RoomPatientWithDisplayNull = withDisplayNull(RoomPatient);
export default RoomPatientWithDisplayNull;
