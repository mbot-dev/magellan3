const initialState = {
	execute: false,
};

const reducer = (state, action) => {
	switch (action.type) {
		case "start":
			return { execute: true };
		case "stop":
			return { execute: false };
		default:
			return state;
	}
};

export { initialState, reducer };