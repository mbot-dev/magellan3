import { useState, useEffect, useReducer } from "react";
import { produce } from "immer";
import styled from "styled-components";
import { GridItem, rowAt } from "../../aux/commonStyles";
import ContextMenu from "../../cmp/ContextMenu";
import {
  getAMSimbol,
  getPMSimbol,
  HOLIDAYS,
  irregularInfo,
  isHoliday,
  isIrregular,
  OFF_ENTRIES,
  setupRelations,
  WEEK_DAYS,
} from "./timeModel";
import TimeCellEditor from "./TimeEditorCell";

const initilaState = {
  timeTable: null,
};

const reducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "init":
        draft.timeTable = JSON.parse(JSON.stringify(action.payload));
        break;
      case "setRegularTime": {
        const { name, value } = action.payload;
        draft.timeTable[name] = value;
        break;
      }
      case "applyRegularTime": {
        const timeName = action.payload;
        draft.timeTable.weekDays.forEach((t) => {
          t[timeName] =
            draft.timeTable[
              `regular${timeName.charAt(0).toUpperCase()}${timeName.slice(1)}`
            ];
        });
        break;
      }
      case "holidayCheck": {
        let target = null;
        const checked = action.payload.checked;
        const day = action.payload.name; // mon tue...
        if (checked) {
          target = draft.timeTable.holidays.find((x) => x.name === day);
          if (!target) {
            const off = OFF_ENTRIES.find((x) => x.name === day);
            draft.timeTable.holidays.push(off);
          }
          target = draft.timeTable.weekDays.find((x) => x.name === day);
          if (target) {
            target.amStart = "";
            target.amEnd = "";
            target.pmStart = "";
            target.pmEnd = "";
            break;
          }
        }
        if (!checked) {
          target = draft.timeTable.holidays.find((x) => x.name === day);
          if (target) {
            const index = draft.timeTable.holidays.findIndex(
              (x) => x.name === day,
            );
            draft.timeTable.holidays.splice(index, 1);
          }
          target = draft.timeTable.weekDays.find((x) => x.name === day);
          if (target) {
            target.amStart = draft.timeTable.regularAmStart;
            target.amEnd = draft.timeTable.regularAmEnd;
            target.pmStart = draft.timeTable.regularPmStart;
            target.pmEnd = draft.timeTable.regularPmEnd;
          }
        }
        break;
      }
      case "setTime": {
        const newTime = action.payload;
        const index = draft.timeTable.weekDays.findIndex(
          (x) => x.name === newTime.name,
        );
        draft.timeTable.weekDays.splice(index, 1, newTime);
        break;
      }
      default:
        break;
    }
  });
};

