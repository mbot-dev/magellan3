import React from "react";
import pluginContainer from "./PluginContainer";

const PluginPoint = (props) => {
	const { name, ...rest } = props;
	return (
		<React.Fragment>{pluginContainer.renderPlugin(name, rest)}</React.Fragment>
	);
};

export default PluginPoint;
