import { fromNow } from "../../../util/dt2";

class DiagnosisFunc {
  dateStrWithDiff(isoStr) {
    const diff = fromNow(isoStr);
    let date = this.diagnosisDate(isoStr);
    date = date.replaceAll("-", "/");
    return `${date}（${diff}）`;
  }

  diagnosisDate(isoStr) {
    // isoStr = yyyy-mm-ddThh:mm:ss.sssZ
    if (!isoStr) {
      return "";
    }
    const cp = isoStr.includes("T") ? isoStr.split("T")[0] : isoStr;
    const date = new Date(cp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const ret = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return ret;
  }
}

const instance = new DiagnosisFunc();
export default instance;
