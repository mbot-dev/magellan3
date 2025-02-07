const PLEASE_TEXT = "選択してください";

const CustomSelect2 = ({
  please,
  title,
  name, // attributes key to return
  selectedValue,
  onSelect,
  options,
  valueGetter = "value",
  labelGetter = "label",
  width = "256px",
  disabled = false,
}) => {
  const handleOptionChange = (e) => {
    const v = e.target.value;
    if (!v) {
      if (name) {
        onSelect({ name, value: null });
      } else {
        onSelect(null);
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
      <select
        className="z3-select w3-round"
        onChange={handleOptionChange}
        style={{ width }}
        disabled={disabled}
      >
        {please && <option value="">{PLEASE_TEXT}</option>}
        {title && <option value="">{title}</option>}
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

export default CustomSelect2;
