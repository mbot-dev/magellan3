class ConnectionManager {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getAccessToken() {
    return this.token
      ? this.token["access_token"] || this.token["accessToken"]
      : null;
  }

  getExpiresIn() {
    return this.token
      ? this.token["expires_in"] || this.token["expiresIn"]
      : null;
  }

  getEndPoint(path, params = null) {
    let url = path;
    if (params) {
      const queryString = Object.keys(params)
        .map((key) => {
          return `${encodeURIComponent(key)}=${encodeURIComponent(
            params[key]
          )}`;
        })
        .join("&");
      url = `${url}?${queryString}`;
    }
    const host = import.meta.env.VITE_API_HOST;
    // const host = 'https://dashing-skunk-nominally.ngrok-free.app';
    return `${host}${url}`;
  }

  // カメラでQRコードを撮影し、capture app へアクセスするためのURL
  getOpenURL(path) {
    if (path.startsWith("/capture")) {
      const host = import.meta.env.VITE_API_HOST;
      return `${host}${path}`;
    }
    return path;
  }
}

const instance = new ConnectionManager();
export default instance;
