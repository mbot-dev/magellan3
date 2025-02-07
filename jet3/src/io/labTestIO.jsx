import {fetchDELETE, fetchGET, fetchPOST} from './magellanIO';

const BASE_URL = '/karte/api/v1/lab_test';

export const getLabTestPivot = async (fc_id, pt_id, limit, offset, client_order) => {
    const path = `${BASE_URL}/pivot`;
    const params = {
        fc_id,
        pt_id,
        limit,
        offset,
        client_order
    };
    return fetchGET(path, params);
};

export const saveLabTest = async module => {
    return await fetchPOST(BASE_URL, module);
};

export const deleteLabTest = async pk => {
    return await fetchDELETE(`${BASE_URL}/${pk}`);
};

export const getAbnormalLabTest = async module_id => {
    const path = `${BASE_URL}/abnormal`;
    const params = {
        module_id,
    };
    return await fetchGET(path, params);
};
