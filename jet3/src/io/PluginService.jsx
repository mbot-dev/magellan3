import { fetchGET, fetchTEXT } from "./magellanIO";

const BASE_URL = "/plugin/api/v1";

class PluginService {
  constructor() {}

  async list() {
    const path = `${BASE_URL}/list`;
    return await fetchGET(path, null);
  }

  async getPlugin(plugPoint) {
    const params = {
      name: plugPoint,
    };
    const path = `${BASE_URL}/plug_point`;
    return await fetchTEXT(path, params);
  }
}

export default PluginService;
