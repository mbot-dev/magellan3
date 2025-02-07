import {fetchGET} from './magellanIO';

// const BASE_URL_INPUT = '/input/api/v1';
const BASE_URL_INPUT = '/karte/api/v1/stamp';


// 診療行為セットのカタログを取得する
export const getProcedureCatalogue = async () => {
    const path = `${BASE_URL_INPUT}/procedure_catalogue`;
    return await fetchGET(path);
};

export const getInputCatalogue = async () => {
    const path = `${BASE_URL_INPUT}/input_catalogue`;
    return await fetchGET(path);
};

export const getInputBundle = async entity => {
    const params = {
        entity,
    };
    const path = `${BASE_URL_INPUT}/input_bundle`;
    return await fetchGET(path, params);
};

