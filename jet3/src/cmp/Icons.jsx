import { BsFlagFill, BsSearch } from "react-icons/bs";

export const SearchIcon = ({ size = "20px", color }) => {
  return (
    <div
      className="z3-icon-wrapper"
      style={{ "--icon-size": `${size}`, "--icon-color": `${color}` }}
    >
      <BsSearch />
    </div>
  );
};

export const FlagIcon = ({ size, color }) => {
  return (
    <div
      className="z3-icon-wrapper"
      style={{ "--icon-size": `${size}`, "--icon-color": `${color}` }}
    >
      <BsFlagFill />
    </div>
  );
};