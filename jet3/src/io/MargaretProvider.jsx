import { createContext, useContext } from "react";
import MargaretService from "./MargaretService";

// Create a context for the ApiService
const MargaretContext = createContext(null);

// Component that provides the ApiService through context
export const MargaretProvider = ({ children }) => {
  const margaretService = new MargaretService();

  return <MargaretContext value={margaretService}>{children}</MargaretContext>;
};

export const useMargaret = () => useContext(MargaretContext);
