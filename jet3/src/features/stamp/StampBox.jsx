import { useEffect } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import StampTreeDisease from "./StampTreeDisease";
import StampTree from "./StampTree";
import withDisplayBlock from "../../aux/withDisplayBlock";
import StampTreeInput from "./StampTreeInput";
import { currFacility } from "../../models/karteCtx";
import { getUsingProcedures } from "../../io/stampIO";
import { useLocalStorage } from "@react-hooks-library/core";
import { BaseButton } from "../../aux/commonStyles";

const StampBox = () => {
  const [{ user, stampEntity, usingProcedures }, dispatch] = useStateValue();
  const [myEntity, setMyEntity] = useLocalStorage("stamp_entity", "baseCharge");

  useEffect(() => {
    if (!user) {
      return;
    }
    const asyncGet = async (facility_id) => {
      try {
        const data = await getUsingProcedures(facility_id);
        if (data?.length) {
          dispatch({ type: "setUsingProcedures", using: data });
        }
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facility_id = currFacility(user).id;
    asyncGet(facility_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // reducer ->  stampEntity self & tool
    dispatch({ type: "setStampEntity", entity: myEntity });
  }, [dispatch, myEntity]);

  // Tab 選択 -> stampEntity & bundleToEdit Stateが変化
  const handleTabSelection = (entity) => {
    setMyEntity(entity);
  };

  return (
    <Layout>
      <StampPanel className="w3-border-bottom z3-surface">
        {usingProcedures.map((spec) => {
          const { id, entity, shortName } = spec;
          const selected = entity === stampEntity;
          return (
            <StampButton
              key={id}
              className={selected ? "z3-primary" : "z3-surface"}
              onClick={() => handleTabSelection(entity)}
            >
              {shortName}
            </StampButton>
          );
        })}
      </StampPanel>
      <Tree>
        {usingProcedures.map((spec) => {
          const { id, entity } = spec;
          const show = entity === stampEntity;
          // スタンプの検索機能のため、最初に全て取得する
          if (entity === "disease") {
            return (
              <StampTreeDisease key={id} tab={spec} show={show.toString()} />
            );
          }
          if (entity === "input") {
            return (
              <StampTreeInput key={id} tab={spec} show={show.toString()} />
            );
          }
          return <StampTree key={id} tab={spec} show={show.toString()} />;
        })}
      </Tree>
    </Layout>
  );
};

const Layout = styled.div`
  display: flex;
  flex-direction: column;
`;

const StampPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  grid-auto-flow: row dense;
  width: 100%;
  background-color: #f1f1f1;
  co1or: #000;
`;

const Tree = styled.div`
  max-height: calc(100vh - 128px); // 128px = StampPanel ToDo
  overflow-y: auto;
`;

const StampButton = styled(BaseButton)`
  padding: 8px 8px;
  border-radius: 1px;
  &:focus {
    outline: none;
  }
`;

const EnhancedStampBox = withDisplayBlock(StampBox);
export default EnhancedStampBox;
