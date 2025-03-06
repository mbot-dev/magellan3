import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { PluginProvider } from "./plugins/PluginContext";

const initialState = {
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

createRoot(document.getElementById("root")).render(
  <PluginProvider initialState={initialState} reducer={reducer}>
    <App />
  </PluginProvider>
);
