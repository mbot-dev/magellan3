import { fetchGET, fetchTEXT } from "./magellanIO";

const BASE_URL = "/karte/api/v1";

class PluginService {
	constructor() {}

	async list() {
		const path = `${BASE_URL}/plugin`;
		return await fetchGET(path, null);
	}

	async getPlugin(plugPoint) {
		const params = {
			name: plugPoint
		};
		const path = `${BASE_URL}/plugin/name`;
		return await fetchTEXT(path, params);
	}
}

export default PluginService;
