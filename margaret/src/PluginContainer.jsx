class PluginContainer {
	constructor() {
		this.plugins = [];
	}

	register(plugin) {
		console.log("Registering plugin", plugin);
		this.plugins.push(plugin);
	}

	loadPlugins() {
		console.log("Loading plugins");
		this.plugins.forEach((plugin) => plugin.init());
	}

	renderPlugins() {
		return this.plugins.map((plugin, index) => (
			<div key={index}>{plugin.render()}</div>
		));
	}
}

export default new PluginContainer();
