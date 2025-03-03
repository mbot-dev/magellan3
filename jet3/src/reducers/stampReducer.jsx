import { produce } from "immer";
import { v4 } from "uuid";
import {
  sortClaimItems,
  procedureKbnFromEntity,
  isBaseProcedure,
  isCompositionProcedure,
  isApplicationProcedure,
  hasSameAnnotaionCode,
  isAnnotaionProcedure,
  isGeneralProcedure,
  is135Procedure,
  isProcedure,
  INTERNAL_MEDICINE,
  EXTERNAL_MEDICINE,
  CLAIM_PROCEDURE,
  CLAIM_INSTRUCTION,
  CLAIM_MEDICINE,
  DOSE_TYPE_INJECTION,
  isRp,
  isInjection,
  CLAIM_BODY_PART,
  isImage,
  DOSE_TYPE_INTERNAL,
  DOSE_TYPE_TOPICAL,
  CLAIM_MATERIAL,
  isBaseCharge,
  RECEIPT_CODE_NAME,
} from "../models/claim";
import claimFunc from "../models/claimFunc";

export const initialStampState = {
  bundleForClear: null,
  myBundle: null,
  myProduct: null,
  procedureKbn: null,
  splitRoundItems: false,
  fromRoom: false,
  searchResults: [],
  additions: [],
  numRecords: 0,
};

