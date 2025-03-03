import { useEffect, useState } from "react";
import pluginContainer from "./plugins/PluginContainer";
import MyPlugin from "./plugins/MyPlugin.jsx";
import PluginPoint from "./plugins/PluginPoint.jsx";

const App = () => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const loadPlugins = async () => {
			const pluginInstance = new MyPlugin();
			pluginContainer.register(pluginInstance);
			pluginContainer.loadPlugins();
			setReady(true);
		};
		loadPlugins();
	}, []);

	return (
		<>
			<h2>Plugin Test</h2>
			{/* {ready && pluginContainer.renderPlugins()} */}
			{ready && <PluginPoint />} {/* Corrected render */}
		</>
	);
};

export default App;
