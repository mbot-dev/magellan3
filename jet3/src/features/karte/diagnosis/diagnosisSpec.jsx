import { v4 } from "uuid";

export const ENTITY_SPEC_DIAGNOSIS = {
  title: "傷病名",
  entity: "diagnosis",
  attributes: [
    { label: "コード", key: "code" },
    { label: "ICD10", key: "icd1012", isOption: true },
    { label: "名称", key: "name" },
    { label: "カテゴリー", key: "diagnosisCategory", isOption: true },
    { label: "転帰", key: "outcome", isOption: true },
    { label: "疾患開始日", key: "dateOfOnset", func: "dateStrWithDiff", arg: ["dateOfOnset"] },
    { label: "疾患終了日", key: "dateOfRemission", isOption: true, func: "diagnosisDate", arg: ["dateOfRemission"] }
  ]
};

export const DIAGNOSIS_CATEGORY_OPTIONS = [
  { label: "主傷病", value: "01", id: v4() },
  { label: "疑い病名", value: "02", id: v4() }
];

export const DIAGNOSIS_OUTCOME_OPTIONS = [
  { label: "治ゆ", value: "2", id: v4() },
  { label: "死亡", value: "3", id: v4() },
  { label: "中止（転医）", value: "4", id: v4() },
  { label: "上記以外", value: "1", id: v4() }
];
