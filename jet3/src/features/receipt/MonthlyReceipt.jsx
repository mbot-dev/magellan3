import { useState } from "react";
import withDisplayNull from "../../aux/withDisplayNull";
import { useStateValue } from "../../reducers/state";
import { currFacility, ISO_DATE_TIME } from "../../models/karteCtx";
import dateFormat from "dateformat";
import { kickMonthlyReceipt } from "../../io/karteIO";

const MonthlyReceipt = () => {
    const { user } = useStateValue()[0];
    const [waiting, setWaiting] = useState(false);
    // const [data, setData] = useState([]);

    const handleKick = async () => {
        const facility_id = currFacility(user).id;
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        await kickMonthlyReceipt(facility_id, dateFormat(firstDay, ISO_DATE_TIME), dateFormat(lastDay, ISO_DATE_TIME));
        setWaiting(true);
    };

    return (
        <div className="z3-flex" style={{'--gap': '16px'}}>
            <button className="w3-button w3-round w3-border" disable={waiting} onClick={() => handleKick()}>レセプト作成</button>
            <span>{waiting ? '処理中...' : ''}</span>
        </div>
    );
};

const EnhancedMonthlyReceipt = withDisplayNull(MonthlyReceipt);
export default EnhancedMonthlyReceipt;