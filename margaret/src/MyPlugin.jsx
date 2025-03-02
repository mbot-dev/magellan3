import PluginInterface from "./PluginInterface";

class MyPlugin extends PluginInterface {
	init() {
		console.log("MyPlugin initialized");
	}

	render() {
		return <div>My Plugin Content</div>;
	}
}

export default MyPlugin;
