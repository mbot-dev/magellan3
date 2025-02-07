import {fetchPOST, fetchGET} from './magellanIO';

const BASE_URL = '/iss/api/v1';

export const sendSignupLink = async payload => {
    const path = `${BASE_URL}/send_signup_link`;
    payload['mode'] = 'sign_up';
    return await fetchPOST(path, payload);
};

export const sendLoginLink = async payload => {
    const path = `${BASE_URL}/send_signup_link`;
    payload['mode'] = 'login';
    return await fetchPOST(path, payload);
};

export const requestRefreshAndAccessToken = async payload => {
    const path = `${BASE_URL}/refresh_token`;
    return await fetchPOST(path, payload);
};

export const requestWhiteToken = async payload => {
    const path = `${BASE_URL}/white_token`;
    return await fetchPOST(path, payload);
};

export const sendInviteLink = async payload => {
    const path = `${BASE_URL}/send_add_user_link`;
    return await fetchPOST(path, payload);
};

export const sendChangeUsernameLink = async payload => {
    const path = `${BASE_URL}/change_username`;
    return await fetchPOST(path, payload);
};

export const ping = async payload => {
    const path = `${BASE_URL}/ping`;
    return await fetchPOST(path, payload);
};

export const call = async payload => {
    const path = `${BASE_URL}/call`;
    return await fetchPOST(path, payload);
};

export const meet = async () => {
    const path = `${BASE_URL}/meet`;
    return await fetchGET(path);
};
