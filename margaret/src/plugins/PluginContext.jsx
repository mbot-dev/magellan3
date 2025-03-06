import {createContext, useReducer, useContext} from 'react';

const PluginContext = createContext(null);

export const PluginProvider = ({reducer, initialState, children}) =>(
  <PluginContext value={useReducer(reducer, initialState)}>
    {children}
  </PluginContext>
);

export const usePlugin = () => useContext(PluginContext);