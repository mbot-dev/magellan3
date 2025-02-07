export const initialState = {
    mode: 'capture',
    token: null
};

export const reducer = (state, action) => {
    switch (action.type) {
        case 'mode':
            return {
                ...state,
                mode: action.mode,
                token: action.token
            }
        default:
            return state;
    }
};
