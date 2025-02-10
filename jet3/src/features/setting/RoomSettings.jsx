import { useEffect, useState } from "react";
import styled from "styled-components";
import hash from "object-hash";
import { useStateValue } from "../../reducers/state";
import { BaseButton } from "../../aux/commonStyles";
import SmallButtons from "../../cmp/SmallButtons";
import { THEMES } from "../../aux/commonStyles";
import { useMargaret } from "../../io/MargaretProvider";
import withDisplayNull from "../../aux/withDisplayNull";
import Room from "../lobby/Room";
import { SETTINGS_MENU_SPEC } from "./settingsSpec";

const RoomSettings = () => {
  const margaret = useMargaret();
  const [{ user, settings }, dispatch] = useStateValue();
  const [copy, setCopy] = useState(null);
  const [oldHash, setOldHash] = useState(false);
  const [isDirty, setDirty] = useState(false);

  useEffect(() => {
    if (!user || !settings) {
      return;
    }
    const { appTheme, ...rest } = settings;
    setCopy(JSON.parse(JSON.stringify(rest)));
    setOldHash(hash(rest));
  }, [user, settings]);

  const handleThemeChange = (name) => {
    const cp = { ...copy };
    cp.theme = name; // name is the theme name
    setCopy(cp);
    setDirty(hash(cp) !== oldHash);
    dispatch({ type: "setUserSettings", settings: cp });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cp = { ...copy };
    cp[name] = value === "on";
    setCopy(cp);
    setDirty(hash(cp) !== oldHash);
    dispatch({ type: "setUserSettings", settings: cp });
  };

  const handleSave = () => {
    const newSettings = { ...copy };
    const ayncUpdate = async () => {
      try {
        await margaret.getApi("user").setUserSettings(user.id, newSettings);
        setDirty(false);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    ayncUpdate();
  };

  return (
    copy && (
      <Room subMenus={SETTINGS_MENU_SPEC} onChild={() => {}}>
        <Layout>
          <Main>
            <Label>{TEME_COLOR}</Label>
            <Control>
              <div className="z3-flex" style={{ "--gap": "32px" }}>
                {THEMES.map((c, index) => {
                  const { name, theme, disp } = c;
                  return (
                    <SettingButton
                      key={index}
                      className="w3-border w3-round"
                      theme={theme}
                      onClick={() => handleThemeChange(name)}
                    >
                      {disp}
                    </SettingButton>
                  );
                })}
              </div>
            </Control>

            <Label>{TEXT_MEDICINE_COLORING}</Label>
            <Control>
              <div className="z3-flex" style={{ "--gap": "32px" }}>
                <div className="z3-radio-box">
                  <input
                    id="on"
                    type="radio"
                    className="w3-radio"
                    name="isMedicineColoring"
                    value="on"
                    checked={copy.isMedicineColoring}
                    onChange={handleChange}
                  />
                  <label htmlFor="on">{TEXT_ON}</label>
                </div>
                <div className="z3-radio-box">
                  <input
                    id="off"
                    type="radio"
                    className="w3-radio"
                    name="isMedicineColoring"
                    value="off"
                    checked={!copy.isMedicineColoring}
                    onChange={handleChange}
                  />
                  <label htmlFor="off">{TEXT_OFF}</label>
                </div>
              </div>
            </Control>

            <Label>{TEXT_SOA_COLORING}</Label>
            <Control>
              <div className="z3-flex" style={{ "--gap": "32px" }}>
                <div className="z3-radio-box">
                  <input
                    id="on"
                    type="radio"
                    className="w3-radio"
                    name="isSoaColoring"
                    value="on"
                    checked={copy.isSoaColoring}
                    onChange={handleChange}
                  />
                  <label htmlFor="on">{TEXT_ON}</label>
                </div>
                <div className="z3-radio-box">
                  <input
                    id="off"
                    type="radio"
                    className="w3-radio"
                    name="isSoaColoring"
                    value="off"
                    checked={!copy.isSoaColoring}
                    onChange={handleChange}
                  />
                  <label htmlFor="off">{TEXT_OFF}</label>
                </div>
              </div>
            </Control>

            <Label>{TEXT_DIALOG_ANIMATION}</Label>
            <Control>
              <div className="z3-flex" style={{ "--gap": "32px" }}>
                <div className="z3-radio-box">
                  <input
                    id="on"
                    type="radio"
                    className="w3-radio"
                    name="isAnimate"
                    value="on"
                    checked={copy.isAnimate}
                    onChange={handleChange}
                  />
                  <label htmlFor="on">{TEXT_ON}</label>
                </div>
                <div className="z3-radio-box">
                  <input
                    id="off"
                    type="radio"
                    className="w3-radio"
                    name="isAnimate"
                    value="off"
                    checked={!copy.isAnimate}
                    onChange={handleChange}
                  />
                  <label htmlFor="off">{TEXT_OFF}</label>
                </div>
              </div>
            </Control>
          </Main>
          <Command>
            <div className="z3-flex-column" style={{ "--gap": "4px" }}>
              <SmallButtons
                okText={TEXT_DECIDE}
                okEnabled={isDirty}
                onOk={handleSave}
              />
            </div>
          </Command>
        </Layout>
      </Room>
    )
  );
};

const Layout = styled.div`
  width: 1024px;
  padding: 0 0 0 32px;
  display: grid;
  grid-template-columns: 11fr 1fr;
  grid-template-rows: auto;
  column-gap: 16px;
  grid-template-areas: "main cmd";
`;

const Main = styled.div`
  grid-area: main;
  display: grid;
  grid-template-columns: [labels] minmax(200px, 0) [controls] 1fr;
  grid-auto-flow: row;
  column-gap: 32px;
  row-gap: 16px;
`;

const Label = styled.div`
  grid-column: labels;
  grid-row: auto;
`;

const Control = styled.div`
  grid-column: controls;
  grid-row: auto;
`;

const Command = styled.div`
  grid-area: cmd;
`;

const SettingButton = styled(BaseButton)`
  background-color: ${(props) => props.theme.primary};
  color: ${(props) => props.theme.onPrimary};
`;

const TEME_COLOR = "メインカラー";
const TEXT_SOA_COLORING = "経過記録を薄いグレーで表示";
const TEXT_MEDICINE_COLORING = "内服薬と注射薬の色付け";
const TEXT_DIALOG_ANIMATION = "ダイアログ表示のアニメーション";
const TEXT_ON = "オン";
const TEXT_OFF = "オフ";
const TEXT_DECIDE = "決定";

const RoomSettingsWithDisplayNull = withDisplayNull(RoomSettings);
export default RoomSettingsWithDisplayNull;
