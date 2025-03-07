import { createContext, useReducer } from "react";

const PluginContext = createContext(null);

const PluginProvider = ({children}) => {
  const initialState = {
    plugins: [],
    execute: false,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "start":
        return { execute: true };
      case "stop":
        return { execute: false };
      default:
        return state;
    }
  };
  return (
    <PluginContext value={useReducer(reducer, initialState)}>
      {children}
    </PluginContext>
  );
};

export { PluginContext, PluginProvider };
