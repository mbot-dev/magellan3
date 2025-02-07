import {fetchGET, fetchPOST, fetchPUT, fetchDELETE} from './magellanIO';

const BASE_URL = '/karte/api/v1/document';

export const getDocumentListByFacility = async facility_id => {
    const path = `${BASE_URL}/facility`;
    const params = {
        facility_id
    };
    return await fetchGET(path, params);
};

export const getDocumentListByPatient = async (facility_id, patient_id) => {
    const path = `${BASE_URL}/patient`;
    const params = {
        facility_id,
        patient_id
    };
    return await fetchGET(path, params);
};

export const getDocument = async pk => {
    const path = `${BASE_URL}/${pk}`;
    return await fetchGET(path);
};

export const saveDocument = async doc => {
    const path = `${BASE_URL}`;
    return await fetchPOST(path, doc);
};

export const updateDocument = async (pk, doc) => {
    const path = `${BASE_URL}/${pk}`;
    return await fetchPUT(path, doc);
};

export const deleteDocument = async pk => {
    const path = `${BASE_URL}/${pk}`;
    return await fetchDELETE(path);
};
