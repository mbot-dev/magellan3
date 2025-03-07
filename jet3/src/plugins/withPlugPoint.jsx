const withPlugPoint = (Component) => {
  const WrappedComponent = (props) => {
    const { start, ...others } = props;
    return start === "true" ? <Component {...others} /> : null;
  };
  WrappedComponent.displayName = `withPlugPoint(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
};

export default withPlugPoint;

// How to build a simple plugin system for custom React hooks