export const stampReducer = produce((draft, action) => {
  let item;
  let index;
  let target;
  let calcTest;
  const { type } = action;
  switch (type) {
    case "setBundle": {
      const { bundle } = action;
      const { entity } = bundle;
      draft.myBundle = bundle;
      draft.bundleForClear = bundle;
      draft.myProduct = null;
      draft.procedureKbn = procedureKbnFromEntity(entity); // entity = diagnosis => return diagnosis
      draft.searchResults = [];
      draft.additions = [];
      draft.numRecords = 0;
      break;
    }
    case "addItem":
      item = action.item;
      if (!canAdd(draft.myBundle, item)) {
        return;
      }
      draft.myBundle.claimItems.push(item);
      sortClaimItems(draft.myBundle.claimItems);
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (!isRp(draft.myBundle)) {
        return;
      }
      if (draft.myBundle.claimItems.length === 1) {
        // First item with rp
        if (
          draft.myBundle.oral ||
          draft.myBundle.prn ||
          draft.myBundle.topical
        ) {
          return;
        }
        // Not yet set oral, prn, topical type
        const test = draft.myBundle.claimItems[0];
        if (test.doseType === DOSE_TYPE_TOPICAL) {
          draft.myBundle.topical = true;
          draft.myBundle.askDose = false;
          return;
        }
        draft.myBundle.askDose = true;
      }
      break;
    case "removeItem":
      item = action.item;
      index = draft.myBundle.claimItems.findIndex((x) => x.code === item.code);
      if (index !== -1) {
        draft.myBundle.claimItems.splice(index, 1);
        draft.myBundle.isValid = isValidBundle(draft.myBundle);
        draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      }
      break;
    case "setItemQuantity":
      index = action.index;
      draft.myBundle.claimItems[index].quantity = action.quantity;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      break;
    case "setItemQuantityPerOnce": // 1回量
      index = action.index;
      draft.myBundle.claimItems[index].quantityPerOnce = action.quantityPerOnce;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (draft.myBundle.prn) {
        // prn  quantity = quantityPerOnce -> prn.quantity = 1回量
        draft.myBundle.claimItems[index].quantity = action.quantityPerOnce;
      }
      if (draft.myBundle.oral || draft.myBundle.temporary) {
        // oral quantity = quantityPerOnce * freqPerDay -> oral.quantity = 1日量
        target = draft.myBundle.claimItems[index];
        if (target.quantityPerOnce && draft.myBundle.freqPerDay) {
          calcTest = target.quantityPerOnce * draft.myBundle.freqPerDay;
          if (!isNaN(calcTest)) {
            draft.myBundle.claimItems[index].quantity = `${calcTest}`;
          }
        }
      }
      break;
    case "setBundleFreqPerDay":
      draft.myBundle.freqPerDay = action.freqPerDay;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (draft.myBundle.oral || draft.myBundle.temporary) {
        draft.myBundle.claimItems.forEach((item, index) => {
          if (item.quantityPerOnce && action.freqPerDay) {
            calcTest = item.quantityPerOnce * action.freqPerDay;
            if (!isNaN(calcTest)) {
              draft.myBundle.claimItems[index].quantity = `${calcTest}`;
            }
          }
        });
      }
      break;
    case "setBundleQuantity":
      draft.myBundle.quantity = action.quantity;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      break;
    case "setOral":
      draft.myBundle.oral = action.on;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (action.on) {
        draft.myBundle.prn = false;
        draft.myBundle.topical = false;
        draft.myBundle.unit = "日分";
        draft.myBundle.askDose = false;
      }
      break;
    case "setPRN":
      draft.myBundle.prn = action.on;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (action.on) {
        draft.myBundle.oral = false;
        draft.myBundle.topical = false;
        draft.myBundle.temporary = false;
        draft.myBundle.unit = "回分";
        draft.myBundle.askDose = false;
      }
      break;
    case "setTopical":
      draft.myBundle.topical = action.on;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      if (action.on) {
        draft.myBundle.oral = false;
        draft.myBundle.prn = false;
        draft.myBundle.temporary = false;
        draft.myBundle.quantity = "1"; // 1
        draft.myBundle.unit = "";
        draft.myBundle.askDose = false;
      }
      break;
    case "setTemporal":
      draft.myBundle.temporary = action.on;
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      break;
    case "setInMedicine":
      draft.myBundle.issuedTo = action.on ? "internal" : "external";
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      break;
    case "setOutMedicine":
      draft.myBundle.issuedTo = action.on ? "external" : "internal";
      draft.myBundle.isValid = isValidBundle(draft.myBundle);
      draft.myBundle.canClear = draft.myBundle.claimItems.length > 0;
      break;
    case "updateComment":
      index = action.index;
      draft.myBundle.claimItems[index].name = action.comment;
      break;
    case "clear":
      draft.myBundle = draft.bundleForClear;
      draft.myBundle.claimItems = [];
      draft.myBundle.oral = false;
      draft.myBundle.prn = false;
      draft.myBundle.temporary = false;
      draft.myBundle.quantity = "";
      draft.myBundle.unit = "";
      draft.myBundle.askDose = false;
      draft.myBundle.isValid = false;
      draft.myBundle.canClear = false;
      break;
    case "setSearchResults": {
      if (action.mode === "search") {
        draft.searchResults = action.results;
        draft.additions = [];
        draft.numRecords = action.results.length;
        return;
      }
      const b = [];
      const a = [];
      const o = [];
      action.results.forEach((x) => {
        if (is135Procedure(x)) {
          b.push(x);
        } else if (isAnnotaionProcedure(x) || isGeneralProcedure(x)) {
          a.push(x);
        } else {
          o.push(x);
        }
      });
      draft.searchResults = [...b, ...o];
      draft.additions = a;
      draft.numRecords = action.results.length;
      break;
    }
    case "filterAdditions":
      draft.searchResults = draft.additions;
      break;
    case "filterAdditions2": {
      if (draft.myBundle.claimItems.length === 0) {
        return;
      }
      target = draft.myBundle.claimItems[0];
      if (
        !isBaseProcedure(target) &&
        !isCompositionProcedure(target) &&
        !isApplicationProcedure(target)
      ) {
        return;
      }
      const additions = draft.searchResults.filter(
        (x) =>
          (isAnnotaionProcedure(x) || isGeneralProcedure(x)) &&
          hasSameAnnotaionCode(target, x),
      );
      draft.searchResults = additions;
      draft.numRecords = additions.length;
      break;
    }
    case "submit":
      if (draft.myBundle.entity === "baseCharge") {
        draft.myProduct = setupBaseCharge(draft.myBundle);
        return;
      }
      if (draft.myBundle.entity === "rp") {
        draft.myProduct = setupRp(draft.myBundle);
        return;
      }
      if (draft.myBundle.entity === "labTest") {
        if (draft.splitRoundItems) {
          draft.myProduct = setupLabTest(draft.myBundle);
        } else {
          draft.myProduct = setupGroup(draft.myBundle);
        }
        return;
      }
      draft.myProduct = setupGroup(draft.myBundle);
      break;
    default:
      break;
  }
});

