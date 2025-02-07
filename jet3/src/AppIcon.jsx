import {
  MdOutlineSettings,
  MdOutlineScience,
  MdOutlineMedicalServices,
  MdOutlineWeekend,
  MdOutlineNotificationsActive,
  MdOutlineExplore,
  MdWeekend,
  MdExplore,
  MdNotificationsActive,
  MdScience,
  MdMedicalServices,
  MdSettings,
  MdOutlineHomeWork,
  MdHomeWork,
} from "react-icons/md";
import { FiCalendar, FiCreditCard } from "react-icons/fi";
import styled from "styled-components";
import { BaseButton } from "./aux/commonStyles";

export const getIcon = (code, selected) => {
  let render = null;

  switch (code) {
    case "karte":
      render = selected ? <MdOutlineExplore /> : <MdOutlineExplore />;
      break;
    case "accounting":
      render = selected ? <FiCreditCard /> : <FiCreditCard />;
      break;
    case "receipt":
      render = selected ? <FiCalendar /> : <FiCalendar />;
      break;
    case "pvt":
      render = selected ? <MdOutlineWeekend /> : <MdOutlineWeekend />;
      break;
    case "search":
      render = selected ? <MdOutlineExplore /> : <MdOutlineExplore />;
      break;
    case "notify":
      render = selected ? (
        <MdOutlineNotificationsActive />
      ) : (
        <MdOutlineNotificationsActive />
      );
      break;
    case "labReceiver":
      render = selected ? <MdOutlineScience /> : <MdOutlineScience />;
      break;
    case "tool":
      render = selected ? <MdOutlineMedicalServices /> : <MdOutlineMedicalServices />;
      break;
    case "facility":
      render = selected ? <MdOutlineHomeWork /> : <MdOutlineHomeWork />;
      break;
    case "settings":
      render = selected ? <MdOutlineSettings /> : <MdOutlineSettings />;
      break;
    default:
      render = <></>;
  }

  return render;
};

export const AppIcon = styled(BaseButton)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--side-bar-width);
  height: var(--side-bar-width);
  // font-size: 1.5remrem;
  &:focus {
    outline: none;
  }
  &::after {
    width: var(--side-bar-width);
    content: var(--txt);
    font-size: 0.7rem;
    text-align: center;
  }
`;
