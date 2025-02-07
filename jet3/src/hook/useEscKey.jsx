import {useCallback, useEffect} from "react";

export const useEscKey = callback => {
    const close = useCallback(e => {
        if (e.keyCode === 27) {
            callback();
        }
    }, [callback]);

    useEffect(() => {
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
        
    }, [close]);
};
