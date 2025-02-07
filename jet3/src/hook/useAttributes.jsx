import {useEffect, useState} from 'react';

export const useAttributes = (spec) => {
    const [title, setTitle] = useState(null);
    const [entity, setEntity] = useState(null);
    const [attributes, setAttributes] = useState(null);
    const [attrKeys, setAttrKeys] = useState(null);
    const [mandatories, setMandatories] = useState(null);
    
    useEffect(() => {
        if (!spec) {
            return;
        }
        setTitle(spec?.title ?? null);
        setEntity(spec?.entity ?? null);
        setAttributes(spec?.attributes ?? null);
        setAttrKeys(spec?.attributes?.map(attr => attr.key) ?? null);
        setMandatories(spec?.attributes?.filter(attr => !attr.isOption).map(attr => attr.key) ?? null);
    }, [spec]);
    return [title, entity, attributes, attrKeys, mandatories];
};