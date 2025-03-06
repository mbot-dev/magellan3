import React from "react";
import pluginContainer from "./PluginContainer";

const PluginPoint = ({name}) => {
	return <div>{pluginContainer.renderPlugins(name)}</div>;
};

export default PluginPoint;