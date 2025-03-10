import {createContext, useContext, useReducer} from 'react';

const StateContext = createContext(null);

const StateProvider = ({reducer, initialState, children}) => (
  <StateContext value={useReducer(reducer, initialState)}>
    {children}
  </StateContext>
);

const useStateValue = () => useContext(StateContext);

export {StateProvider, useStateValue};