const TimeEditor = ({ tableToEdit, saveTable, onSave }) => {
  const [{ timeTable }, localDispatch] = useReducer(reducer, initilaState);
  const [dataToPop, setDataToPop] = useState(null);
  const [timeToEdit, setTimeToEdit] = useState(false);

  useEffect(() => {
    if (!tableToEdit) {
      return;
    }
    localDispatch({ type: "init", payload: tableToEdit });
  }, [tableToEdit]);

  useEffect(() => {
    if (!saveTable) {
      return;
    }
    const cp = JSON.parse(JSON.stringify(timeTable));
    setupRelations(cp);
    onSave(cp);
  }, [saveTable]);

  const handleHolidayCheck = (e) => {
    const { name, checked } = e.target;
    const data = { name, checked };
    localDispatch({ type: "holidayCheck", payload: data });
  };

  const handleRegularTimeChange = (e) => {
    const { name, value } = e.target;
    localDispatch({ type: "setRegularTime", payload: { name, value } });
  };

  const applyRegularTime = (e) => {
    const { name } = e.target; // regularAmStart, regularAmEnd, regularPmStart, regularPmEnd
    let timeName = name.substring("regular".length);
    timeName = timeName.charAt(0).toLowerCase() + timeName.slice(1);
    localDispatch({ type: "applyRegularTime", payload: timeName });
  };

  const handlePopup = (e) => {
    e.preventDefault();
    const day = e.target.getAttribute("data-day");
    const time = timeTable.weekDays.find((x) => x.name === day);
    const point = { x: e.clientX, y: e.clientY };
    const menus = [];
    menus.push({
      name: "編集",
      action: "edit",
      time,
    });
    const staff = {
      point,
      menus,
    };
    setDataToPop(staff);
  };

  const handlePopCancel = () => {
    setDataToPop(null);
    setTimeToEdit(null);
  };

  const handlePopSelect = (item) => {
    setDataToPop(null);
    setTimeToEdit(item.time);
  };

  const handleCancelChangeTime = () => {
    setTimeToEdit(null);
  };

  const handleChangeTime = (newTime) => {
    setTimeToEdit(null);
    localDispatch({ type: "setTime", payload: newTime });
  };

  return (
    timeTable && (
      <Wrapper>
        <div className="z3-flex-column" style={{ "--gap": "4px" }}>
          <span className="w3-small">1. 休診日を選んでください</span>
          <div
            className="z3-flex"
            style={{ "--align": "center", "--gap": "32px" }}
          >
            {[...HOLIDAYS, ...WEEK_DAYS].map((h, i) => {
              return (
                <div key={i} className="z3-radio-box">
                  <input
                    type="checkbox"
                    key={i}
                    id={h.name}
                    className="w3-check"
                    name={h.name}
                    checked={isHoliday(h, timeTable)}
                    disabled={false}
                    onChange={handleHolidayCheck}
                  />
                  <label htmlFor={h.name}>{h.disp}</label>
                </div>
              );
            })}
          </div>
        </div>
        <div className="z3-flex-column">
          <TimeGrid>
            <GridItem
              grid={rowAt(1, 1)}
              style={{
                borderBottom: "1px solid #efefef",
                fontSize: "12px",
                alignSelf: "start",
                justifySelf: "start",
              }}
            >
              2. 通常時間を入力してください
            </GridItem>
            {WEEK_DAYS.map((d, i) => {
              return (
                <GridItem
                  key={i}
                  grid={rowAt(1, i + 2)}
                  style={{ borderBottom: "1px solid #efefef" }}
                  onContextMenu={handlePopup}
                  data-day={d.name}
                >
                  {d.disp}
                </GridItem>
              );
            })}
            <GridItem
              grid={rowAt(2, 1)}
              style={{ alignSelf: "start", justifySelf: "start" }}
            >
              <div className="z3-flex" style={{ "--gap": "4px" }}>
                <span>AM</span>
                <TimeInput
                  name="regularAmStart"
                  value={timeTable.regularAmStart}
                  onChange={handleRegularTimeChange}
                  onBlur={applyRegularTime}
                />
                <span>&#65374;</span>
                <TimeInput
                  name="regularAmEnd"
                  value={timeTable.regularAmEnd}
                  onChange={handleRegularTimeChange}
                  onBlur={applyRegularTime}
                />
              </div>
            </GridItem>
            {timeTable.weekDays.map((t, i) => {
              return (
                <GridItem key={i} grid={rowAt(2, i + 2)}>
                  {getAMSimbol(t, timeTable)}
                </GridItem>
              );
            })}
            <GridItem
              grid={rowAt(3, 1)}
              style={{ alignSelf: "start", justifySelf: "start" }}
            >
              <div className="z3-flex" style={{ "--gap": "4px" }}>
                <span>PM</span>
                <TimeInput
                  name="regularPmStart"
                  value={timeTable.regularPmStart}
                  onChange={handleRegularTimeChange}
                  onBlur={applyRegularTime}
                />
                <span>&#65374;</span>
                <TimeInput
                  name="regularPmStart"
                  value={timeTable.regularPmEnd}
                  onChange={handleRegularTimeChange}
                  onBlur={applyRegularTime}
                />
              </div>
            </GridItem>
            {timeTable.weekDays.map((t, i) => {
              return (
                <GridItem key={i} grid={rowAt(3, i + 2)}>
                  {getPMSimbol(t, timeTable)}
                </GridItem>
              );
            })}
          </TimeGrid>
        </div>
        <div className="z3-flex-column" style={{ "--gap": "4px" }}>
          <span className="w3-small">
            3. 個別に時間を変更する場合は、該当する曜日を右クリックしてください
          </span>
        </div>
        {timeTable.weekDays.filter((x) => isIrregular(x, timeTable)).length >
          0 && (
          <div className="z3-flex-column" style={{ "--gap": "4px" }}>
            <div className="z3-flex">
              <span>*</span>
              {timeTable.weekDays
                .filter((x) => isIrregular(x, timeTable))
                .map((t, i) => {
                  return (
                    <div key={i}>
                      <span>{irregularInfo(t)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {dataToPop && (
          <ContextMenu
            clickPoint={dataToPop.point}
            menus={dataToPop.menus}
            onSelect={handlePopSelect}
            onCancel={handlePopCancel}
          />
        )}
        {timeToEdit && (
          <TimeCellEditor
            time={timeToEdit}
            onCancel={handleCancelChangeTime}
            onSubmit={handleChangeTime}
          />
        )}
      </Wrapper>
    )
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 32px;
  padding: 16px;
`;

const TimeInput = styled.input.attrs({
  type: "text",
})`
  width: 64px;
  text-align: center;
`;

const TimeGrid = styled.div`
  width: 768px !important;
  display: grid;
  grid-template-columns: 2.5fr repeat(6, 1fr);
  grid-template-rows: auto;
  align-items: center;
  justify-items: center;
  column-gap: 8px;
  row-gap: 16px;
`;

export default TimeEditor;

