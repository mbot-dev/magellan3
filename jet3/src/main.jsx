import { createRoot } from "react-dom/client";
import App from "./App";
import "./assets/w3.css";
import "./assets/mg.css";
import { initialState, reducer } from "./reducers/reducer";
import { StateProvider } from "./reducers/state";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <StateProvider initialState={initialState} reducer={reducer}>
    <App />
  </StateProvider>,
);
