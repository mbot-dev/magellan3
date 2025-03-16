const withDisplayNull = (Component) => {
  const WrappedComponent = (props) => {
    const { show, ...rest } = props;
    return show === "true" ? <Component {...rest} /> : null;
  };
  WrappedComponent.displayName = `withDisplayNull(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
};

export default withDisplayNull;
