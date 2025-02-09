import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/stamp";
const BASE_URL_DISEASE = "/karte/api/v1/stamp/disease";

class StampServce {
  constructor() {}

  async getDiseaseStampList(facility_id) {
    const params = {
      facility_id,
    };
    return await fetchGET(BASE_URL_DISEASE, params);
  }

  async saveDiseaseStamp(stamp) {
    return await fetchPOST(BASE_URL_DISEASE, stamp);
  }

  async updateDiseaseOrder(data) {
    const path = `${BASE_URL_DISEASE}/order`;
    return await fetchPUT(path, data);
  }

  async updateDiseaseStamp(pk, data) {
    const path = `${BASE_URL_DISEASE}/${pk}`;
    return await fetchPUT(path, data);
  }

  async deleteDiseaseStamp(pk) {
    const path = `${BASE_URL_DISEASE}/${pk}`;
    return await fetchDELETE(path);
  }

  async getStampList(facility_id, entity) {
    const path = `${BASE_URL}/entity`;
    const params = {
      facility_id,
      entity,
    };
    return fetchGET(path, params);
  }

  async saveStamp(stamp) {
    return await fetchPOST(BASE_URL, stamp);
  }

  async updateStamp(pk, data) {
    const path = `${BASE_URL}/name/${pk}`;
    return await fetchPUT(path, data);
  }

  async deleteStamp(pk) {
    const path = `${BASE_URL}/${pk}`;
    return await fetchDELETE(path);
  }

  async updateStampOrder(data) {
    const path = `${BASE_URL}/order`;
    return await fetchPUT(path, data);
  }

  // 使用中の診療行セットを取得する
  async getUsingProcedures(facility_id) {
    const params = {
      facility_id,
    };
    const path = `${BASE_URL}/using_procedure`;
    return await fetchGET(path, params);
  }

  // 使用する診療行為セットを更新する
  async updateUsingProcedures(facility_id, arr) {
    const path = `${BASE_URL}/using_procedure/${facility_id}`;
    return await fetchPUT(path, arr);
  }

  // 使用しているInputsCatalogueを取得する
  // 空の場合はデフォルトの入力項目がサーバー側でコピーされる
  async getUsingInput(facility_id) {
    const params = {
      facility_id,
    };
    const path = `${BASE_URL}/using_input`; // /karte/api/v1/using_input/stamp he
    return await fetchGET(path, params);
  }

  async updateUsingInput(facility_id, arr) {
    const path = `${BASE_URL}/using_input/${facility_id}`;
    return await fetchPUT(path, arr);
  }
}

export default StampServce;
