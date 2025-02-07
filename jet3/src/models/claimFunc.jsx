import { v4 } from "uuid";
import {
  ENTITY_BUNDLE,
  CLAIM_INSTRUCTION,
  CLAIM_MEDICINE,
  CLAIM_PROCEDURE,
  CLAIM_COMMENT,
  CLAIM_MATERIAL,
  CLAIM_ITEM_DIAGNOSIS,
  CLAIM_ITEM_CLAIM,
  CLAIM_ITEM_SCHEMA,
  CLAIM_ITEM_IMAGE,
  CLAIM_ITEM_PDF,
  CLAIM_ITEM_INPUT,
  CLAIM_ITEM_CAMERA,
  itemTypeFrom,
  MASTER_ATTR_PROCEDURE,
  MASTER_ATTR_MEDICINE,
  MASTER_ATTR_MATERIAL,
  MASTER_ATTR_COMMENT,
  MASTER_ATTR_INSTRUCTION,
} from "./claim";
import dateFormat from "dateformat";
import { ISO_DATE_TIME } from "./karteCtx";
import { halfFrom } from "../util/strings";

const DEBUG = false;

class ClaimFunc {
  createEmptyDiagnosis() {
    return {};
  }

  createBundle(params) {
    if (!params.length) {
      return null;
    }
    // Entity に対応する Bundle Template
    const [entity] = params;
    const template = ENTITY_BUNDLE[entity];
    const bundle = JSON.parse(JSON.stringify(template));
    bundle.id = v4();
    if (params.length === 1) {
      if (DEBUG) {
        console.log(JSON.stringify(bundle, null, 3));
      }
      return bundle;
    }
    // Item がある場合 claimItems.push()
    const claimItem = params[1];
    bundle.claimItems.push(claimItem);
    if (DEBUG) {
      console.log(JSON.stringify(bundle, null, 3));
    }
    return bundle;
  }

  // inputItem = inputToEdit = InputCatalogue
  createInputBundle(inputItem) {
    const { entity, category, group, name, mandatory } = inputItem;
    const bundle = {
      id: v4(), // ID
      entity, // Entity
      category, // Category
      group, // Group
      name, // 名称
      quantity: "1", // 数量
      unit: "", // 単位
      mandatory, // 必須項目
      // items,                      // 項目名列挙
      claimItems: [], // 項目
    };
    if (DEBUG) {
      console.log(JSON.stringify(bundle, null, 3));
    }
    return bundle;
  }

  // 病名 Item
  createDiagnosisItem(master) {
    const { code, name, icd_10_1_2013, icd_10_2_2013, singleUse } = master;
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_DIAGNOSIS));
    const myItem = {
      id: v4(),
      code: code,
      name: name,
      icd1012: icd_10_1_2013,
      icd1022: icd_10_2_2013,
      diagnosisCategory: null,
      dateOfOnset: dateFormat(new Date(), ISO_DATE_TIME),
      outcome: "",
      dateOfRemission: null,
      modifier: singleUse,
    };
    const ret = { ...base, ...myItem };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // Select Master item  -> Claim Item を生成する
  createClaimItem(master) {
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_CLAIM));
    const itemType = itemTypeFrom(master);
    const drop =
      itemType === CLAIM_INSTRUCTION || itemType === CLAIM_COMMENT ? 1 : 0;
    let masterAttr;
    if (itemType === CLAIM_PROCEDURE) {
      masterAttr = MASTER_ATTR_PROCEDURE;
    } else if (itemType === CLAIM_MEDICINE) {
      masterAttr = MASTER_ATTR_MEDICINE;
    } else if (itemType === CLAIM_MATERIAL) {
      masterAttr = MASTER_ATTR_MATERIAL;
    } else if (itemType === CLAIM_COMMENT) {
      masterAttr = MASTER_ATTR_COMMENT;
    } else if (itemType === CLAIM_INSTRUCTION) {
      masterAttr = MASTER_ATTR_INSTRUCTION;
    }
    const item = masterAttr.reduce((acc, key) => {
      acc[key] = master[key] || "";
      return acc;
    }, {});
    item["id"] = v4();
    item["category"] = item["tensuKbn"] || "";
    if (item["claimClass"]) {
      if (item["claimClass"].startsWith("11")) {
        item["group"] = "110";
      } else if (item["claimClass"].startsWith("12")) {
        item["group"] = "120";
      } else {
        item["group"] = item["claimClass"];
      }
    }
    item["type"] = itemType;
    item["name"] = halfFrom(item["name"]);
    item["quantity"] = base.quantity;
    if (item["unitCode"] && item["unitCode"] !== "0") {
      item["unit"] = halfFrom(item["unit"]);
    } else {
      item["unitCode"] = "";
    }
    item["drop"] = drop;
    item["doseType"] = item?.["doseType"] ?? "0";
    const ret = { ...base, ...item };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // カメラ Item
  createCameraItem(cameraData) {
    // cameraData = {filename, contentType, size, lastModified, thumbnail, body, makeModel}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_CAMERA));
    base.id = v4();
    const ret = { ...base, ...cameraData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // シェーマ Item
  createSchemaItem(schemaData) {
    // schemaData = {filename, contentType, size, lastModified, thumbnail, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_SCHEMA));
    base.id = v4();
    const ret = { ...base, ...schemaData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // 画像ファイル Item
  createImageItem(imageData) {
    // imageData = {filename, contentType, size, lastModified, thumbnail, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_IMAGE));
    base.id = v4();
    const ret = { ...base, ...imageData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // PDF Item
  createPDFItem(pdfData) {
    // pdfData = {filename, contentType, size, lastModified, body}
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_PDF));
    base.id = v4();
    const ret = { ...base, ...pdfData };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  }

  // Input Item から ClaimItem
  createInputItem = (input) => {
    const base = JSON.parse(JSON.stringify(CLAIM_ITEM_INPUT));
    base.id = v4();
    const ret = { ...base, ...input };
    if (DEBUG) {
      console.log(JSON.stringify(ret, null, 3));
    }
    return ret;
  };
}

const instance = new ClaimFunc();
export default instance;
