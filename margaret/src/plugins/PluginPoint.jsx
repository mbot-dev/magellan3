import pluginContainer from "./PluginContainer";

const PluginPoint = (props) => {
  const { name, ...rest } = props;
  return <div>{pluginContainer.renderPlugin(name, rest)}</div>;
};

export default PluginPoint;
