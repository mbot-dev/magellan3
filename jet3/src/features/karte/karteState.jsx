import {createContext, useContext, useReducer} from 'react';

export const KarteState = createContext();

export const KarteProvider = ({reducer, initialState, children}) =>(
  <KarteState value={useReducer(reducer, initialState)}>
    {children}
  </KarteState>
);

export const useKarteState = () => useContext(KarteState);
