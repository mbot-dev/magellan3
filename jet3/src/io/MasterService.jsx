import moji from "moji";
import connectionManager from "./connectionManager";
import { fetchGET, withLog } from "./magellanIO";

// Express経由でマスターを検索する場合
// magellan orca
const BASE_URL = "/master/api/v1";

// const normalizeTextToSearch = text => {
//     // ひらがな->カタカナ 半角英数->全角英数
//     const str = moji(text).convert('HG', 'KK').convert('HE', 'ZE').toString().split(/\s/);
//     if (str.length > 1) {
//         return str.join('.*');   // str[0].*str[1]
//     }
//     return str[0];
// };

class MasterService {
  constructor() {}

  normalizeDiseaseText = (text) => {
    // 半角英数->全角英数
    // const str = moji(text).convert('KK', 'HG').convert('HE', 'ZE').toString().split(/\s/);
    const str = moji(text).convert("HE", "ZE").toString().split(/\s/);
    if (str.length > 1) {
      return str.join(".*"); // str[0].*str[1]
    }
    return str[0];
  };

  // Diagnosis
  async findDeseaseByName(name) {
    const normalized = this.normalizeDiseaseText(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease?${text}`;
    return await fetchGET(path);
  }

  // Diagnosis Modifer
  async findDeseaseModifier(name) {
    const normalized = this.normalizeDiseaseText(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease/modifier?${text}`;
    return await fetchGET(path);
  }

  // ICD10
  async findICD10ByCode(code) {
    const normalized = moji(code).convert("ZE", "HE").toString().split(/\s/);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease/icd10?${text}`;
    return await fetchGET(path);
  }

  // Procedure by KBN
  async findProceduresByKbnKbnNo(kbn, kbn_start, kbn_end) {
    const text = encodeURI(
      `kbn=${kbn}&kbn_start=${kbn_start}&kbn_end=${kbn_end}`
    );
    const path = `${BASE_URL}/medical_procedures/kbn/kbnno?${text}`;
    return await fetchGET(path);
  }

  // Additions
  async findAdditionsByKbn(kbn) {
    const path = `${BASE_URL}/medical_procedures/additions/kbn?kbn=${kbn}`;
    return await fetchGET(path);
  }

  // Search master by text
  async findMasterByName(name) {
    const normalized = name; // がんを検索するためやめているが....normalizeTextToSearch(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/name?${text}`;
    return await fetchGET(path);
  }

  // Search master by code
  async findMasterByCode(code) {
    // const normalized = code; // がんを検索するためやめているが....normalizeTextToSearch(name);
    const text = encodeURI(`code=${code}`);
    const path = `${BASE_URL}/code?${text}`;
    return await fetchGET(path);
  }

  async listContrastMedium() {
    const path = `${BASE_URL}/medicine/contrast_medium`;
    return await fetchGET(path);
  }

  // Administration
  async findInstructionsByName(name) {
    const text = encodeURI(`name=${name}`);
    const path = `${BASE_URL}/instructions?${text}`;
    return await fetchGET(path);
  }

  // Comment
  async findCommentByCode(code) {
    const text = encodeURI(`code=${code}`);
    const path = `${BASE_URL}/comment/code?${text}`;
    return await fetchGET(path);
  }

  // Body parts
  async findBodyPartsByName(name) {
    const normalized = name; // normalizeTextToSearch(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/body_parts?${text}`;
    return await fetchGET(path);
  }

  // List Body parts
  async listBodyPartsByName() {
    const path = `${BASE_URL}/body_parts/list`;
    return await fetchGET(path);
  }

  // Expressにも他と同じtokenをセットする
  // マスター検索: snakeToCamelは行わない
  async doGet(path) {
    const url = connectionManager.getEndPoint(path);
    const token = connectionManager.getAccessToken();
    const config = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    return await withLog(fetch)(url, config);
  }

  async getAllDepts() {
    const path = `${BASE_URL}/departments`;
    return await this.doGet(path);
  }

  async findAddressByZipCode(zip_code) {
    const path = `${BASE_URL}/address/zip_code/${zip_code}`;
    return await this.doGet(path);
  }

  // Administration
  async findNaihukuByCodeReg(admin_code, name) {
    const params = encodeURI(`admin_code=${admin_code}&name=${name}`);
    const path = `${BASE_URL}/yoho/naihuku/code/name?${params}`;
    return await fetchGET(path);
  }

  // Administration
  async findNaihukuByCodeTiming(admin_code, timing_code) {
    const params = encodeURI(
      `admin_code=${admin_code}&timing_code=${timing_code}`
    );
    const path = `${BASE_URL}/yoho/naihuku/code/timing?${params}`;
    return await fetchGET(path);
  }

  // Administration
  async findGaiyoByCodeDetail(admin_code, detail_code) {
    const params = encodeURI(
      `admin_code=${admin_code}&detail_code=${detail_code}`
    );
    const path = `${BASE_URL}/yoho/gaiyo/code/detail?${params}`;
    return await fetchGET(path);
  }

  // Short name
  async listShortName() {
    const path = `${BASE_URL}/short_name`;
    return await fetchGET(path);
  }

  // Notification
  async listNotifications() {
    const path = `${BASE_URL}/notification`;
    return await fetchGET(path);
  }
}

export default MasterService;
