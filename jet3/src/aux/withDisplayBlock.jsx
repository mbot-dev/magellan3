const withDisplayBlock = (Component) => {
  const WrappedComponent = ({ show, ...rest }) => {
    const disp =
      show && show === "true" ? { display: "block" } : { display: "none" };
    return (
      <div style={disp}>
        <Component {...rest} />
      </div>
    );
  };
  WrappedComponent.displayName = `withDisplayBlock(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
};

export default withDisplayBlock;
