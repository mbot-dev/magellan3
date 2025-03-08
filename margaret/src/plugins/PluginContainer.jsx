class PluginContainer {
	constructor() {
		this.plugins = {};
	}

	register(plugin) {
		const point = plugin.getPlugPoint();
		this.plugins[point] = plugin;
	}

	loadPlugins() {
		Object.keys(this.plugins).forEach((key) => {
			this.plugins[key].init();
		});
	}

	renderPlugins(name, props) {
		if (this.plugins[name]) {
			return this.plugins[name].render(props);
		}
		return null;
	}
}

export default new PluginContainer();
