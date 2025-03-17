import { useEffect, useContext } from "react";
import pluginContainer from "./plugins/PluginContainer";
import PluginPoint from "./plugins/PluginPoint";
import MyUI from "./plugins/MyPlugin";
import { PluginContext } from "./plugins/PluginContext";

const App = () => {
    const [{ execute }, dispatch] = useContext(PluginContext);

    useEffect(() => {
        // MyUIをグローバルスコープに登録
        window.MyUI = MyUI;

        const sc = `
        class MyPlugin {
            constructor() {}
        
            get name() {
                return "MyPlugin";
            }
        
            get plugPoint() {
                return "app_message";
            }
        
            init() {
                console.log("App Message Plugin initialized");
            }
        
            render(props) {
                return <window.MyUI {...props});
            }
        }

        window.MyPlugin = MyPlugin;
        `;
        // const script = document.createElement("script");
        // script.textContent = sc;
        // script.onload = () => {
        //     const PluginClass = window['MyPlugin'];
        //     if (PluginClass) {
        //         const pluginInstance = new PluginClass();
				// 				console.log(pluginInstance.name);
				// 				console.log(pluginInstance.plugPoint);
        //         pluginContainer.register(pluginInstance);
        //         pluginContainer.loadPlugins();
        //         dispatch({ type: "start" });
        //     } else {
        //         console.error("Class MyPlugin not found");
        //     }
        // };
				// document.body.appendChild(script);
				// evalを使用してスクリプトを評価
        eval(sc);

        const PluginClass = window['MyPlugin'];
        if (PluginClass) {
            const pluginInstance = new PluginClass();
            console.log(pluginInstance.name);
            console.log(pluginInstance.plugPoint);
            pluginContainer.register(pluginInstance);
            pluginContainer.loadPlugins();
            dispatch({ type: "start" });
        } else {
            console.error("Class MyPlugin not found");
        }
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
		</div>
	);
};

export default App;