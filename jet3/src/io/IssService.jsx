import { fetchPOST, fetchGET } from "./magellanIO";

const BASE_URL = "/iss/api/v1";

class IssService {
  constructor() {}

  async sendSignupLink(payload) {
    const path = `${BASE_URL}/send_signup_link`;
    payload["mode"] = "sign_up";
    return await fetchPOST(path, payload);
  }

  async sendLoginLink(payload) {
    const path = `${BASE_URL}/send_signup_link`;
    payload["mode"] = "login";
    return await fetchPOST(path, payload);
  }

  async requestRefreshAndAccessToken(payload) {
    const path = `${BASE_URL}/refresh_token`;
    return await fetchPOST(path, payload);
  }

  async requestWhiteToken(payload) {
    const path = `${BASE_URL}/white_token`;
    return await fetchPOST(path, payload);
  }

  async sendInviteLink(payload) {
    const path = `${BASE_URL}/send_add_user_link`;
    return await fetchPOST(path, payload);
  }

  async sendChangeUsernameLink(payload) {
    const path = `${BASE_URL}/change_username`;
    return await fetchPOST(path, payload);
  }

  async ping(payload) {
    const path = `${BASE_URL}/ping`;
    return await fetchPOST(path, payload);
  }

  async call(payload) {
    const path = `${BASE_URL}/call`;
    return await fetchPOST(path, payload);
  }

  async meet() {
    const path = `${BASE_URL}/meet`;
    return await fetchGET(path);
  }
}

export default IssService;
