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

	renderPlugins(point) {
		if (this.plugins[point]) {
			return this.plugins[point].render();
		}
	}
}

export default new PluginContainer();
