import {useEffect, useState} from "react";

export const useFacility = user => {
    const [facility, setFacility] = useState(null);
    useEffect(() => {
        if (user && user.currFc && user['facilities'].length) {
            const arr = user['facilities'].filter(x=>x.id===user.currFc);
            const facility = arr.length > 0 ? arr[0] : null;
            setFacility(facility);
        }

    }, [user]);

    return facility;
};
