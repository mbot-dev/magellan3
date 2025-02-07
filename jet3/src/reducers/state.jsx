import {createContext, useContext, useReducer} from 'react';
export const StateContext = createContext('');
export const StateProvider = ({reducer, initialState, children}) => (
  <StateContext value={useReducer(reducer, initialState)}>
    {children}
  </StateContext>
);
export const useStateValue = () => useContext(StateContext);
