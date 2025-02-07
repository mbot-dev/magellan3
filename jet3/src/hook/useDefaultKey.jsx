import { useEffect } from "react";

export const useDefaultKey = (enabled, callback) => {
    useEffect(() => {
        const done = e => {
            // Return || Space
            if (enabled && (e.keyCode === 13 || e.keyCode === 32)) {
                e.preventDefault();
                callback();
            }
        };
        window.addEventListener('keydown', done);
        return () => window.removeEventListener('keydown', done);

    }, [enabled, callback]);
    
};
