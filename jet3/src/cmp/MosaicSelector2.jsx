const MosaicSelector2 = ({ options, myRender, disabled, localDispatch }) => {
  const handleOptionChange = (e) => {
    const v = e.target.value;
    const item = options.find((op) => op.render === v);
    if (item.render !== myRender) {
      localDispatch({ type: "changeRenderer", payload: item.render });
    }
  };
  return (
    options && (
      <select
        className="z3-select w3-padding-small w3-border-0"
        onChange={handleOptionChange}
        disabled={disabled}
      >
        {options.map((item, index) => {
          const label = item["label"];
          const value = item["render"];
          const key = item?.id ?? index;
          const selected = myRender && myRender === value;
          const hr = label.startsWith("-");
          return hr ? (
            <hr key={key} />
          ) : selected ? (
            <option key={key} value={value} selected>
              {label}
            </option>
          ) : (
            <option key={key} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    )
  );
};

export default MosaicSelector2;
