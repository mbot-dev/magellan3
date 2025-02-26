import dateFormat from "dateformat";
import { MEDICAL_LICENSE_DICT } from "../../models/karteCtx";

class UserFunc {
  licenseName(license) {
    return MEDICAL_LICENSE_DICT[license];
  }

  dateAt(str) {
    if (!str) {
      return "";
    }
    return dateFormat(str, "yyyy-mm-dd");
  }

  autoSantei(flg) {
    return flg ? "可" : "不可";
  }
}

const instance = new UserFunc();
export default instance;

