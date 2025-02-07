import {createContext, useContext, useReducer} from 'react';

export const StampState = createContext();

export const StampProvider = ({reducer, initialState, children}) =>(
  <StampState value={useReducer(reducer, initialState)}>
    {children}
  </StampState>
);

export const useStampState = () => useContext(StampState);