const canAdd = (bundle, item) => {
  // 重複コード
  const has = bundle.claimItems.find((x) => x.code === item.code);
  if (has) {
    return false;
  }
  // 診療行為 点数区分が同じ 基本項目ひとつ...
  if (item.type === CLAIM_PROCEDURE) {
    if (bundle.category !== item.category) {
      return false;
    }
    return true;
  }
  // 用法 処方のみ
  if (item.type === CLAIM_INSTRUCTION) {
    return isRp(bundle);
  }
  // 処方
  if (isRp(bundle) && item.type === CLAIM_MEDICINE) {
    // 注射薬を拒否
    if (item.doseType === DOSE_TYPE_INJECTION) {
      return false;
    }
    // 医薬品だけ集める
    const medicines = bundle.claimItems.filter(
      (x) => x.type === CLAIM_MEDICINE,
    );
    if (medicines.length === 0) {
      return true;
    }
    if (medicines.length > 0) {
      // 剤型が全て同じならOK
      return medicines.every((test) => {
        return test.doseType === item.doseType;
      });
    }
  }
  // 注射 注射薬のみ
  if (isInjection(bundle) && item.type === CLAIM_MEDICINE) {
    return item.doseType === DOSE_TYPE_INJECTION;
  }
  // 画像部位
  if (item.type === CLAIM_BODY_PART) {
    return isImage(bundle);
  }
  // ToDo 機材その他...
  return true;
};

const splitItems = (bundle) => {
  const { claimItems } = bundle;
  const procedure = claimItems.filter((x) => x.type === CLAIM_PROCEDURE);
  const internal = claimItems.filter(
    (x) => x.type === CLAIM_MEDICINE && x.doseType === DOSE_TYPE_INTERNAL,
  );
  const external = claimItems.filter(
    (x) => x.type === CLAIM_MEDICINE && x.doseType === DOSE_TYPE_TOPICAL,
  );
  const injection = claimItems.filter(
    (x) => x.type === CLAIM_MEDICINE && x.doseType === DOSE_TYPE_INJECTION,
  );
  const material = claimItems.filter((x) => x.type === CLAIM_MATERIAL);
  const instruction = claimItems.filter((x) => x.type === CLAIM_INSTRUCTION);
  const bodyParts = claimItems.filter((x) => x.type === CLAIM_BODY_PART);
  return [
    procedure,
    internal,
    external,
    injection,
    material,
    instruction,
    bodyParts,
  ];
};

const isValidBundle = (bundle) => {
  if (bundle.claimItems.length === 0) {
    // 項目数 = 0
    return false;
  }
  if (isBaseCharge(bundle)) {
    // 診断料
    return isValidBaseCharge(bundle);
  }
  if (isRp(bundle)) {
    // 処方
    return isValidRp(bundle);
  }
  if (isInjection(bundle)) {
    // 注射
    return isValidInjection(bundle);
  }
  // その他
  return isValidClaimBundle(bundle);
};

// 診断料
const isValidBaseCharge = (bundle) => {
  const [
    procedure,
    internal,
    external,
    injection,
    material,
    instruction,
    bodyParts,
  ] = splitItems(bundle);
  return (
    procedure.length > 0 &&
    internal.length === 0 &&
    external.length === 0 &&
    injection.length === 0 &&
    material.length === 0 &&
    instruction.length === 0 &&
    bodyParts.length === 0
  );
};

// 処方 処方箋料がセットされていたら... ToDo
const isValidRp = (bundle) => {
  const [procedure, internal, external, injection, material, instruction] =
    splitItems(bundle);
  if (injection.length > 0) {
    return false;
  }
  // 院外処方と院内処方 両方ありは不可
  if (internal.length > 0) {
    return instruction.length && !external.length;
  }
  if (external.length > 0) {
    return instruction.length && !internal.length;
  }
  return procedure.length;
};

