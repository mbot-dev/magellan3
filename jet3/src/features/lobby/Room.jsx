import { useState } from "react";
import styled from "styled-components";

const Room = ({ subMenus, onChild, children }) => {
  const [child, setChild] = useState(0);

  const handleClick = (i) => {
    setChild(i);
    onChild(i);
  };

  return (
    <Layout>
      <Header>
        <ul className="z3-menu-ul">
          {subMenus.entries.map((m, i) => {
            const selected = m.path === child;
            return (
              <li
                key={i}
                className={
                  selected
                    ? "w3-hover-light-gray z3-menu-li z3-border-bottom-secondary"
                    : "w3-hover-light-gray z3-menu-li z3-border-bottom-surface"
                }
                onClick={() => handleClick(i)}
              >
                <span>{m.label}</span>
              </li>
            );
          })}
        </ul>
      </Header>
      <Content>{children}</Content>
    </Layout>
  );
};

const Layout = styled.div`
  padding: 16px 32px 0px 32px;
  width: 100%;
  height: 100%;
  background-color: var(--background);
  color: var(--on-background);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "h"
    "c";
  row-gap: 16px;
  overflow: hidden;
`;

const Header = styled.div`
  grid-area: h;
  display: flex;
  flex-direction: row;
`;

const Content = styled.div`
  grid-area: c;
`;

export default Room;

