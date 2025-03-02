import ClaimModel from "./claimModel";

class Model {
  constructor() {
    this.claim = new ClaimModel();
  }

  getModel(mame) {
    if (mame === "claim") {
      return this.claim;
    }
    return null;
  }
}

const model = new Model();
export default model;
