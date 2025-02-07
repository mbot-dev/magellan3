import {useEffect, useState} from "react";
import dateFormat from 'dateformat';

const KB = 1024;
const MB = 1048576;  // 1024 * 1024;
const GB = 1073741824;  // 1024 * 1024 * 1024;
const LAST_MODIFIED_FORMAT = 'yyyy-mm-dd HH:MM';

export const useFileInfo = file => {
    const [name, setName] = useState('');
    const [size, setSize] = useState('');
    const [lastModified, setLastModified] = useState('');

    useEffect(() => {
        if (!file) {
            return;
        }
        setName(file.name);
        setLastModified(dateFormat(new Date(file.lastModified), LAST_MODIFIED_FORMAT));
        const fileSize = file.size;
        if (fileSize < KB) {
            setSize(size => `${size} B`);

        } else if (fileSize >= KB && fileSize < MB) {
            const s = (fileSize / KB).toFixed(0);
            setSize(`${s} KB`);

        } else if (fileSize >= MB && fileSize < GB) {
            const s = (fileSize / MB).toFixed(1);
            setSize(`${s} MB`);

        } else {
            const s = (fileSize / GB).toFixed(1);
            setSize(`${s} GB`);
        }
        
    }, [file]);

    return [name, size, lastModified];
};
