import {useState, useEffect} from 'react';
import {bundleItemsFrom, displayBundleTitle, isRp} from '../../models/claim';

export const useStamp = stamp => {
    const [claimItems, setClaimItems] = useState([]);
    const [instructions, setInstructions] = useState([]);
    const [title, setTitle] = useState('');
    const [isPrescription, setIsPrescription] = useState(false);

    useEffect(() => {
        if (!stamp) {
            return;
        }
        // ClaimItemとInstructionに分ける
        const [claimItems, instructions] = bundleItemsFrom(stamp);
        setClaimItems(claimItems);
        setInstructions(instructions);
        setTitle(displayBundleTitle(stamp));
        setIsPrescription(isRp(stamp));
    }, [stamp]);

    return [claimItems, instructions, title, isPrescription];
};

