import moji from 'moji';
import connectionManager from '../io/connectionManager';
import { fetchGET, withLog } from './magellanIO';

// Express経由でマスターを検索する場合
// magellan orca
const BASE_URL = '/master/api/v1';

// const normalizeTextToSearch = text => {
//     // ひらがな->カタカナ 半角英数->全角英数
//     const str = moji(text).convert('HG', 'KK').convert('HE', 'ZE').toString().split(/\s/);
//     if (str.length > 1) {
//         return str.join('.*');   // str[0].*str[1]
//     }
//     return str[0];
// };

const normalizeDiseaseText = text => {
    // 半角英数->全角英数
    // const str = moji(text).convert('KK', 'HG').convert('HE', 'ZE').toString().split(/\s/);
    const str = moji(text).convert('HE', 'ZE').toString().split(/\s/);
    if (str.length > 1) {
        return str.join('.*');   // str[0].*str[1]
    }
    return str[0];
};

// Diagnosis
export const findDeseaseByName = async name => {
    const normalized = normalizeDiseaseText(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease?${text}`;
    return await fetchGET(path);
};

// Diagnosis Modifer
export const findDeseaseModifier = async name => {
    const normalized = normalizeDiseaseText(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease/modifier?${text}`;
    return await fetchGET(path);
};

// ICD10
export const findICD10ByCode = async code => {
    const normalized = moji(code).convert('ZE', 'HE').toString().split(/\s/);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/desease/icd10?${text}`;
    return await fetchGET(path);
};

// Procedure by KBN
export const findProceduresByKbnKbnNo = async (kbn, kbn_start, kbn_end) => {
    const text = encodeURI(`kbn=${kbn}&kbn_start=${kbn_start}&kbn_end=${kbn_end}`);
    const path = `${BASE_URL}/medical_procedures/kbn/kbnno?${text}`;
    return await fetchGET(path);
};

// Additions
export const findAdditionsByKbn = async kbn => {
    const path = `${BASE_URL}/medical_procedures/additions/kbn?kbn=${kbn}`;
    return await fetchGET(path);
};

// Search master by text
export const findMasterByName = async name => {
    const normalized = name; // がんを検索するためやめているが....normalizeTextToSearch(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/name?${text}`;
    return await fetchGET(path);
};

// Search master by code
export const findMasterByCode = async code => {
    // const normalized = code; // がんを検索するためやめているが....normalizeTextToSearch(name);
    const text = encodeURI(`code=${code}`);
    const path = `${BASE_URL}/code?${text}`;
    return await fetchGET(path);
};

export const listContrastMedium = async () => {
    const path = `${BASE_URL}/medicine/contrast_medium`;
    return await fetchGET(path);
};

// Administration
export const findInstructionsByName = async name => {
    const text = encodeURI(`name=${name}`);
    const path = `${BASE_URL}/instructions?${text}`;
    return await fetchGET(path);
};

// Comment
export const findCommentByCode = async code => {
    const text = encodeURI(`code=${code}`);
    const path = `${BASE_URL}/comment/code?${text}`;
    return await fetchGET(path);
};

// Body parts
export const findBodyPartsByName = async name => {
    const normalized = name; // normalizeTextToSearch(name);
    const text = encodeURI(`name=${normalized}`);
    const path = `${BASE_URL}/body_parts?${text}`;
    return await fetchGET(path);
};

// List Body parts
export const listBodyPartsByName = async () => {
    const path = `${BASE_URL}/body_parts/list`;
    return await fetchGET(path);
};

// Expressにも他と同じtokenをセットする
// マスター検索: snakeToCamelは行わない
const doGet = async path => {
    const url = connectionManager.getEndPoint(path);
    const token = connectionManager.getAccessToken();
    const config = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    return await withLog(fetch)(url, config);
};

export const getAllDepts = async () => {
    const path = `${BASE_URL}/departments`;
    return await doGet(path);
};

export const findAddressByZipCode = async zip_code => {
    const path = `${BASE_URL}/address/zip_code/${zip_code}`;
    return await doGet(path);
};

// Administration
export const findNaihukuByCodeReg = async (admin_code, name) => {
    const params = encodeURI(`admin_code=${admin_code}&name=${name}`);
    const path = `${BASE_URL}/yoho/naihuku/code/name?${params}`;
    return await fetchGET(path);
};

// Administration
export const findNaihukuByCodeTiming = async (admin_code, timing_code) => {
    const params = encodeURI(`admin_code=${admin_code}&timing_code=${timing_code}`);
    const path = `${BASE_URL}/yoho/naihuku/code/timing?${params}`;
    return await fetchGET(path);
};

// Administration
export const findGaiyoByCodeDetail = async (admin_code, detail_code) => {
    const params = encodeURI(`admin_code=${admin_code}&detail_code=${detail_code}`);
    const path = `${BASE_URL}/yoho/gaiyo/code/detail?${params}`;
    return await fetchGET(path);
};

// Short name
export const listShortName = async () => {
    const path = `${BASE_URL}/short_name`;
    return await fetchGET(path);
};