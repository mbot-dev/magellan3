import {useEffect} from "react";

export const useIsOnline = dispatch => {
    useEffect(() => {
        if (!dispatch) {
            return;
        }
        const updateNetwork = () => {
            const online = window.navigator.onLine;
            dispatch({type: 'isOnline', isOnline: online});
        };
        window.addEventListener("offline", updateNetwork);
        window.addEventListener("online", updateNetwork);
        return () => {
            window.removeEventListener("offline", updateNetwork);
            window.removeEventListener("online", updateNetwork);
        };
    }, [dispatch]);
};

