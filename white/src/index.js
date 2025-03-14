import React from 'react';
import ReactDOM from 'react-dom';
import './css/w3.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {StateProvider} from './reducer/state';
import {initialState, reducer} from "./reducer/reducer";

ReactDOM.render(
    <React.StrictMode>
        <StateProvider initialState={initialState} reducer={reducer}>
            <App />
        </StateProvider>
    </React.StrictMode>,
    document.getElementById('root')
);

serviceWorker.register();
