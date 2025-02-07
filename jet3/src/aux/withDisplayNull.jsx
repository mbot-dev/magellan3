const withDisplayNull = (Component) => {
  const WrappedComponent = (props) => {
    const { show, ...others } = props;
    return show === "true" ? <Component {...others} /> : null;
  };
  WrappedComponent.displayName = `withDisplayNull(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
};

export default withDisplayNull;
