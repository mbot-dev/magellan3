import { useState } from "react";
import Room from "../lobby/Room";
import { RECEIPT_MENU_SPEC } from "./receiptSpec";
import DailyReceipt from "./DailyReceipt";
import MonthlyReceipt from "./MonthlyReceipt";
import withDisplayNull from "../../aux/withDisplayNull";

const RoomReceipt = () => {
  const [myChild, setMyChild] = useState(0);

  const handleChild = (i) => {
    setMyChild(i);
  };

  return (
    <Room subMenus={RECEIPT_MENU_SPEC} onChild={handleChild}>
      <DailyReceipt show={(myChild === 0).toString()} />
      <MonthlyReceipt show={(myChild === 1).toString()} />
    </Room>
  );
};

const EnhancedRoomReceipt = withDisplayNull(RoomReceipt);
export default EnhancedRoomReceipt;
