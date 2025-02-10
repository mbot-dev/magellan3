import { useState } from "react";
import { v4 } from "uuid";
import styled from "styled-components";
import withDisplayNull from "../../aux/withDisplayNull";
import { useStateValue } from "../../reducers/state";
import { useMargaret } from "../../io/MargaretProvider";
import { currFacility } from "../../models/karteCtx";
import RemoteSign from "./RemoteSign";
import dateFormat from "dateformat";
import OnlineMeet from "./OnlineMeet";
import CustomSelect2 from "../../cmp/CustomSelect2";

const PING_MENUS = [
  { name: "指示", action: "instruction", id: v4() },
  { name: "お薬について", action: "askMedicineEffect", id: v4() },
  { name: "同意書", action: "vaccinationSign", id: v4() },
  { name: "オンラインコール", action: "call", id: v4() },
  { name: "お知らせ", action: "notify", id: v4() },
  { name: "問診", action: "makeMedicalInterviews", id: v4() },
];

const Ping = ({ patient }) => {
  const margaret = useMargaret();
  const { user } = useStateValue()[0];
  const [pingList, setPingList] = useState([]);
  const [pingItem, setPingItem] = useState("");

  const sendPing = (vaccination) => {
    const asyncPing = async (payload) => {
      await margaret
        .getApi("iss")
        .ping(payload)
        .then(() => {
          setPingItem("");
          const entry = {
            key: v4(),
            pingClass: "同意書",
            pingItem: payload.ping.item,
            sentAt: dateFormat(new Date(), "yyyy-MM-dd"),
            receivedAt: "",
          };
          const newList = [...pingList];
          newList.push(entry);
          setPingList(newList);
        });
    };
    const facility = currFacility(user);
    const payload = {
      ping: {
        sub: "kazushi.minagawa@mac.com",
        pt_id: patient.ptId,
        whats: "vaccination",
        item: vaccination,
      },
      user: {
        id: user.id,
        name: user.fullName,
      },
      facility: {
        id: facility.id,
        name: facility.name,
      },
    };
    asyncPing(payload).catch((err) => console.log(err));
  };

  const handleSelect = (item) => {
    if (!item) {
      return;
    }
    setPingItem(item);
  };

  const handleSubmit = (item) => {
    const { name } = item;
    sendPing(name);
  };

  const createContext = (name, email) => {
    return {
      user: {
        name,
        email,
      },
    };
  };

  const handleSubmitMeet = () => {
    const room = v4();
    const { fullName, username } = user;
    const userContext = createContext(fullName, username);
    const patientMail = patient.email || "kazushi.minagawa@mac.com";
    const patientContext = createContext(`${patient.fullName} 様`, patientMail);
    const facility = currFacility(user);
    const exp = 60 * 10;
    const meetingData = {
      guest_context: patientContext,
      host_context: userContext,
      user: {
        id: user.id,
        name: user.fullName,
      },
      facility: {
        id: facility.id,
        name: facility.name,
      },
      exp: exp,
      room: room,
      appoint_time: dateFormat(new Date(), "yyyy-m-d HH:MM"),
    };
    const asyncCall = async (data) => {
      try {
        const res = await margaret.getApi("iss").call(data);
        const { meetingUrl } = res;
        window.open(meetingUrl);
        setPingItem("");
      } catch (err) {
        console.log(err);
      }
    };
    asyncCall(meetingData).catch((err) => console.log(err));
  };

  return (
    <div className="w3-panel">
      <BarDiv>
        <CustomSelect2
          title="+Ping"
          options={PING_MENUS}
          labelGetter="name"
          valueGetter="id"
          onSelect={handleSelect}
        />
      </BarDiv>
      <div>
        <table className="w3-table w3-bordered w3-hoverable">
          <thead>
            <tr>
              <th>種別</th>
              <th>内容</th>
              <th>送信日時</th>
              <th>返信日時</th>
            </tr>
          </thead>
          <tbody>
            {pingList.map((item) => {
              const { key, pingClass, pingItem, sentAt, receivedAt } = item;
              return (
                <tr key={key}>
                  <td>{pingClass}</td>
                  <td>{pingItem}</td>
                  <td>{sentAt}</td>
                  <td>{receivedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pingItem && pingItem.action !== "call" && (
        <RemoteSign
          patient={patient}
          onSubmit={handleSubmit}
          onCancel={() => setPingItem("")}
        />
      )}
      {pingItem && pingItem.action === "call" && (
        <OnlineMeet
          patient={patient}
          onSubmit={handleSubmitMeet}
          onCancel={() => setPingItem("")}
        />
      )}
    </div>
  );
};

const BarDiv = styled.div`
  display: flex;
  padding: 2px 0;
`;

const EnhancedPing = withDisplayNull(Ping);
export default EnhancedPing;
