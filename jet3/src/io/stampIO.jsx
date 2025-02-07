import { fetchGET, fetchPOST, fetchPUT, fetchDELETE } from "./magellanIO";

const BASE_URL = "/karte/api/v1/stamp";
const BASE_URL_DISEASE = "/karte/api/v1/stamp/disease";

export const getDiseaseStampList = async (facility_id) => {
  const params = {
    facility_id,
  };
  return await fetchGET(BASE_URL_DISEASE, params);
};

export const saveDiseaseStamp = async (stamp) => {
  return await fetchPOST(BASE_URL_DISEASE, stamp);
};

export const updateDiseaseOrder = async (data) => {
  const path = `${BASE_URL_DISEASE}/order`;
  return await fetchPUT(path, data);
};

export const updateDiseaseStamp = async (pk, data) => {
  const path = `${BASE_URL_DISEASE}/${pk}`;
  return await fetchPUT(path, data);
};

export const deleteDiseaseStamp = async (pk) => {
  const path = `${BASE_URL_DISEASE}/${pk}`;
  return await fetchDELETE(path);
};

export const getStampList = async (facility_id, entity) => {
  const path = `${BASE_URL}/entity`;
  const params = {
    facility_id,
    entity,
  };
  return fetchGET(path, params);
};

export const saveStamp = async (stamp) => {
  return await fetchPOST(BASE_URL, stamp);
};

export const updateStamp = async (pk, data) => {
  const path = `${BASE_URL}/name/${pk}`;
  return await fetchPUT(path, data);
};

export const deleteStamp = async (pk) => {
  const path = `${BASE_URL}/${pk}`;
  return await fetchDELETE(path);
};

export const updateStampOrder = async (data) => {
  const path = `${BASE_URL}/order`;
  return await fetchPUT(path, data);
};

// 使用中の診療行セットを取得する
export const getUsingProcedures = async (facility_id) => {
  const params = {
    facility_id,
  };
  const path = `${BASE_URL}/using_procedure`;
  return await fetchGET(path, params);
};

// 使用する診療行為セットを更新する
export const updateUsingProcedures = async (facility_id, arr) => {
  const path = `${BASE_URL}/using_procedure/${facility_id}`;
  return await fetchPUT(path, arr);
};

// 使用しているInputsCatalogueを取得する
// 空の場合はデフォルトの入力項目がサーバー側でコピーされる
export const getUsingInput = async (facility_id) => {
  const params = {
    facility_id,
  };
  const path = `${BASE_URL}/using_input`; // /karte/api/v1/using_input/stamp he
  return await fetchGET(path, params);
};

export const updateUsingInput = async (facility_id, arr) => {
  const path = `${BASE_URL}/using_input/${facility_id}`;
  return await fetchPUT(path, arr);
};
