class PluginLoader {
  constructor() {
    this.plugins = [];
  }

  async loadPlugins() {
    const response = await fetch("http://localhost:3000/plugins");
    const plugins = await response.json();
    plugins.forEach((plugin) => {
      const script = document.createElement("script");
      script.src = plugin.url;
      script.onload = () => {
        // Here we are assuming that the plugin script will expose a class with the same name as the plugin
        const Plugin = window[plugin.name];
        this.plugins.push(new Plugin());
      };
      document.body.appendChild(script);
    });
  }

  getPlugins() {
    return this.plugins;
  }
}
