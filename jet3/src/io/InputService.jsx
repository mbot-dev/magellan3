import { fetchGET } from "./magellanIO";

// const BASE_URL_INPUT = '/input/api/v1';
const BASE_URL_INPUT = "/karte/api/v1/stamp";

class InputService {
  constructor() {}

  // 診療行為セットのカタログを取得する
  async getProcedureCatalogue() {
    const path = `${BASE_URL_INPUT}/procedure_catalogue`;
    return await fetchGET(path);
  }

  async getInputCatalogue() {
    const path = `${BASE_URL_INPUT}/input_catalogue`;
    return await fetchGET(path);
  }

  async getInputBundle(entity) {
    const params = {
      entity,
    };
    const path = `${BASE_URL_INPUT}/input_bundle`;
    return await fetchGET(path, params);
  }
}

export default InputService;
