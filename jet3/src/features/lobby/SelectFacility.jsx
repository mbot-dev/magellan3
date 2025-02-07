import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { v4 } from "uuid";

const SelectFacility = ({ facilities, defaultFacility, onSelect }) => {
  const [hospIndex, setHospIndex] = useState(0);
  const defaultButton = useRef(undefined);

  useEffect(() => {
    if (!facilities || !facilities?.length || !defaultFacility) {
      return;
    }
    const index = facilities.findIndex((x) => x.id === defaultFacility);
    setHospIndex(index);
  }, [facilities, defaultFacility]);

  useEffect(() => {
    if (!defaultButton || !defaultButton?.current) {
      return;
    }
    defaultButton.current.focus();
  }, [defaultButton]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selected = facilities[hospIndex];
    onSelect(selected.id);
  };

  const handleHospChange = (e) => {
    setHospIndex(Number(e.target.value));
  };

  return (
    <LobbyContent>
      <div className="w3-panel w3-card w3-round">
        <form onSubmit={handleSubmit}>
          <div className="w3-panel" style={{ borderRadius: "4px 4px 0 0" }}>
            <h4>医療機関選択</h4>
          </div>
          <ul className="w3-ul">
            <li style={ListStyle}>
              <span>ログインする医療機関を選択してください</span>
            </li>
            <li style={ListStyle}>
              <div className="z3-flex">
                <select
                  className="w3-select"
                  value={hospIndex}
                  onChange={handleHospChange}
                  style={{ flex: "0 0 auto" }}
                >
                  {facilities.map((item, index) => {
                    return (
                      <option key={v4()} value={index}>
                        {item.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </li>
            <div className="w3-panel">
              <div className="z3-flex" style={{ "--align": "center" }}>
                <button
                  className="w3-button w3-round z3-primary"
                  ref={defaultButton}
                  type="submit"
                  style={{ flex: "1 0 auto" }}
                >
                  選 択
                </button>
              </div>
            </div>
          </ul>
        </form>
      </div>
    </LobbyContent>
  );
};

const LobbyContent = styled.div`
  width: 384px;
  padding-top: 64px;
  margin: auto;
`;

const ListStyle = {
  borderBottom: "0",
};

export default SelectFacility;
