import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initialState, reducer } from "./plugins/pluginReducer";
import { PluginProvider } from "./plugins/PluginContext";

createRoot(document.getElementById("root")).render(
  <PluginProvider initialState={initialState} reducer={reducer}>
    <App />
  </PluginProvider>
);
