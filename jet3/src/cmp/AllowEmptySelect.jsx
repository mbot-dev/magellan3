const EMPTY_TEXT = "";

const AllowEmptySelect = ({
  name,
  selectedValue,
  onSelect,
  options,
  labelGetter = "label",
  valueGetter = "value",
  width = "256px",
}) => {
  const handleOptionChange = (e) => {
    const v = e.target.value;
    if (!v) {
      if (name) {
        onSelect({ name, value: "" });
      } else {
        onSelect("");
      }
      return;
    }
    const item = options.find((op) => op[valueGetter] === v);
    const value = item[valueGetter];
    if (name) {
      // Call 側で obj[name]=value するため
      onSelect({ name, value: value });
    } else {
      onSelect(item);
    }
  };

  return (
    options && (
      <select className="z3-select w3-round" onChange={handleOptionChange} style={{ width }}>
        {<option value="">{EMPTY_TEXT}</option>}
        {options.map((item, index) => {
          const label = item[labelGetter];
          const value = item[valueGetter];
          const key = item?.id ?? index;
          const selected = selectedValue && selectedValue === value;
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

export default AllowEmptySelect;
