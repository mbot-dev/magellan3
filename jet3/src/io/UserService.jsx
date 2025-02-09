import { fetchGET, fetchPOST, fetchPUT } from "./magellanIO";

const USER_URL = "/karte/api/v1/user";
const ACCOUNT_URL = "/account/api/v1";

class UserService {
  constructor() {}

  urlFor(path) {
    return path.startsWith("/")
      ? `${ACCOUNT_URL}${path}`
      : `${ACCOUNT_URL}/${path}`;
  }

  async signUp(payload) {
    const path = this.urlFor("/sign_up");
    return await fetchPOST(path, payload);
  }

  async signIn(payload) {
    const path = this.urlFor("/sign_in");
    return await fetchPOST(path, payload);
  }

  async listUsers(facility_id, status) {
    const path = `${ACCOUNT_URL}/facility/users`;
    const params = {
      facility_id: facility_id,
      user_status: status,
    };
    return await fetchGET(path, params);
  }

  async updateUserStatus(payload) {
    const path = `${ACCOUNT_URL}/facility/user_status`;
    return await fetchPUT(path, payload);
  }

  async updateUserInfo(pk, payload) {
    const path = `${ACCOUNT_URL}/user/${pk}`;
    return await fetchPUT(path, payload);
  }

  async setUserSettings(user_id, settings) {
    const path = `${USER_URL}/settings`;
    const data = {
      user_id,
      settings,
    };
    return await fetchPUT(path, data);
  }
}

export default UserService;
