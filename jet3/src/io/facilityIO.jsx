import {fetchGET, fetchPOST, fetchPUT} from './magellanIO';

const FACILITY_URL = '/karte/api/v1/facility';

export const updateFacility = async (pk, payload) => {
    const path = `${FACILITY_URL}/${pk}`;
    return await fetchPUT(path, payload);
};

export const getTimeSchedule = async (facility_id) => {
    const path = `${FACILITY_URL}/time_schedule`;
    const params = { facility_id };
    return await fetchGET(path, params);
};

export const replaceTimeSchedule = async (payload) => {
    const path = `${FACILITY_URL}/time_schedule`;
    return await fetchPOST(path, payload);
};

export const getStandard = async (facility_id) => {
    const path = `${FACILITY_URL}/standard`;
    const params = { facility_id };
    return await fetchGET(path, params);
};

export const replaceStandard = async (payload) => {
    const path = `${FACILITY_URL}/standard`;
    return await fetchPOST(path, payload);
};

export  const getPrefectureCode = async (name) => {
    const path = '/master/api/v1/prefecture_code';
    const params = { name };
    return await fetchGET(path, params);
};