import { createContext, useContext } from "react";
import ApiService from "./ApiService";

// Create a context for the ApiService
const ApiContext = createContext(null);

// Component that provides the ApiService through context
export const ApiProvider = ({ children }) => {
  const apiService = new ApiService();

  return (
    <ApiContext.Provider value={apiService}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext)
