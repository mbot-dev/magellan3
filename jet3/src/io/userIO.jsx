import {fetchGET, fetchPOST, fetchPUT} from './magellanIO';

const USER_URL = '/karte/api/v1/user';
const ACCOUNT_URL = '/account/api/v1';

const urlFor = path => {
    return path.startsWith('/') ? `${ACCOUNT_URL}${path}` : `${ACCOUNT_URL}/${path}`;
};

export const signUp = async payload => {
    const path = urlFor('/sign_up');
    return await fetchPOST(path, payload);
};

export const signIn = async payload => {
    const path = urlFor('/sign_in');
    return await fetchPOST(path, payload);
};

export const listUsers = async (facility_id, status) => {
    const path = `${ACCOUNT_URL}/facility/users`;
    const params = {
        facility_id: facility_id,
        user_status: status
    };
    return await fetchGET(path, params);
};

export const updateUserStatus = async (payload) => {
    const path = `${ACCOUNT_URL}/facility/user_status`;
    return await fetchPUT(path, payload);
};

export const updateUserInfo = async (pk, payload) => {
    const path = `${ACCOUNT_URL}/user/${pk}`;
    return await fetchPUT(path, payload);
};

export const setUserSettings = async (user_id, settings) => {
    const path = `${USER_URL}/settings`;
    const data = {
        user_id,
        settings, 
    };
    return await fetchPUT(path, data);
};


