import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/pvt";

class PvtService {
  constructor() {}

  // 患者登録
  async savePatient(patient) {
    const path = "/karte/api/v1/patients";
    return await fetchPOST(path, patient);
  }

  // 患者情報更新
  async updatePatient(patient) {
    const ptId = patient.pt_id;
    const path = `/karte/api/v1/patients/${ptId}`;
    return await fetchPUT(path, patient);
  }

  // 患者削除
  async deletePatient(patient_id) {
    const path = `/karte/api/v1/patients/${patient_id}`;
    return await fetchDELETE(path);
  }

  async getPatientVisits(facility_id, pvt_date, limit, offset) {
    const params = {
      facility_id,
      pvt_date,
      limit,
      offset,
    };
    return await fetchGET(BASE_URL, params);
  }

  async save(visit) {
    return await fetchPOST(BASE_URL, visit);
  }

  async updateVisit(visit) {
    return await fetchPUT(BASE_URL, visit);
  }

  async updateStatus(facilityId, pvtId, status) {
    return await fetchPUT(BASE_URL, { facilityId, pvtId, status });
  }

  async unlockVisit(facilityId, pvtId) {
    return await fetchPUT(BASE_URL, { facilityId, pvtId, lockedBy: "" });
  }

  async delete(facility_id, pvt_id) {
    const path = `${BASE_URL}/${facility_id}/${pvt_id}`;
    return await fetchDELETE(path);
  }

  async getVisitLock(facility_id, user_name, pvt_id) {
    const params = {
      facility_id,
      user_name,
      pvt_id,
    };
    return await fetchGET(`${BASE_URL}/lock`, params);
  }
}

export default PvtService;
