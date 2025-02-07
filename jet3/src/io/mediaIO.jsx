import {Buffer} from 'buffer';
import {keysToCamel, keysToSnake} from "../util/strings";
import connectionManager from "./connectionManager";

export const deleteImage = async (path, payload) => {
    const token = connectionManager.getAccessToken();
    const url = connectionManager.getEndPoint(path);
    const config = {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(keysToSnake(payload))
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        return {
            error: {
                url,
                status: res.status
            }
        };
    }
    const data = await res.json();
    return keysToCamel(data);
};

export const getImageSource = async src => {
    const token = connectionManager.getAccessToken();
    const url = connectionManager.getEndPoint(src);
    const config = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        return {
            error: {
                url,
                status: res.status
            }
        };
    }
    const data = await res.arrayBuffer();
    const contentType = res.headers.get('content-type');
    return `data:${contentType};base64,${Buffer.from(data, "binary").toString("base64")}`;
};

export const upload = async (path, formData) => {
    const token = connectionManager.getAccessToken();
    const url = connectionManager.getEndPoint(path);
    const config = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        return {
            error: {
                url,
                status: res.status
            }
        };
    }
    const data = await res.json();
    return keysToCamel(data);
};

export const download = async (path) => {
    const token = connectionManager.getAccessToken();
    const url = connectionManager.getEndPoint(path);
    const config = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    const res = await fetch(url, config);
    if (!res.ok) {
        return {
            error: {
                url,
                status: res.status
            }
        };
    }
    return await res.blob();
};
