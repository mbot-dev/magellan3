import pluginContainer from "./PluginContainer";

const PluginPoint = () => {
	return <div>{pluginContainer.renderPlugins("MyFirstPlugin")}</div>;
};

export default PluginPoint;