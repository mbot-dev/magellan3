import { useState } from "react";
import { normalizeText } from "../util/strings";

const NUMBER_REG = /^\d*\.?\d*$/;

export const KanjiInput = ({ value, onChange, mode = "edit", ...props }) => {
  const [isComposing, setComposing] = useState(false);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleCompositionStart = () => {
    setComposing(true);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || isComposing) {
      return;
    }
    e.preventDefault();
    e.target.blur();
  };

  const handleBlur = (e) => {
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <input
      className={
        mode !== "view" ? "w3-input w3-border w3-round" : "z3-input-disabled"
      }
      type="text"
      value={value}
      disabled={mode !== "view" ? false : true}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      autoComplete="off"
      {...props}
    />
  );
};

export const TextInput = ({ value, onChange, mode = "edit", ...props }) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") {
      return;
    }
    e.preventDefault();
    e.target.blur();
  };

  const handleBlur = () => {
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <input
      className={
        mode !== "view" ? "w3-input w3-border w3-round" : "z3-input-disabled"
      }
      type="text"
      value={value}
      disabled={mode !== "view" ? false : true}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      autoComplete="off"
      {...props}
    />
  );
};

export const NumberInput = ({
  className,
  name,
  value,
  autoFocus,
  onChange,
  onKeyDown,
  onValidate,
  placeholder,
  disabled = false,
  width = "64px",
}) => {
  const [isComposing, setComposing] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    onChange(name, value);
  };

  const handleCompositionStart = () => {
    setComposing(true);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || isComposing) {
      return;
    }
    e.preventDefault();
    e.target.blur();
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleBlur = (e) => {
    if (onValidate) {
      const half = normalizeText(e.target.value);
      const test = NUMBER_REG.test(half);
      const value = test ? half : "";
      onValidate(name, value);
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const getClassName = () => {
    const arr = [];
    arr.push("w3-input w3-padding-small w3-right-align");
    if (!disabled) {
      arr.push("w3-border w3-round-small");
    } else {
      arr.push("w3-border-0");
    }
    if (className) {
      arr.push(className);
    }
    return arr.join(" ");
  };

  return (
    <input
      type="text"
      className={getClassName()}
      name={name}
      value={value}
      autoFocus={autoFocus}
      onFocus={handleFocus}
      autoComplete="off"
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width: width }}
    />
  );
};
