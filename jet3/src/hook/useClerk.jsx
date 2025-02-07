import {useEffect, useState} from "react";

export const useClerk = user => {
    const [clerk, setClerk] = useState(null);
    useEffect(() => {
        if (user) {
            const value = user.license !== 'doctor' ? {id: user.id, name: user.fullName} : null;
            setClerk(value);
        }

    }, [user]);
    
    return clerk;
};
