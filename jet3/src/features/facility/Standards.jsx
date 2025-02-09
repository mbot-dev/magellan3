import { useEffect, useState } from "react";
import styled from "styled-components";
import { StickyBody, StickyColumn } from "../../aux/commonStyles";
import { LIST_SPEC_SHORT_NAME } from "./userSpec";
import { useStateValue } from "../../reducers/state";
import UserFunc from "./userFunc";
import withDisplayNull from "../../aux/withDisplayNull";
import { useMargaret } from "../../io/MargaretProvider";

const Standards = () => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const [standards, setStandards] = useState([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const asyncGet = async () => {
      try {
        const result = await margaret.getApi("master").listShortName();
        setStandards(result && result.length > 0 ? result : []);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet();
  }, [user]);

  return (
    standards && (
      <Layout>
        <div
          className="z3-calc-scroll-container"
          style={{ "--max-height": "100vh - 256px" }}
        >
          <table className="w3-table w3-bordered w3-hoverable">
            <StickyColumn className="z3-karte">
              <tr>
                {LIST_SPEC_SHORT_NAME.columnGetters.map((it, i) => (
                  <th key={i}>{it.label}</th>
                ))}
              </tr>
            </StickyColumn>
            <StickyBody>
              {standards.map((u, row) => {
                return (
                  <tr key={row}>
                    {LIST_SPEC_SHORT_NAME.columnGetters.map((col) => {
                      const { key, func, arg } = col;
                      const args = arg ? arg.map((a) => u[a]) : [];
                      if (func) {
                        return <td key={key}>{UserFunc[func](...args)}</td>;
                      } else {
                        return <td key={key}>{u[key]}</td>;
                      }
                    })}
                  </tr>
                );
              })}
            </StickyBody>
          </table>
        </div>
      </Layout>
    )
  );
};

const Layout = styled.div`
  width: 1024px;
  padding: 0 0 0 32px;
`;

const NamedStandards = withDisplayNull(Standards);
export default NamedStandards;
