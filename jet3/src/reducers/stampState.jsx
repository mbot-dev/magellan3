import {createContext, useContext, useReducer} from 'react';

const StampState = createContext(null);

export const StampProvider = ({reducer, initialState, children}) =>(
  <StampState value={useReducer(reducer, initialState)}>
    {children}
  </StampState>
);

export const useStampState = () => useContext(StampState);
