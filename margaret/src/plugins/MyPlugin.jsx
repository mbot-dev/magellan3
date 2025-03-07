import React, { useContext, useEffect } from "react";
import PluginInterface from "./PluginInterface";
import { PluginContext } from "./PluginContext";

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const MyUI = () => {
	const [{ execute }, dispatch] = useContext(PluginContext) // usePlugin();
       
	useEffect(() => {
		if (!execute) {
			return;
		}
		sleep(3000).then(() => {
			dispatch({ type: "stop" });
		});
	}, [execute]);

	return execute ? (
		<div style={{ padding: "32px" }}>Plugin is running</div>
	) : (
		<div>Plugin is not running</div>
	);
};

class MyPlugin extends PluginInterface {
	constructor() {
		super();
		this.plugPoint = "app_message";
	}

	getPlugPoint() {
		return this.plugPoint;
	}

	init() {
		console.log("MyFirstPlugin initialized");
	}

	render() {
		return <MyUI />;
	}
}

export default MyPlugin;
