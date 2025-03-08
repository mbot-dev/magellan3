import React, { useEffect } from "react";
import withPlugPoint from "./withPlugPoint";

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const TestPlugin = ({ start, onStop }) => {
	useEffect(() => {
		if (!start) {
			return;
		}
		sleep(3000).then(() => {
			onStop();
		});
	}, [start]);

	return start ? (
		<div style={{ padding: "32px" }}>Plugin is running</div>
	) : null;
};

const PluginAtPoint = withPlugPoint(TestPlugin);
export default PluginAtPoint;

