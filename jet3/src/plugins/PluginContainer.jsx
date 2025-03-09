import StandardsAI from "./StandardsAI";

class PluginContainer {
	constructor() {
		this.plugins = {};
	}

	registerPlugins() {
		const arr = [];
		arr.push({ facilityStandards: StandardsAI }); // plugPoint: PluginClass
		arr.forEach((plugin) => {
			Object.keys(plugin).forEach((key) => {
				this.plugins[key] = new plugin[key]();
			});
		});
	}

	loadPlugins() {
		Object.keys(this.plugins).forEach((key) => {
			this.plugins[key].init();
		});
	}

	renderPlugin(name, props) {
		if (this.plugins[name]) {
			return this.plugins[name].render(props);
		}
		return null;
	}
}

export default new PluginContainer();
