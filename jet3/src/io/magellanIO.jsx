import {keysToCamel, keysToSnake} from "../util/strings";
import connectionManager from './connectionManager';

const DEBUG = false;

function APIError(url, status) {
    this.url = url;
    this.status = status;
    this.name = 'API Error';
};

export const withLog = fn => async (...args) => {
    const res = await fn(...args);
    const { url, status } = res;
    if (!res.ok) {
        throw new APIError(url, status);
    }
    console.log(`API call status ${res.status} for ${url}`);
    const data = await res.json();
    if (DEBUG) {
        console.log(JSON.stringify(data, null, 3));
    }
    return data;
};

export const fetchGET = async (path, params = null) => {
    const url = connectionManager.getEndPoint(path, params);
    const token = connectionManager.getAccessToken();
    const config = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    const data = await withLog(fetch)(url, config);
    return keysToCamel(data);
};

export const fetchPOST = async (path, payload) => {
    const body = JSON.stringify(keysToSnake(payload));
    const url = connectionManager.getEndPoint(path);
    const token = connectionManager.getAccessToken();
    const config = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: body
    };
    const data = await withLog(fetch)(url, config);
    return keysToCamel(data);
};

export const fetchPUT = async (path, payload) => {
    const url = connectionManager.getEndPoint(path);
    const token = connectionManager.getAccessToken();
    const config = {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(keysToSnake(payload))
    };
    const data = await withLog(fetch)(url, config);
    return keysToCamel(data);
};

export const fetchDELETE = async (path, params=null) => {
    const url = connectionManager.getEndPoint(path);
    const token = connectionManager.getAccessToken();
    return await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};