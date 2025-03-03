class PluginContainer {
  constructor() {
    this.plugins = {};
  }

  register(plugin) {
    const name = plugin.getName();
    this.plugins[name] = plugin;
  }

  loadPlugins() {
    Object.keys(this.plugins).forEach((key) => {
      this.plugins[key].init();
    });
  }

  renderPlugins(name) {
    if (name) {
      return this.plugins[name].render();
    }
  }
}

export default new PluginContainer();
