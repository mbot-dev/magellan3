import StandardsAI from "./StandardsAI";

class PluginContainer {
	constructor() {
		this.plugins = {};
	}

	registerPlugins() {
		const arr = [];
		arr.push(StandardsAI);
		arr.forEach((plugin) => {
			const instance = new plugin();
			const plugPoint = instance.plugPoint;
			this.plugins[plugPoint] = instance;
		});
	}

	loadPlugins() {
		Object.keys(this.plugins).forEach((key) => {
			this.plugins[key].init();
		});
	}

	renderPlugin(plugPoint, props) {
		if (this.plugins[plugPoint]) {
			return this.plugins[plugPoint].render(props);
		}
		return null;
	}
}

export default new PluginContainer();
