import { createContext, useReducer } from "react";

const PluginContext = createContext(null);

const PluginProvider = ({ reducer, initialState, children }) => (
  <PluginContext value={useReducer(reducer, initialState)}>
    {children}
  </PluginContext>
);

export { PluginContext, PluginProvider };
