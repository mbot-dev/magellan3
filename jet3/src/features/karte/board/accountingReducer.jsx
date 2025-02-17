import { produce, enablePatches, applyPatches } from "immer";
import { sortBundles, findSameItem } from "../../../models/claim";
import { STATUS_UPDATE } from "../../../models/karteCtx";
import { fromNowRough } from "../../../util/dt2";

enablePatches();

const PENDING = "pending";
const TRANSITION = "transition";
const READY = "ready";
const SELECTED = "selected";
const EDITING = "editing";
const EDIT_END = "editEnd";
const ERROR = "error";
// pending -> transition -> ready ->
// selected -> editing -> transition -> editEnd -> reset -> ready

const DESC = true;
const PAGE_SIZE = 6;

const calcNumPages = (total, pageSize) => {
  const plusOne = total % pageSize === 0 ? 0 : 1;
  return Math.floor(total / pageSize) + plusOne;
};

export const receiptInitialState = {
  //--------------------------
  boardState: TRANSITION,
  recoveryState: PENDING,
  selectedIndex: -1,
  //--------------------------
  karteList: [],
  soaText: null,
  soaEditing: false,
  pivot: {},
  receiptPivot: {},
  entryDates: [],
  //--------------------------
  numKarte: 0,
  firstKarte: null,
  lastKarte: null,
  kartePeriod: null,
  numPages: 0,
  render: "dual",
  fetchMode: {
    currPage: 1,
    mode: "reset",
  },
  //---------------------------
  transitionError: null,
  alert: null,
  karteToDiscard: null,
  //---------------------------
  canUndo: false,
  canRedo: false,
  testPop: null,
  //---------------------------
  receiptMode: "invoice",
  amount: 0,
  payment: false,
};

const undoableActions = ["addBundle", "deleteBundle"];
let changes = {};
let currentVersion = -1;
const noOfVersionsSupported = 20;

