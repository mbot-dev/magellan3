import { useEffect, useState } from "react";
import pluginContainer from "./PluginContainer";
import MyPlugin from "./MyPlugin.jsx";
import PluginPoint from "./PluginPoint.jsx";

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
