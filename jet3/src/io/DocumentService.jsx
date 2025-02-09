import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/document";

class DocumentService {
  constructor() {}

  async getDocumentListByFacility(facility_id) {
    const path = `${BASE_URL}/facility`;
    const params = {
      facility_id,
    };
    return await fetchGET(path, params);
  }

  async getDocumentListByPatient(facility_id, patient_id) {
    const path = `${BASE_URL}/patient`;
    const params = {
      facility_id,
      patient_id,
    };
    return await fetchGET(path, params);
  }

  async getDocument(pk) {
    const path = `${BASE_URL}/${pk}`;
    return await fetchGET(path);
  }

  async saveDocument(doc) {
    const path = `${BASE_URL}`;
    return await fetchPOST(path, doc);
  }

  async updateDocument(pk, doc) {
    const path = `${BASE_URL}/${pk}`;
    return await fetchPUT(path, doc);
  }

  async deleteDocument(pk) {
    const path = `${BASE_URL}/${pk}`;
    return await fetchDELETE(path);
  }
}

export default DocumentService;
