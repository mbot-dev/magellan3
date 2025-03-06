import {createContext, useContext, useReducer} from 'react';
const StateContext = createContext(null);
export const StateProvider = ({reducer, initialState, children}) => (
  <StateContext value={useReducer(reducer, initialState)}>
    {children}
  </StateContext>
);
export const useStateValue = () => useContext(StateContext);
