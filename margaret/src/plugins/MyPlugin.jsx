import React, { useEffect } from "react";
import PluginInterface from "./PluginInterface";
import {usePlugin} from "./PluginContext";

const sleep = (ms)=> {
	return new Promise(resolve => setTimeout(resolve, ms));
};

const MyUI = () => {
	const [{execute}, dispatch] = usePlugin();

	useEffect(() => {
		if (!execute) {
			return;
		}
		sleep(3000).then(() => {
			dispatch({type: "stop"});
		});
	}
	, [execute]);

	return execute ? (
		<div style={{padding: '32px'}}>Plugin is running</div>
	) : (
		<div>Plugin is not running</div>
	); 
};

class MyPlugin extends PluginInterface {
	constructor() {
		super();
		this.name = "MyPlugin";
	}

	getName() {
		return this.name;
	}

	init() {
		console.log("MyFirstPlugin initialized");
	}

	render() {
		return <MyUI />;
	}
}

window["MyPlugin"] = MyPlugin;

export default MyPlugin;
 