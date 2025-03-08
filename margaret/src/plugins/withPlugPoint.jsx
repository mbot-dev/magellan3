const withPlugPoint = (Component) => {
	const WrappedComponent = (props) => {
		return <Component {...props} />;
	};
	WrappedComponent.displayName = `withPlugPoint(${
		Component.displayName || Component.name || "Component"
	})`;
	return WrappedComponent;
};

export default withPlugPoint;
