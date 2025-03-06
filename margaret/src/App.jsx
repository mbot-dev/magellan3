import { useEffect } from "react";
import pluginContainer from "./plugins/PluginContainer";
import PluginPoint from "./plugins/PluginPoint";
import { usePlugin } from "./plugins/PluginContext";
import MyPlugin from "./plugins/MyPlugin";

function getClass(classname) {
	return window[classname];
}

const App = () => {
	const [{ execute }, dispatch] = usePlugin();

	useEffect(() => {
		// ßwindow.MyPlugin = MyPlugin;
		const loadPlugins = async () => {
			const className = "MyPlugin";
			const PluginClass = getClass(className);
			if (PluginClass) {
				const pluginInstance = new PluginClass();
				pluginContainer.register(pluginInstance);
				pluginContainer.loadPlugins();
				dispatch({ type: "start" });
			} else {
				console.error(`Class ${className} not found`);
			}
		};
		loadPlugins();
	}, []);

	return (
		<div>
			<h2>Plugin Test</h2>
			{execute && <PluginPoint name="app_message" />}
		</div>
	);
};

export default App;
