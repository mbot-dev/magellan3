import { fetchGET, fetchPOST, fetchPUT } from "./magellanIO";

const FACILITY_URL = "/karte/api/v1/facility";

class FacilityService {
  constructor() {}

  async updateFacility(pk, payload) {
    const path = `${FACILITY_URL}/${pk}`;
    return await fetchPUT(path, payload);
  }

  async getTimeSchedule(facility_id) {
    const path = `${FACILITY_URL}/time_schedule`;
    const params = { facility_id };
    return await fetchGET(path, params);
  }

  async replaceTimeSchedule(payload) {
    const path = `${FACILITY_URL}/time_schedule`;
    return await fetchPOST(path, payload);
  }

  async listNotifications(facility_id) {
    const path = `${FACILITY_URL}/notification`;
    const params = { facility_id };
    return await fetchGET(path, params);
  }

  async updateNotifications(facility_id, data) {
    const path = `${FACILITY_URL}/notification`;
    const payload = { facility_id, data };
    return await fetchPUT(path, payload);
  }

  async getPrefectureCode(name) {
    const path = "/master/api/v1/prefecture_code";
    const params = { name };
    return await fetchGET(path, params);
  }
}

export default FacilityService;
