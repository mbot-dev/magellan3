import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/diagnosis";

class DiagnosisService {
  constructor() {}

  async getList(facility_id, patient_id) {
    const path = `${BASE_URL}/list`;
    const params = {
      facility_id,
      patient_id,
    };
    return await fetchGET(path, params);
  }

  async getContinuedDisease(facility_id, patient_id) {
    const path = `${BASE_URL}/active`;
    const params = {
      facility_id,
      patient_id,
    };
    return await fetchGET(path, params);
  }

  async save(data) {
    const path = `${BASE_URL}`;
    return await fetchPOST(path, data);
  }

  async update(data) {
    const pk = data.id;
    const path = `${BASE_URL}/${pk}`;
    return await fetchPUT(path, data);
  }

  async delete(pk) {
    const path = `${BASE_URL}/${pk}`;
    return await fetchDELETE(path);
  }
}

export default DiagnosisService;
