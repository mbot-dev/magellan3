import { useEffect } from "react";
import pluginContainer from "./plugins/PluginContainer";
import PluginPoint from "./plugins/PluginPoint";
import {usePlugin} from "./plugins/PluginContext";

const App = () => {
	const [{execute}, dispatch] = usePlugin();

	useEffect(() => {
		const loadPlugins = async () => {
      const className = "MyPlugin";
      const PluginClass = window[className];
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
			{execute && <PluginPoint name="MyPlugin"/>}
		</div>
	);
};

export default App;
