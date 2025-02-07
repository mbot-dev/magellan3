import { useEffect } from 'react';

export const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = e => {
            if (ref && ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };

    }, [ref, callback]);
};