import { produce } from "immer";
import { findTheme } from "../aux/commonStyles";

const MOSAIC = "mosaic";
const IS_MAC = navigator.userAgent.indexOf("Mac") >= 0;

export const initialState = {
  //------------------------------------------------------
  productName: "マーガレット",
  version: "0.6.2",
  copyRight: "©2024 Digital Users Inc.",
  settings: {
    theme: "blueGray",
    appTheme: findTheme("blueGray"),
    isMedicineColoring: true,
    isSoaColoring: true,
    isMasterColoring: true,
    isAnimate: true,
  },
  isMac: IS_MAC,
  karteRender: MOSAIC,
  path: "",
  //------------------------------------------------------
  appStatus: "pending", // pending|login|logout|restart
  loginDate: null,
  loginName: "",
  loginChannel: "",
  bearerToken: null,
  startAccessTokenTimer: false,
  changeUserId: null,
  user: null,
  showStampBox: false,
  forceHideStampBox: false,
  //------------------------------------
  updateVisit: 1, // Fetch at login
  //------------------------------------
  patientList: [], // 患者リスト -> Inspectorへマッピング
  dirtyList: [], // 編集中の患者IDリスト
  currentPatient: null, // 選択された患者オブジェクト=patientList[currentKarte]
  accountingList: [],
  currentAccounting: null,
  currentReceiptIndex: -1,
  // using ------------------------------
  usingProcedures: [],
  stampList: {},
  usingInputs: [],
  stampEntity: "baseCharge",
  stampToEdit: null,
  stampSubmitted: null,
  // using ------------------------------
  inputToEdit: null,
  diagnosisToChange: null,
  bundleToChange: null,
  inputToChange: null,
  //-------------------------------------
  procedureMode: true,
  claimError: null,
  bundleArraySubmitted: null,
  diagnosisArraySubmitted: null,
  bundleToDelete: null,
  karteCreationMode: 1,
  showDiagnosisEditor: false,
  showDiagnosisSetter: false,
  diagnosisToEdit: null,
  diagnosisSubmitted: null,
  //----------------------------------
  diagnosisBundleToEdit: null,
  bundleCopied: null,
  // using -----------------------------------
  showSchemaPanel: false,
  schemaToEdit: null,
  imageFileToUpload: null,
  pdfFileToUpload: null,
  // using -----------------------------------
  patientIdDigits: 6,
  //-----------------------------------
  isOnline: window.navigator.onLine,
  //-----------------------------------
  showWhiteQR: false,
  //----------------------------------
  pusherEvent: null,
  //-----------------------------------
  abnormalId: null, // LabModule ID contains abnormal result
  //-----------------------------------
  error: null,
  showStampMaker: false,
  loading: false,
};

const isShowStampBox = (draft) => {
  return (
    draft.path === "/karte" ||
    draft.path === "/accounting" ||
    draft.path === "/tool"
  );
};

