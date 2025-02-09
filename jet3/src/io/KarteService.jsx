import { fetchPOST, fetchDELETE, fetchGET } from "./magellanIO";

const KARTE_BASE_URL = "/karte/api/v1/karte";

class KarteService {
  constructor() {}

  async getHistory(
    facility_id,
    patient_id,
    limit,
    offset,
    client_order,
    render
  ) {
    const params = {
      facility_id,
      patient_id,
      limit,
      offset,
      client_order,
      render,
    };
    return await fetchGET(KARTE_BASE_URL, params);
  }

  async postKarte(karte) {
    return await fetchPOST(KARTE_BASE_URL, karte); // no snake
  }

  async deleteKarte(pk) {
    const path = `${KARTE_BASE_URL}/${pk}`;
    return await fetchDELETE(path);
  }

  async getMonthlyReceipt(facility_id, start, end, limit, offset) {
    const params = {
      facility_id,
      start,
      end,
      limit,
      offset,
    };
    return await fetchGET("/karte/api/v1/receipt/monthly", params);
  }

  async kickMonthlyReceipt(facility_id, start, end) {
    const params = {
      facility_id,
      start,
      end,
    };
    return await fetchPOST("/karte/api/v1/receipt/monthly", params);
  }
}

export default KarteService;
