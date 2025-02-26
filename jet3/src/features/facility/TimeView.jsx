import styled from "styled-components";
import { GridItem, rowAt } from "../../aux/commonStyles";
import {
  getAMSimbol,
  getPMSimbol,
  irregularInfo,
  isIrregular,
  WEEK_DAYS,
} from "./timeModel";

const TimeView = ({ timeTable }) => {
  return (
    timeTable && (
      <Layout>
        <div className="z3-flex-column">
          <TimeGrid>
            <GridItem grid={rowAt(1, 1)} />
            {WEEK_DAYS.map((d, i) => {
              return (
                <GridItem key={i} grid={rowAt(1, i + 2)}>
                  {d.disp}
                </GridItem>
              );
            })}
            <GridItem
              grid={rowAt(2, 1)}
              style={{ alignSelf: "start", justifySelf: "start" }}
            >
              <div className="z3-flex" style={{ "--gap": "4px" }}>
                <span>{TEXT_AM}</span>
                <span>{timeTable.regularAmStart}</span>
                <span>&#65374;</span>
                <span>{timeTable.regularAmEnd}</span>
              </div>
            </GridItem>
            {timeTable.weekDays.map((t, i) => {
              return (
                <GridItem key={i} grid={rowAt(2, i + 2)}>
                  <div>{getAMSimbol(t, timeTable)}</div>
                </GridItem>
              );
            })}
            <GridItem
              grid={rowAt(3, 1)}
              style={{ alignSelf: "start", justifySelf: "start" }}
            >
              <div className="z3-flex" style={{ "--gap": "4px" }}>
                <span>{TEXT_PM}</span>
                <span>{timeTable.regularPmStart}</span>
                <span>&#65374;</span>
                <span>{timeTable.regularPmEnd}</span>
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
        <div className="z3-flex-column" style={{ "--gap": "6px" }}>
          {timeTable.weekDays.filter((x) => isIrregular(x, timeTable)).length >
            0 && (
            <div className="z3-flex-column">
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
          <div className="z3-flex-column" style={{ paddingTop: "16px" }}>
            <div className="z3-flex" style={{ "--gap": "16px" }}>
              <span>{TEXT_HOLIDAY}</span>
              {timeTable.holidays.map((h, i) => {
                return (
                  <div key={i}>
                    <span>
                      {h.name === "sun" || h.name === "holi"
                        ? h.disp
                        : `${h.disp}${TEXT_WEEK_DAY}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Layout>
    )
  );
};

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 16px;
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

const TEXT_AM = "午前";
const TEXT_PM = "午後";
const TEXT_HOLIDAY = "休診日";
const TEXT_WEEK_DAY = "曜日";

export default TimeView;

