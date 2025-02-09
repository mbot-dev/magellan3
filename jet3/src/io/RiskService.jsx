import { fetchGET, fetchPOST, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/risk";

class RiskService {
  constructor() {}

  async getEntities(entity, facility_id, patient_id) {
    const path = `${BASE_URL}/${entity}`;
    const params = {
      facility_id,
      patient_id,
    };
    return await fetchGET(path, params);
  }

  async upcertRisk(entity, data) {
    const path = `${BASE_URL}/${entity}`;
    return await fetchPOST(path, data);
  }

  async deleteRisk(entity, pk) {
    const path = `${BASE_URL}/${entity}/${pk}`;
    return await fetchDELETE(path);
  }

  async getSummaryMemo(facility_id, patient_id) {
    const path = `${BASE_URL}/summary_memo`;
    const params = {
      facility_id,
      patient_id,
    };
    return await fetchGET(path, params);
  }

  async upcertSummaryMemo(data) {
    const path = `${BASE_URL}/summary_memo`;
    return fetchPOST(path, data);
  }
}

export default RiskService;
