import {fetchGET, fetchPOST, fetchPUT, fetchDELETE} from './magellanIO';

const RISK_BASE_URL = '/karte/api/v1/diagnosis';

export const getDiagnosisList = async (facility_id, patient_id) => {
    const path = `${RISK_BASE_URL}/list`;
    const params = {
        facility_id,
        patient_id,
    };
    return await fetchGET(path, params);
};

export const getContinuedDisease = async (facility_id, patient_id) => {
    const path = `${RISK_BASE_URL}/active`;
    const params = {
        facility_id,
        patient_id,
    };
    return await fetchGET(path, params);
};

export const saveDiagnosis = async data => {
    const path = `${RISK_BASE_URL}`;
    return await fetchPOST(path, data);
};

export const putDiagnosis = async data => {
    const pk = data.id;
    const path = `${RISK_BASE_URL}/${pk}`;
    return await fetchPUT(path, data);
};

export const deleteDiagnosis = async pk => {
    const path = `${RISK_BASE_URL}/${pk}`;
    return await fetchDELETE(path);
};

