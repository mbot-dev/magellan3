import { fetchDELETE, fetchGET, fetchPOST } from "./magellanIO";

const BASE_URL = "/karte/api/v1/lab_test";

class LabTestService {
  constructor() {}

  async getLabTestPivot(fc_id, pt_id, limit, offset, client_order) {
    const path = `${BASE_URL}/pivot`;
    const params = {
      fc_id,
      pt_id,
      limit,
      offset,
      client_order,
    };
    return fetchGET(path, params);
  }

  async saveLabTest(module) {
    return await fetchPOST(BASE_URL, module);
  }

  async deleteLabTest(pk) {
    return await fetchDELETE(`${BASE_URL}/${pk}`);
  }

  async getAbnormalLabTest(module_id) {
    const path = `${BASE_URL}/abnormal`;
    const params = {
      module_id,
    };
    return await fetchGET(path, params);
  }
}

export default LabTestService;
