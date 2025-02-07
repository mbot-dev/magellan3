import {fetchGET, fetchPOST, fetchDELETE} from './magellanIO';

const RISK_BASE_URL = '/karte/api/v1/risk';

export const getEntities = async (entity, facility_id, patient_id) => {
    const path = `${RISK_BASE_URL}/${entity}`;
    const params = {
        facility_id,
        patient_id,
    };
    return await fetchGET(path, params);
};

export const upcertRisk = async (entity, data) => {
    const path = `${RISK_BASE_URL}/${entity}`;
    return await fetchPOST(path, data);
};

export const deleteRisk = async (entity, pk) => {
    const path = `${RISK_BASE_URL}/${entity}/${pk}`;
    return await fetchDELETE(path);
};

export const getSummaryMemo = async (facility_id, patient_id) => {
    const path = `${RISK_BASE_URL}/summary_memo`;
    const params = {
        facility_id,
        patient_id,
    };
    return await fetchGET(path, params);
};

export const upcertSummaryMemo = async data => {
    const path = `${RISK_BASE_URL}/summary_memo`;
    return fetchPOST(path, data);
};
