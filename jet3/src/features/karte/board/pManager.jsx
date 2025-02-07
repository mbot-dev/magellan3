import { v4 } from "uuid";

const LIGHT_BUNDLE = [
  "group",
  "category",
  "entity",
  "name",
  "quantity",
  "unit",
  "issuedTo",
  "oral",
  "prn",
  "topical",
  "temporary",
  "freqPerDay",
];

const LIGHT_ITEM = [
  "category",
  "group",
  "type",
  "code",
  "name",
  "value",
  "drop",
  "quantity",
  "quantityPerOnce",
  "freqPerDay",
  "unit",
  "doseType",
  "icd1012",
  "dateOfOnset",
  "dateOfRemission",
  "diagnosisCategory",
];

const reduceObject = (initial, props, heavy) => {
  return props.reduce((acc, key) => {
    if (heavy[key]) {
      acc[key] = heavy[key];
    }
    return acc;
  }, initial);
};

// Stamp selected, copyStamp, dragStamp でコールされる
// ID は再発行
export const lightenBundle = (heavy, drop = true) => {
  const lb = reduceObject({ id: v4(), drop: drop }, LIGHT_BUNDLE, heavy);
  lb.claimItems = [];
  heavy.claimItems.forEach((hci) => {
    const lci = reduceObject({ id: v4() }, LIGHT_ITEM, hci);
    if (!lci.type) {
      lci.type = 0; // if (0) -> false
    }
    if (!lci.drop) {
      lci.drop = 0; // if (0) -> false
    }
    lb.claimItems.push(lci);
  });
  return lb;
};

export const getRevision = (rev) => {
  return rev ? Number(rev.substring(rev.length - 2)) : "";
};
