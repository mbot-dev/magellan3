import { useEffect, useContext } from "react";
import pluginContainer from "./plugins/PluginContainer";
import PluginPoint from "./plugins/PluginPoint";
// import { usePlugin } from "./plugins/PluginContext";
import MyPlugin from "./plugins/MyPlugin";
import { PluginContext } from "./plugins/PluginContext";
import TestPlugin from "./plugins/TestPlugin";

const App = () => {
	const [{ execute }, dispatch] = useContext(PluginContext); // usePlugin();

	useEffect(() => {
		const loadPlugins = (pluginList) => {
			pluginList.forEach((plugin) => {
				const PluginClass = plugin.plugPoint;
				const pluginInstance = new PluginClass();
				pluginContainer.register(pluginInstance);
			});
			pluginContainer.loadPlugins();
			dispatch({ type: "start" });
		};
		// このリストを動的に生成する必要がある
		const arr = [];
		arr.push({ plugPoint: MyPlugin });
		loadPlugins(arr);
	}, []);

	return (
		<div>
			<h2>Plugin Test</h2>
			{execute && (
				<PluginPoint
					name="app_message"
					start={execute}
					onStop={() => dispatch({ type: "stop" })}
				/>
			)}
			{/* <TestPlugin start={execute} onStop={() => dispatch({ type: "stop" })} /> */}
		</div>
	);
};

export default App;
