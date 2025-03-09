export default class PluginInterface {
  init() {
    throw new Error("init() must be implemented by the plugin");
  }

  render() {
    throw new Error("render() must be implemented by the plugin");
  }
}
