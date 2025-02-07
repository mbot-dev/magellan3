import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from './magellanIO';

const PVT_BASE = '/karte/api/v1/pvt';

// 患者登録
export const savePatient = async (patient) => {
    const path = '/karte/api/v1/patients';
    return await fetchPOST(path, patient);
};

// 患者情報更新
export const updatePatient = async (patient) => {
    const ptId = patient.pt_id;
    const path = `/karte/api/v1/patients/${ptId}`;
    return await fetchPUT(path, patient);
};

// 患者削除
export const deletePatient = async (patient_id) => {
    const path = `/karte/api/v1/patients/${patient_id}`;
    return await fetchDELETE(path);
};

export const getPatientVisits = async (facility_id, pvt_date, limit, offset) => {
    const params = {
        facility_id,
        pvt_date,
        limit,
        offset,
    };
    return await fetchGET(PVT_BASE, params);
};

export const saveVisit = async (visit) => {
    return await fetchPOST(PVT_BASE, visit);
};

export const updateVisit = async (visit) => {
    return await fetchPUT(PVT_BASE, visit);
};

export const updateStatus = async (facilityId, pvtId, status) => {
    return await fetchPUT(PVT_BASE, { facilityId, pvtId, status, });
};

export const unlockVisit = async (facilityId, pvtId) => {
    return await fetchPUT(PVT_BASE, { facilityId, pvtId, lockedBy: ''});
};

export const deleteVisit = async (facility_id, pvt_id) => {
    const path = `${PVT_BASE}/${facility_id}/${pvt_id}`;
    return await fetchDELETE(path);
};

export const getVisitLock = async (facility_id, user_name, pvt_id) => {
    const params = {
        facility_id,
        user_name,
        pvt_id,
    };
    return await fetchGET(`${PVT_BASE}/lock`, params);
};
