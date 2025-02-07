import { fetchGET } from './magellanIO';

const BASE_URL = '/karte/api/v1/patients';

export const find = async (facility_id, attribute, search) => {
    const params = {
        facility_id,
        attribute,
        search,
    };
    return await fetchGET(BASE_URL, params);
};

export const getPatient = async (facility_id, patient_id) => {
    const params = {
        facility_id,
        patient_id,
    };
    return await fetchGET(BASE_URL, params);
};
