import {useEffect} from "react";

export const useIntersectionObserver = (element, threshold, callback) => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const [first] = entries;
                if (first.isIntersecting) {
                    callback();
                }
            },
            {threshold: threshold}
        );
        const currEle = element?.current;
        if (currEle) {
            observer.observe(currEle);
        }
        return () => {
            if (currEle) {
                observer.unobserve(currEle);
            }
        };
    }, [element, threshold, callback]);
};