export const accountingReducer = (state, { type, payload }) => {
  return produce(
    state,
    (draft) => {
      switch (type) {
        case "setData": {
          const shape = payload.shape;
          draft.numKarte = shape.numKarte;
          if (draft.numKarte === 0) {
            draft.karteList = [];
            draft.entryDates = [];
            draft.numPages = 0;
            draft.firstKarte = null;
            draft.lastKarte = null;
            draft.kartePeriod = null;
            draft.pivot = {};
            draft.receiptPivot = {};
          }
          if (draft.numKarte > 0) {
            const { karteList, entryDates } = payload;
            const { firstKarte, lastKarte } = shape;
            draft.karteList = karteList;
            draft.numPages = calcNumPages(draft.numKarte, PAGE_SIZE);
            draft.firstKarte = firstKarte;
            draft.lastKarte = lastKarte;
            draft.kartePeriod = [];
            draft.kartePeriod.push(fromNowRough(firstKarte));
            draft.kartePeriod.push(fromNowRough(lastKarte));
            draft.entryDates = entryDates;
            draft.pivot = payload?.pivot ?? {};
            draft.receiptPivot = payload?.receiptPivot ?? {};
            console.log(JSON.stringify(draft.pivot, null, 3));
          }
          draft.boardState = READY;
          draft.selectedIndex = -1;
          break;
        }
        case "nextPage": {
          // intersection
          const { currPage } = draft.fetchMode;
          if (currPage !== draft.numPages) {
            draft.fetchMode = {
              currPage: currPage + 1,
              mode: "append",
            };
          }
          break;
        }
        case "appendKarte": {
          // intersection
          const listToAppend = payload.karteList;
          // DESC ASC
          if (DESC) {
            draft.karteList.push(...listToAppend);
          } else {
            listToAppend.push(...draft.karteList);
            draft.karteList = listToAppend;
          }
          break;
        }
        case "reset":
          // After Save, Discard and Delete
          // undo redo
          changes = {};
          currentVersion = -1;
          draft.canUndo = false;
          draft.canRedo = false;
          draft.fetchMode = {
            currPage: 1,
            mode: "reset",
          };
          break;
        case "setStateTransition":
          draft.boardState = TRANSITION;
          draft.recoveryState = payload;
          break;
        case "setTransitionError":
          draft.boardState = ERROR;
          draft.transitionError = payload; // Show Dialog
          break;
        case "recoverState":
          // Recover from Error
          draft.transitionError = null; // Close dialog
          draft.boardState = draft.recoveryState;
          break;
        //-----------------------------------------------
        case "setSelected":
          if (draft.boardState === READY || draft.boardState === SELECTED) {
            // Toggle
            const idx = payload === draft.selectedIndex ? -1 : payload;
            draft.selectedIndex = idx;
            draft.boardState = idx !== -1 ? SELECTED : READY;
          }
          break;
        //-----------------------------------------------
        case "setAlert":
          draft.alert = payload;
          break;
        case "alertDiscard":
          draft.karteToDiscard = draft.karteList[draft.selectedIndex];
          break;
        case "cancelDiscard":
          draft.karteToDiscard = null;
          break;
        case "discard":
          draft.karteToDiscard = null;
          break;
        //-----------------------------------------
        case "modifyKarte": {
          // カルテ修正
          const karteToUpdate = draft.karteList[draft.selectedIndex];
          karteToUpdate.status = STATUS_UPDATE;
          karteToUpdate.clerkId = payload?.id ?? "";
          karteToUpdate.clerkName = payload?.name ?? "";
          draft.boardState = EDITING;
          break;
        }
        case "karteSaved":
          draft.boardState = EDIT_END;
          break;
        case "addBundle": {
          // Stamp dropped || bundle Editted -> add karte bundle(payload)
          const karteP = draft.karteList[draft.selectedIndex].p;
          const index = karteP.findIndex((x) => x.id === payload.id);
          if (index === -1) {
            //--------------------------------------------
            // 重複チェック claimItem の全数チェックが必要
            // -------------------------------------------
            const found = findSameItem(payload, karteP);
            if (found.length > 0) {
              const msg = ["下記診療行為が重複しています。"];
              found.forEach((x) => {
                msg.push(x);
              });
              draft.alert = msg;
              return;
            }
            //--------------------------------------------
            // 新規バンドル => カルテの P へ追加
            karteP.push(payload);
            sortBundles(karteP);
            // pivot へ追加
            const { group, entity } = payload;
            const rowG = draft.render === "mosaic" ? entity : group; // `${group}:${entity}:${name}` : group;
            const date = draft.karteList[draft.selectedIndex].createdAt;
            if (!draft.pivot[rowG]) {
              draft.pivot[rowG] = {};
            }
            if (!draft.pivot[rowG][date]) {
              draft.pivot[rowG][date] = [];
            }
            draft.pivot[rowG][date].push(payload.id);
          }
          if (index !== -1) {
            // すでにBundleがある場合 エディタで変更されているのでbundleを置き換え
            karteP.splice(index, 1, payload);
            const old = karteP[index];
            const { group, entity } = old;
            const rowG = draft.render === "mosaic" ? entity : group; // `${group}:${entity}:${name}` : group;
            const date = draft.karteList[draft.selectedIndex].createdAt;
            const idx = draft.pivot[rowG][date].findIndex(
              (x) => x === payload.id
            );
            draft.pivot[rowG][date].splice(idx, 1, payload.id);
          }
          break;
        }
        case "deleteBundle": {
          let bundle;
          draft.karteList[draft.selectedIndex].p.some((b, idx) => {
            if (b.id === payload) {
              bundle = b;
              draft.karteList[draft.selectedIndex].p.splice(idx, 1); // delete from karte.p
              return true;
            }
            return false;
          });
          if (!bundle) {
            return;
          }
          const { group, entity } = bundle;
          const rowG = draft.render === "mosaic" ? entity : group; // `${group}:${entity}:${name}` : group;
          const date = draft.karteList[draft.selectedIndex].createdAt;
          const idx = draft.pivot[rowG][date].findIndex((x) => x === payload);
          draft.pivot[rowG][date].splice(idx, 1);
          if (draft.pivot[rowG][date].length > 0) {
            return;
          }
          delete draft.pivot[rowG][date];
          if (Object.keys(draft.pivot[rowG]).length === 0) {
            delete draft.pivot[rowG];
          }
          break;
        }
        case "setSoaText":
          draft.soaText = payload;
          break;
        case "setSoaInput":
          draft.soaText = payload;
          draft.soaEditing = true;
          break;
        case "setSoaBlur":
          draft.soaEditing = false;
          break;
        case "insertSoaText":
          draft.soaText += payload;
          draft.soaEditing = true;
          break;
        case "undo":
          return produce(
            applyPatches(state, changes[currentVersion--].undo),
            (newDraft) => {
              newDraft.canUndo = Object.prototype.hasOwnProperty.call(
                changes,
                currentVersion
              );
              newDraft.canRedo = true;
            }
          );
        case "redo":
          return produce(
            applyPatches(state, changes[++currentVersion].redo),
            (newDraft) => {
              newDraft.canUndo = true;
              newDraft.canRedo = Object.prototype.hasOwnProperty.call(
                changes,
                currentVersion + 1
              );
            }
          );
        case "testPop":
          draft.testPop = payload;
          break;
        case "changeRenderer":
          changes = {};
          currentVersion = -1;
          draft.canUndo = false;
          draft.canRedo = false;
          draft.pivot = {};
          draft.receiptPivot = {};
          draft.entryDates = [];
          draft.render = payload;
          draft.fetchMode = {
            currPage: 1,
            mode: "reset",
          };
          break;
        case "setReceiptMode":
          draft.receiptMode = payload;
          break;
        case "setAmount":
          draft.amount = Number(payload);
          break;
        default:
          break;
      }
      if (undoableActions.indexOf(type) !== -1) {
        draft.canUndo = true;
        draft.canRedo = false;
      }
    },
    (patches, inversePatches) => {
      if (undoableActions.indexOf(type) !== -1) {
        currentVersion++;

        changes[currentVersion] = {
          redo: patches,
          undo: inversePatches,
        };

        delete changes[currentVersion + 1];
        delete changes[currentVersion - noOfVersionsSupported];
      }
    }
  );
};
