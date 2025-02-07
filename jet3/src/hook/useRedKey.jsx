import { useCallback, useEffect } from "react";

const IS_MAC = navigator.userAgent.indexOf('Mac') >= 0;

// R=82, r=82
export const useRedKey = (ref, callback) => {
    const red = useCallback(e => {
        if ((e.metaKey && IS_MAC && e.keyCode === 82) || (e.ctrlKey && !IS_MAC && e.keyCode === 82)) {
            e.preventDefault();
            callback();
        }
    }, [callback]);

    useEffect(() => {
        if (!ref || !ref.current) {
            return;
        }
        const target = ref.current;
        target.addEventListener('keydown', red);
        return () => target.removeEventListener('keydown', red);

    }, [ref, red]);
};
