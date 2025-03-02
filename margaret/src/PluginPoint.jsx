import React from "react";
import pluginContainer from "./PluginContainer";

const PluginPoint = () => {
	return <div>{pluginContainer.renderPlugins()}</div>;
};

export default PluginPoint;