// 注射 手技は必要 ?
const isValidInjection = (bundle) => {
  const [procedure, internal, external, injection] = splitItems(bundle);
  if (procedure.length === 0 || injection.length === 0) {
    return false;
  }
  return internal.length === 0 && external.length === 0;
};

// その他バンドル
const isValidClaimBundle = (bundle) => {
  const [procedure] = splitItems(bundle);
  if (procedure.length === 0) {
    return false;
  }
  const valid = procedure.every((item) => {
    if (!item.unit) {
      return true;
    }
    return item?.quantity && item.quantity != "";
  });
  return valid;
};

const c16_包括対象検査 = "col_016";

// 診断料
// Split the claim items into individual bundle
// Retrun array of bundle
const setupBaseCharge = (bundle) => {
  const arr = bundle.claimItems.map((cl) => {
    return {
      id: v4(),
      entity: bundle.entity,
      category: cl.category,
      group: `${cl.group.substring(0, 2)}0`,
      name: cl.name,
      quantity: "1",  // 1...
      unit: "",
      claimItems: [cl],
    };
  });
  return arr;
};

// 内服(21) 頓服(22) 外用(23) 頓臨時(29)
// 上記に 院内(1) 院外(2) を付加する
const setupRp = (bundle) => {
  const ret = [];
  const [procedure, internal, external, injection, material, instruction] =
    splitItems(bundle);
  if (injection.length || material.length) {
    return ret;
  }
  // 投薬の手技は別バンドルにする
  // entity = rp, group = 800, name = 手技名
  // 上記によりStampTreeは処方(entity)、レセプトは800
  // Return array of bundle
  if (procedure.length) {
    procedure.forEach((proc) => {
      const bdl = claimFunc.createBundle(["rp"]);
      // id is seted by createBundle()
      const cp = proc.group.substring(0, 2);
      bdl.group = `${cp}0`; // 800:処方箋料  260:処方料...
      bdl.name = RECEIPT_CODE_NAME[cp];
      bdl.quantity = "1";
      bdl.issuedTo = "";
      proc.id = v4();
      proc.drop = 0;
      bdl.claimItems = [proc];
      ret.push(bdl);
    });
  }
  if (!internal.length && !external.length && !instruction.length) {
    return ret;
  }
  const copy = JSON.parse(JSON.stringify(bundle));
  let group;
  if (copy.oral) {
    group = "21";
  }
  if (copy.prn) {
    group = "22";
  }
  if (copy.topical) {
    group = "23";
  }
  if (copy.temporary) {
    group = "29";
  }
  const suffix =
    copy.issuedTo === "internal" ? INTERNAL_MEDICINE : EXTERNAL_MEDICINE; // Toggle
  copy.group = `${group}${suffix}`;

  if (internal.length) {
    copy.claimItems = internal;
  }
  if (external.length) {
    copy.claimItems = external;
  }
  if (instruction.length) {
    copy.claimItems = [...copy.claimItems, ...instruction];
  }
  ret.push(copy);
  return ret;
};

const setupLabTest = (bundle) => {
  const copy = JSON.parse(JSON.stringify(bundle));
  copy.claimItems.sort((a, b) => {
    const av = a?.[c16_包括対象検査] ?? "0";
    const bv = b?.[c16_包括対象検査] ?? "0";
    return av > bv ? 1 : av < bv ? -1 : 0;
  });
  const grouped = Object.groupBy(copy.claimItems, (x) => x[c16_包括対象検査]);
  const ret = [];
  for (const [key, value] of Object.entries(grouped)) {
    if (key === "0") {
      value.forEach((item) => {
        const bdl = claimFunc.createBundle(["labTest"]);
        bdl.claimItems = [item];
        ret.push(bdl);
      });
    } else {
      const bdl = claimFunc.createBundle(["labTest"]);
      bdl.claimItems = value;
      ret.push(bdl);
    }
  }
  return ret;
};

// Return array of bundle
const setupGroup = (bundle) => {
  const copy = JSON.parse(JSON.stringify(bundle));
  copy.claimItems.some((item) => {
    if (isProcedure(item)) {
      const cp = item.group.substring(0, 2);
      copy.group = `${cp}0`; // group = claimItem[0:2]0
      return true;
    }
    return false;
  });
  return [copy];
};