export const reducer = produce((draft, action) => {
  let index;
  const { type } = action;

  switch (type) {
    case "setPath":
      draft.path = action.path;
      draft.showStampBox = isShowStampBox(draft);
      break;
    case "setLoginName":
      draft.loginName = action.username;
      draft.loginChannel = action.channel;
      break;
    case "setBearerToken":
      draft.bearerToken = action.token;
      break;
    case "setPending":
      draft.appStatus = "pending";
      draft.loginName = "";
      break;
    case "setLogin": {
      const { user } = action;
      draft.appStatus = "login";
      draft.user = user;
      draft.loginDate = new Date();
      break;
    }
    case "updateMe":
      draft.user = { ...draft.user, ...action.me };
      break;
    case "startAccessTokenTimer":
      draft.startAccessTokenTimer = action.start;
      break;
    case "setLogout":
      draft.appStatus = "logout";
      draft.user = null;
      draft.loginDate = null;
      draft.patientList = [];
      draft.dirtyList = [];
      draft.currentPatient = null;
      break;
    case "updatePhysician":
      draft.user = { ...draft.user, ...action.attributes };
      break;
    case "updateFacility": {
      const fci = draft.user.facilities.findIndex(
        (x) => x.id === draft.user.currFc,
      );
      const updateFc = { ...draft.user.facilities[fci], ...action.attributes };
      draft.user.facilities[fci] = updateFc;
      break;
    }
    case "addFacility":
      draft.user.facilities.push(action.facility);
      break;
    //-------------------------------------------------------------------
    case "updateVisit":
      draft.updateVisit = draft.updateVisit + 1;
      break;
    //-------------------------------------------------------------------
    case "openKarte": {
      // 患者が選択された時にこのイベントが送信される
      const { patient } = action;
      index = draft.patientList.findIndex((x) => x.ptId === patient.ptId); // 患者リスト内の患者かどうか
      const exist = index !== -1;
      if (exist) {
        draft.currentPatient = patient; // リスト内の場合はそれをカレントに設定する
      }
      if (!exist) {
        draft.patientList.push(patient); // リストにない場合は patientList に追加する
        draft.currentPatient = patient; // カレント患者
      }
      draft.path = "/karte";
      draft.showStampBox = isShowStampBox(draft);
      break;
    }
    case "addDirty": {
      const d = draft.dirtyList.find((x) => x === action.ptId);
      if (!d) {
        draft.dirtyList.push(action.ptId);
      }
      break;
    }
    case "removeDirty": {
      const r = draft.dirtyList.findIndex((x) => x === action.ptId);
      if (r !== -1) {
        draft.dirtyList.splice(r, 1);
      }
      break;
    }
    case "closeKarte": {
      index = draft.patientList.findIndex(
        (x) => x.ptId === action.patient.ptId,
      );
      let newIndex = index;
      draft.patientList.splice(index, 1);
      const len = draft.patientList.length;
      if (newIndex >= len) {
        newIndex = len - 1;
      }
      draft.currentPatient =
        draft.patientList.length > 0 ? draft.patientList[newIndex] : null;
      break;
    }
    case "changeKarte":
      draft.currentPatient = action.patient;
      break;
    //---------------------------------------
    case "openAccounting":
      index = draft.accountingList.findIndex(
        (x) => x.ptId === action.patient.ptId,
      );
      if (index !== -1) {
        draft.currentAccounting = action.patient;
      }
      if (index === -1) {
        draft.accountingList.push(action.patient);
        draft.currentAccounting = action.patient;
      }
      draft.path = "/accounting";
      draft.showStampBox = isShowStampBox(draft);
      break;
    case "closeAccounting": {
      index = draft.accountingList.findIndex(
        (x) => x.ptId === action.patient.ptId,
      );
      let newReceiptIndex = index;
      draft.accountingList.splice(index, 1);
      if (newReceiptIndex >= draft.accountingList.length) {
        newReceiptIndex = draft.accountingList.length - 1;
      }
      draft.currentAccounting =
        draft.accountingList.length > 0
          ? draft.accountingList[newReceiptIndex]
          : null;
      break;
    }
    case "changeAccounting":
      draft.currentAccounting = action.patient;
      break;
    case "forceHideStampBox":
      // 収納時
      draft.forceHideStampBox = action.payload;
      // tampBox(draft);
      break;
    //---------------------------------------
    // StampBox のタブ選択からAction
    case "setStampList":
      if (!draft.stampList[action.entity]) {
        draft.stampList[action.entity] = [];
      }
      draft.stampList[action.entity] = action.list;
      break;
    case "setStampEntity":
      draft.stampEntity = action.entity;
      break;
    case "addStamps":
      draft.stampList[action.entity] = [
        ...draft.stampList[action.entity],
        ...action.stamps,
      ];
      break;
    case "updateStamp":
      draft.stampList[action.entity][action.index] = {
        ...draft.stampList[action.entity][action.index],
        ...action.data,
      };
      break;
    case "deleteStamp":
      draft.stampList[action.entity].splice(action.index, 1);
      break;
    case "reorderStamp":
      draft.stampList[action.entity] = action.list;
      break;
    case "setUsingProcedures":
      draft.usingProcedures = action.using;
      break;
    case "setUsingInputs":
      draft.usingInputs = action.using;
      break;
    // StampTree editor からAction
    //---------------------------------------------
    // From stamp editor
    case "submitBundleArray":
      draft.bundleArraySubmitted = {
        patient: draft.currentPatient,
        entity: action.entity,
        origin: action.origin,
        array: action.array,
      };
      break;
    // StampBox で選択
    case "dropStamp":
      if (draft.path === "/karte") {
        // カルテに追加
        draft.bundleArraySubmitted = {
          patient: draft.currentPatient,
          array: [action.stamp], 
          entity: action.stamp.entity,
          origin: "stampBox",
        };
      }
      if (draft.path === "/accounting") {
        // カルテに追加
        draft.bundleArraySubmitted = {
          patient: draft.currentAccounting,
          array: [action.stamp], 
          entity: action.stamp.entity,
          origin: "stampBox",
        };
      }
      if (draft.path === "/tool" && draft.stampEntity !== "disease") {
        // 診療行為エディタで編集
        // drop drop attribute !!
        // const stm = action.stamp;
        // stm.drop = false;
        // draft.stampToEdit = stm;
      }
      break;
    case "setKarteCreationMode":
      draft.karteCreationMode = action.mode;
      break;
    //------------------------------------------
    // StampBox/ToolBoxのEditorから発行 switchする
    //------------------------------------------
    case "setDiagnosisToEdit":
      draft.diagnosisToEdit = action.target;
      break;
    case "submitDiagnosisArray":
      draft.bundleArraySubmitted = {
        patient: draft.currentPatient,
        entity: action.entity,
        origin: action.origin,
        array: action.array,
      };
      break;
    case "setInputToEdit":
      draft.inputToEdit = action.target;
      break;
    case "submitInput":
      draft.bundleArraySubmitted = {
        patient: draft.currentPatient,
        array: [action.bundle],
        entity: action.bundle,
        origin: "stampBox",
      };
      draft.inputToEdit = null;
      break;
    //-------------------------------------------
    // KarteBoardの popup で選択 start
    //-------------------------------------------
    case "setDiagnosisToChange":
      draft.diagnosisToChange = action.target;
      break;
    case "submitDiagnosisChange":
      draft.bundleArraySubmitted = {
        patient: action.patient,  // draft.currentPatient,
        array: [action.bundle],
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      draft.diagnosisToChange = null;
      break;
    case "setBundleToChange":
      draft.bundleToChange = action.target;
      break;
    case "submitBundleChange":
      debugger;
      draft.bundleArraySubmitted = {
        patient: action.patient,
        array: [action.bundle],
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      draft.bundleToChange = null;
      break;
    case "setInputToChange":
      draft.inputToChange = action.target;
      break;
    case "submitInputChange":
      draft.bundleArraySubmitted = {
        patient: draft.currentPatient,
        array: [action.bundle],
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      draft.inputToChange = null;
      break;
    //-------------------------------------------
    // KarteBoardの popup で選択 end
    //-------------------------------------------
    case "openSchemaPanel":
      draft.showSchemaPanel = true;
      break;
    case "closeSchemaPanel":
      draft.showSchemaPanel = false;
      break;
    case "setSchemaToEdit":
      draft.schemaToEdit = action.target;
      break;
    case "submitSchemaBundle":
      draft.bundleArraySubmitted = {
        array: [action.bundle],
        patient: draft.currentPatient,
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      draft.showSchemaEditor = false;
      draft.schemaToEdit = null;
      break;
    //--------------------------------------------
    case "setImageFileToUpload":
      draft.imageFileToUpload = action.target;
      break;
    case "submitImageFile":
      draft.bundleArraySubmitted = {
        patient: draft.currentPatient,
        array: [action.bundle],
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      draft.showWhiteQR = false;
      break;
    //--------------------------------------------------------------
    case "setPdfFileToUpload":
      draft.pdfFileToUpload = action.target;
      break;
    case "submitPDFFile":
      draft.bundleArraySubmitted = {
        array: [action.bundle],
        patient: draft.currentPatient,
        entity: action.bundle.entity,
        origin: "stampBox"
      };
      break;
    //-------------------------------------------
    case "copyBundle":
      draft.bundleCopied = action.bundle;
      break;
    //----------------------------------------------
    case "setOnline":
      draft.isOnline = action.isOnline;
      break;
    //----------------------------------------------
    case "showWhiteQR":
      draft.showWhiteQR = !draft.showWhiteQR;
      break;
    //----------------------------------------------
    case "pusherEvent":
      draft.pusherEvent = action.event;
      break;
    //----------------------------------------------
    case "setUserSettings": {
      const { settings } = action;
      draft.settings = { ...draft.settings, ...settings };
      // Default settings
      const theme = settings?.theme ?? "blueGray";
      draft.settings.isMedicineColoring = settings?.isMedicineColoring ?? true;
      draft.settings.isSoaColoring = settings?.isSoaColoring ?? true;
      draft.settings.isMasterColoring = settings?.isMasterColoring ?? true;
      draft.settings.isAnimate = settings?.isAnimate ?? true;
      draft.settings.appTheme = findTheme(theme);
      break;
    }
    //------------------------------------------------
    case "abnormalTestResult":
      draft.abnormalId = action.abnormalId;
      break;
    //-------------------------------------------------
    case "setKarteRender":
      draft.karteRender = action.render;
      break;
    //-------------------------------------------------
    case "setError":
      draft.error = action.error;
      break;
    case "toggleStampMaker":
      draft.showStampMaker = !draft.showStampMaker;
      break;
    case "setLoading":
      draft.loading = action.loading;
      break;
    default:
      break;
  }
});
