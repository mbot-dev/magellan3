import { useEffect, useReducer, useRef } from "react";
import styled from "styled-components";
import { v4 } from "uuid";
import sanitizeHtml from "sanitize-html";
import dateFormat from "dateformat";
import { boardInitialState, boardReducer } from "./boardReducer";
import { useClerk } from "../../../hook/useClerk";
import { useFacility } from "../../../hook/useFacility";
import { useIntersectionObserver } from "../../../hook/useIntersectionObserver";
import { useMargaret } from "../../../io/MargaretProvider";
import {
  GROUP_DIAGNOSIS,
  GROUP_FIRST_VISIT,
  GROUP_FOLLOW_UP_VISIT,
  GROUP_PDF,
  GROUP_REF_IMAGE,
  GROUP_SCHEMA,
  GROUP_VITAL_SIGN,
  isClaimGroup,
  VISIT_TYPE_FIRST,
  VISIT_TYPE_FOLLOW_UP,
} from "../../../models/claim";
import {
  APPLY_RP,
  EMPTY_NEW,
  incrementRevisionNumber,
  ISO_DATE_TIME,
  listDepartments,
  newDiagnosisBundle,
  newKarteContext,
  STATUS_FINAL,
  STATUS_NEW,
  STATUS_UPDATE,
  WHOLE_COPY,
} from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import { ageAt, fromNowRough } from "../../../util/dt2";
import { getRevision } from "./pManager";
import { StickyColumn, StickyBody } from "../../../aux/commonStyles";
import ContextMenu from "../../../cmp/ContextMenu";
import DownloadFile from "../media/DownloadFile";
import {
  DELETE_TEXT,
  DISCARD_TEXT,
  MODIFY,
  SAVE_TEXT,
} from "../../../aux/FormUtil";
import NewKarteDialog from "./NewKarteDialog";
import SOAEditor2 from "./SOAEditor2";
import WhiteQR from "../media/WhiteQR";
import withDisplayBlock from "../../../aux/withDisplayBlock";
import { UndoButton, RedoButton } from "../../../cmp/IconButtons";
import PopFunc from "./PopFunc";
import EntityRenderer from "./EntityRenderer";
import { MdOutlineAdd } from "react-icons/md";
import DaingerSelection from "../../../cmp/DaingerSelection";
import MosaicSelector2 from "../../../cmp/MosaicSelector2";
import ReceiptRenderer from "./ReceiptRenderer";
import DualRenderer from "./DualRenderer";
import { useKarteState } from "../karteState";
import {
  AttributeLabel,
  AttributeValue,
  IndexRow,
  TimeCell,
  UpperLeft,
  SOACell,
} from "./BoardCmp";
import SimpleAlert from "../../../cmp/SimpleAlert";
import StampSearcher from "./StampSearcher";

const DESC = true;
const PAGE_SIZE = 6;
const TEXT_NEW_KARTE = "新規カルテ";
const TEXT_ADD_PROCEDURE = "エディタ...";

const RENDER_OPTIONS = [
  { label: "カルテ", render: "mosaic" },
  { label: "会計", render: "dual" },
  { label: "レセプト", render: "receipt" },
];

const ADDITIONAL_ATTRIBUTES = [
  { label: "受診時年齢", attr: "ageAt", id: v4() },
  { label: "診療科", attr: "deptName", id: v4() },
  { label: "健康保険", attr: "provider", id: v4() },
  { label: "医師", attr: "physician", id: v4() },
  { label: "代行入力", attr: "clerk", id: v4() },
  { label: "バージョン", attr: "revision", id: v4() },
];

const READY = "ready";
const SELECTED = "selected";
const EDITING = "editing";
const EDIT_END = "editEnd";

const KarteBoard = ({ patient }) => {
  const margaret = useMargaret();
  const [
    {
      bundleArraySubmitted,
      bundleCopied,
      user,
      isOnline,
      showWhiteQR,
      settings,
    },
    dispatch,
  ] = useStateValue();
  const [{ continuedDisease }, karteDispath] = useKarteState();
  const [
    {
      boardState,
      render,
      fetchMode,
      karteList,
      entryDates,
      numKarte,
      kartePeriod,
      pivot,
      sortedPivot,
      receiptPivot,
      selectedIndex,
      transitionError,
      alert,
      karteToDiscard,
      karteToDelete,
      newKarteParams,
      soaText,
      soaEditing,
      downloadSrc,
      canUndo,
      canRedo,
      testPop,
    },
    localDispatch,
  ] = useReducer(boardReducer, boardInitialState);
  const facility = useFacility(user);
  const clerk = useClerk(user);
  const element = useRef(undefined);

  useIntersectionObserver(element, 0.1, () => {
    localDispatch({ type: "nextPage" });
  });

  useEffect(() => {
    if (!patient.id || !facility || !render || !fetchMode || !user) {
      return;
    }
    const asyncGet = async (
      mode,
      fc_id,
      pt_id,
      limit,
      offset,
      client_order,
      render
    ) => {
      try {
        const result = await margaret
          .getApi("karte")
          .getHistory(fc_id, pt_id, limit, offset, client_order, render);
        if (mode === "reset") {
          localDispatch({ type: "setData", payload: result });
          return;
        }
        if (mode === "append") {
          localDispatch({ type: "appendKarte", payload: result });
        }
      } catch (err) {
        localDispatch({ type: "setTransitionError", payload: err.message });
      }
    };
    const { currPage, mode } = fetchMode;
    const facility_id = facility.id;
    const patient_id = patient.id;
    const limit = PAGE_SIZE;
    const offset = (currPage - 1) * PAGE_SIZE;
    const client_order = DESC ? "desc" : "asc";
    asyncGet(
      mode,
      facility_id,
      patient_id,
      limit,
      offset,
      client_order,
      render
    );
  }, [patient.id, facility, user, render, fetchMode]);

  useEffect(() => {
    if (numKarte === null && kartePeriod === null) {
      return;
    }
    karteDispath({ type: "setKarteShape", payload: { numKarte, kartePeriod } });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numKarte, kartePeriod]);

  // boardState -> editing | editEnd -> dirty list
  useEffect(() => {
    if (!patient) {
      return;
    }
    if (boardState === EDITING) {
      dispatch({ type: "addDirty", ptId: patient.ptId });
    }
    if (boardState === EDIT_END) {
      dispatch({ type: "removeDirty", ptId: patient.ptId });
    }
  }, [dispatch, boardState, patient]);

  // Bundle がサブミットされた時
  useEffect(() => {
    let accept = boardState === EDITING; // In editing mode
    accept = accept && bundleArraySubmitted?.patient?.ptId === patient.ptId; // patient match
    accept =
      accept &&
      (bundleArraySubmitted?.origin === "stampBox" ||
        bundleArraySubmitted?.origin === "karte"); // Only accept selected in the stamp box
    accept = accept && bundleArraySubmitted?.array?.length > 0; // At least one bundle
    if (!accept) {
      return;
    }
    // bundleArraySubmitted = immutable, so copy it
    const coppied = JSON.parse(JSON.stringify(bundleArraySubmitted));
    coppied.array.forEach((bundle) => {
      if (bundle.group === GROUP_VITAL_SIGN) {
        localDispatch({
          type: "insertSoaText",
          payload: JSON.stringify(bundle, null, 3),
        });
      }
      if (bundle.group === GROUP_DIAGNOSIS) {
        const diagnosis = bundle.claimItems[0];
        const { pvt } = patient;
        if (pvt) {
          diagnosis.pvtPhyId = pvt.phyId;
          diagnosis.pvtDeptId = pvt.deptId;
          diagnosis.hisCombinationNumber = pvt.hisCombinationNumber;
        }
        diagnosis.dateOfOnset = dateFormat(new Date(), ISO_DATE_TIME);
      }
      if (bundle.group === GROUP_SCHEMA) {
        const karte = karteList[selectedIndex]; // 編集中のカルテ
        const batchNo =
          karte.p.filter((x) => x.group === GROUP_SCHEMA).length + 1;
        bundle.claimItems[0].code = `00${batchNo}`; // stop max 3
      }
      if (bundle.group === GROUP_REF_IMAGE) {
        const karte = karteList[selectedIndex]; // 編集中のカルテ
        const batchNo =
          karte.p.filter((x) => x.group === GROUP_REF_IMAGE).length + 1;
        bundle.claimItems[0].code = `00${batchNo}`; // stop max 3
      }
      if (bundle.group === GROUP_PDF) {
        const karte = karteList[selectedIndex]; // 編集中のカルテ
        const batchNo = karte.p.filter((x) => x.group === GROUP_PDF).length + 1;
        bundle.claimItems[0].code = `00${batchNo}`; // stop max 3
      }
      localDispatch({ type: "addBundle", payload: bundle });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleArraySubmitted]);

  // 新規カルテボタンクリック
  const handleNewKarte = () => {
    const doctors = [...facility.doctors]; // 担当医リスト
    let selectedDoctor = -1;
    if (user.license === "doctor") {
      doctors.some((d, i) => {
        if (d.id === user.id) {
          selectedDoctor = i;
          return true;
        }
        return false;
      });
    }
    const isClerk = selectedDoctor === -1;
    // 診療科と保険のリストを作成し、新規カルテダイアログへ渡す
    const depts = listDepartments(facility);
    const insurances = patient.healthInsurances;
    // console.log(JSON.stringify(insurances, null, 3));
    // debugger;
    let selectedDept = 0;
    let selectedInsurance = 0;

    // 患者の属性に受付情報を持っている
    // 受付された診療科と保険を選択する ToDo
    const { visit } = patient;
    if (visit) {
      // 受付情報から診療科と保険をとる
      const { deptId } = visit;
      if (deptId) {
        depts.some((d, i) => {
          if (d.deptId === deptId) {
            selectedDept = i;
            return true;
          }
          return false;
        });
      }
    }
    // 新規カルテ作成パラメータを作成しstoreを更新する -> 新規カルテダイアログがオープンする
    const newKarteParams = {
      doctors,
      depts,
      insurances,
      selectedDoctor, // index
      isClerk,
      selectedDept, // index
      selectedInsurance, // index
    };
    localDispatch({ type: "openNewKarteDialog", payload: newKarteParams });
  };

  // From NewkarteDialog
  const handleNewKarteDialog = (newKarteMode) => {
    localDispatch({ type: "closeNewKarteDialog" });
    const {
      mode,
      importActive,
      selectedDoctor,
      selectedDept,
      selectedHis,
      isClerk,
    } = newKarteMode;
    if (EMPTY_NEW === mode) {
      createEmptyNewKarte(
        selectedDoctor,
        selectedDept,
        selectedHis,
        isClerk,
        importActive
      );
      return;
    }
    if (APPLY_RP === mode) {
      createApplyRpKarte(
        selectedDoctor,
        selectedDept,
        selectedHis,
        isClerk,
        importActive
      );
      return;
    }
    if (WHOLE_COPY === mode) {
      createWholeCopyKarte(
        selectedDoctor,
        selectedDept,
        selectedHis,
        isClerk,
        importActive
      );
    }
  };

  const handleCancelNewKarteDialog = () => {
    localDispatch({ type: "closeNewKarteDialog" });
  };

  // 空白の新規カルテを作成する
  // selectedDept: 新規カルテ作成ダイアログで選択された診療科
  // selectedHis: 新規カルテ作成ダイアログで選択された保険
  const createEmptyNewKarte = (
    selectedDoctor,
    selectedDept,
    selectedHis,
    isClerk,
    importActive = false
  ) => {
    const activeDiag = importActive ? createActiveDiagnosis() : [];
    const newKarte = newKarteContext(
      patient,
      facility,
      selectedDoctor,
      selectedDept,
      selectedHis,
      isClerk ? clerk : null
    ); // 新規カルテのcontext情報
    const empty = "";
    newKarte.soa = { content: empty }; // SAOは空  maby no need
    newKarte.p = activeDiag; // Pは病名のみ
    // カルテリストへ追加する
    localDispatch({ type: "addkarte", payload: newKarte });
    localDispatch({ type: "setSoaText", payload: empty });
  };

  // 前回処方を適用して新規カルテを作成する
  // selectedDept: 新規カルテ作成ダイアログで選択された診療科
  // selectedHis: 新規カルテ作成ダイアログで選択された保険
  const createApplyRpKarte = (
    selectedDoctor,
    selectedDept,
    selectedHis,
    isClerk,
    importActive = false
  ) => {
    // アクティブ病名
    const myP = importActive ? createActiveDiagnosis() : [];
    let targetIndex = -1;
    // RPを持つカルテがあるまでリストを探す
    if (DESC) {
      for (let col = 0; col < karteList.length; col += 1) {
        const test = karteList[col];
        const hasRp = test.p.some((ent) => {
          return ent.entity === "rp";
        });
        if (hasRp) {
          targetIndex = col;
          break;
        }
      }
    }
    if (!DESC) {
      // Reverse order
      for (let col = karteList.length - 1; col >= 0; col -= 1) {
        const test = karteList[col];
        const hasRp = test.p.some((ent) => {
          return ent.entity === "rp";
        });
        if (hasRp) {
          targetIndex = col;
          break;
        }
      }
    }
    // 無かった場合は空白のカルテを作成する
    if (targetIndex === -1) {
      const newKarte = newKarteContext(
        patient,
        facility,
        selectedDoctor,
        selectedDept,
        selectedHis,
        isClerk ? clerk : null
      );
      const empty = "";
      newKarte.soa = { content: empty };
      newKarte.p = myP;
      localDispatch({ type: "addkarte", payload: newKarte });
      localDispatch({ type: "setSoaText", payload: empty });
      return;
    }
    // RPのある前回のカルテ bundleId...
    const target = karteList[targetIndex];

    target.p
      .filter((x) => x.entity === "rp")
      .forEach((b) => {
        const copy = JSON.parse(JSON.stringify(b));
        // ID renumbering
        copy.id = v4();
        copy.claimItems.forEach((i) => {
          i.id = v4();
        });
        myP.push(copy);
      });
    const newKarte = newKarteContext(
      patient,
      facility,
      selectedDoctor,
      selectedDept,
      selectedHis,
      isClerk ? clerk : null
    );
    const empty = "";
    newKarte.soa = { content: empty }; // SOAは空 -> maybe no need
    newKarte.p = myP; // RP リスト
    localDispatch({ type: "addkarte", payload: newKarte });
    localDispatch({ type: "setSoaText", payload: empty });
  };

  // 丸ごとコピーして新規カルテを作成する
  // selectedDept: 新規カルテ作成ダイアログで選択された診療科
  // selectedHis: 新規カルテ作成ダイアログで選択された保険
  const createWholeCopyKarte = (
    selectedDoctor,
    selectedDept,
    selectedHis,
    isClerk,
    importActive = false
  ) => {
    const myP = importActive ? createActiveDiagnosis() : [];
    const targetIndex = DESC ? 0 : karteList.length - 1;
    const target = karteList[targetIndex];
    const copy = JSON.parse(JSON.stringify(target)); // Referenceさせない
    // Renumbering ID  病名を除く
    copy.p
      .filter((x) => x.group !== GROUP_DIAGNOSIS)
      .forEach((b) => {
        b.id = v4();
        b.claimItems.forEach((i) => {
          i.id = v4();
        });
        myP.push(b);
      });
    const newKarte = newKarteContext(
      patient,
      facility,
      selectedDoctor,
      selectedDept,
      selectedHis,
      isClerk ? clerk : null
    );
    newKarte.soa = copy.soa;
    newKarte.p = myP;
    localDispatch({ type: "addkarte", payload: newKarte });
    localDispatch({ type: "setSoaText", payload: newKarte.soa?.content || "" });
  };

  // 病名テーブルレコード => [DiagnosisBundle]
  const createActiveDiagnosis = () => {
    if (!continuedDisease || !continuedDisease.length) {
      return [];
    }
    return continuedDisease.map((diag) => {
      const a = JSON.parse(JSON.stringify(diag));
      // Bundle wrapper
      return newDiagnosisBundle(a);
      // {code, icd10, name, diagnosisCategory, outcome, dateOfOnSet, dateOfRemission, type, group, quantity, description}
    });
  };

  // カルテを修正する
  const handleModifyKarte = () => {
    const target = karteList[selectedIndex];
    const text = target?.soa?.content ?? ""; // 修正するカルテのSOA Text
    localDispatch({ type: "setSoaText", payload: `${text}` });
    localDispatch({ type: "modifyKarte", payload: clerk });
  };

  // 保存
  const handleSave = () => {
    // 保存対象のカルテ
    const target = karteList[selectedIndex]; // Index
    // 病名があるか?
    const hasDisease =
      target.p.length > 0 && target.p[0].group === GROUP_DIAGNOSIS;
    if (!hasDisease) {
      localDispatch({
        type: "setAlert",
        payload: ["傷病名をつけてください。"],
      });
      return;
    }
    // 初診再診属性を設定する
    let visitType = "";
    target.p.some((bundle) => {
      const { group } = bundle;
      if (group.startsWith(GROUP_FIRST_VISIT)) {
        visitType = VISIT_TYPE_FIRST;
        return true;
      }
      if (group.startsWith(GROUP_FOLLOW_UP_VISIT)) {
        visitType = VISIT_TYPE_FOLLOW_UP;
        return true;
      }
      return false;
    });
    // Base charge alert
    if (!visitType) {
      localDispatch({
        type: "setAlert",
        payload: ["診断料が設定されていません。"],
      });
      return;
    }
    // Clone the target then save it
    const karteToSave = JSON.parse(JSON.stringify(target));
    karteToSave.protocol = visitType; // 初診・再診を保存カルテの属性に設定する
    // SOA htmlText
    const sanitized = sanitizeHtml(soaText, {
      allowedTags: ["b", "i", "em", "strong", "a", "font", "br", "div", "p"],
      allowedAttributes: {
        a: ["href"],
        font: ["color"],
      },
    });
    karteToSave.soa = {
      id: v4(),
      content: sanitized,
    };
    // エントリー情報設定
    const confirmed = dateFormat(new Date(), ISO_DATE_TIME); // 確定日
    karteToSave.updatedAt = confirmed; // 更新日  作成日は変更されない

    // 新規カルテの場合
    if (karteToSave.status === STATUS_NEW) {
      karteToSave.status = STATUS_FINAL; // status=F
      karteToSave.createdAt = confirmed; // created = firstConfirmed = started
      //-------------------------------------
      karteToSave.soa.karte_id = karteToSave.id; // relation
      karteToSave.soa.status = karteToSave.status; // status
      karteToSave.soa.createdAt = karteToSave.createdAt;
      karteToSave.soa.createdAt = karteToSave.updatedAt;
      //---------------------------------------------------------------------
      // Bundle composite setting
      //---------------------------------------------------------------------
      const {
        facilityId,
        patientId,
        physicianId,
        hisId,
        providerNumber,
        deptId,
        deptName,
        createdAt,
        updatedAt,
        status,
      } = karteToSave;
      let batchNo = 1;
      karteToSave.p.forEach((b) => {
        b.id = b.id ? b.id : v4();
        b.karte_id = karteToSave.id; // relation
        b.facilityId = facilityId;
        b.patientId = patientId;
        b.physicianId = physicianId;
        b.hisId = hisId;
        b.providerNumber = providerNumber;
        b.deptId = deptId;
        b.deptName = deptName;
        b.createdAt = createdAt;
        b.updatedAt = updatedAt;
        b.status = status;
        b.batchNo = batchNo;
        // 親子関係
        let claim_batch = 1;
        b.claimItems.forEach((c) => {
          c.id = c.id ? c.id : v4();
          c.bundle_id = b.id; // relation
          c.facilityId = facilityId;
          c.patientId = patientId;
          c.physicianId = physicianId;
          c.hisId = hisId;
          c.deptId = deptId;
          c.deptName = deptName;
          c.createdAt = createdAt;
          c.updatedAt = updatedAt;
          c.status = status;
          c.batchNo = claim_batch;
          claim_batch += 1;
          //---------------------------------------------------------------------
          // ClaimItem の Value = bundle.quantity * item.quantity
          //---------------------------------------------------------------------
          if (isClaimGroup(b.group) && !c.drop) {
            const cNum = Number(c.quantity);
            c.value = isNaN(cNum) ? 1 : cNum;
          }
        });
        batchNo += 1;
      });
    }
    // 修正の場合
    if (karteToSave.status === STATUS_UPDATE) {
      const idToOutDate = karteToSave.id; // out date するカルテ = old edition
      karteToSave.id = v4(); // 新規の uuid
      karteToSave.outdateId = idToOutDate; // 保存するカルテの outDate 属性を使用し、DB側でout date をする
      karteToSave.revision = incrementRevisionNumber(karteToSave.revision); // リビション設定
      karteToSave.status = STATUS_FINAL; // F
      //---------------------------------------------------------
      karteToSave.soa.karte_id = karteToSave.id;
      karteToSave.soa.status = karteToSave.status;
      karteToSave.soa.createdAt = karteToSave.createdAt;
      karteToSave.soa.createdAt = karteToSave.updatedAt;
      //---------------------------------------------------------
      // Bundle composite setting
      //---------------------------------------------------------
      const {
        facilityId,
        patientId,
        physicianId,
        hisId,
        providerNumber,
        deptId,
        deptName,
        createdAt,
        updatedAt,
        status,
      } = karteToSave;
      let batchNo = 1;
      karteToSave.p.forEach((b) => {
        b.id = v4(); // 新規の uuid
        b.karte_id = karteToSave.id;
        b.facilityId = facilityId;
        b.patientId = patientId;
        b.physicianId = physicianId;
        b.hisId = hisId;
        b.providerNumber = providerNumber;
        b.deptId = deptId;
        b.deptName = deptName;
        b.createdAt = createdAt;
        b.updatedAt = updatedAt;
        b.status = status;
        b.batchNo = batchNo;
        let claim_batch = 1;
        b.claimItems.forEach((c) => {
          c.id = v4(); // 新規の uuid
          c.bundle_id = b.id;
          c.facilityId = facilityId;
          c.patientId = patientId;
          c.physicianId = physicianId;
          c.hisId = hisId;
          c.deptId = deptId;
          c.deptName = deptName;
          c.createdAt = createdAt;
          c.updatedAt = updatedAt;
          c.status = status;
          c.batchNo = claim_batch;
          claim_batch += 1;
          //---------------------------------------------------------------------
          // ClaimItem の Value = bundle.quantity * item.quantity
          //---------------------------------------------------------------------
          if (isClaimGroup(b.group) && !c.drop) {
            const cNum = Number(c.quantity);
            c.value = isNaN(cNum) ? 1 : cNum;
          }
        });
        batchNo += 1;
      });
    }
    // 保存
    const asyncPost = async (karte) => {
      localDispatch({ type: "setStateTransition" });
      try {
        await margaret.getApi("karte").postKarte(karte);
        localDispatch({ type: "karteSaved" });
        localDispatch({ type: "reset" });
      } catch (err) {
        console.log(`Save karte Error ${err}`);
        localDispatch({ type: "setTransitionErr", payload: err.message });
      }
    };
    if (isOnline) {
      console.log(JSON.stringify(karteToSave, null, 3));
      asyncPost(karteToSave);
    }
  };

  // Discard ?
  const showDiscardAlert = () => {
    localDispatch({ type: "alertDiscard" });
  };

  // Select cancel on the discard dialog
  const cancelDiscard = () => {
    localDispatch({ type: "cancelDiscard" });
  };

  // Select discard
  const handleDiscard = () => {
    localDispatch({ type: "discard" });
    localDispatch({ type: "karteSaved" });
    localDispatch({ type: "reset" });
  };

  // Delete ?
  const showDeleteAlert = () => {
    localDispatch({ type: "alertDelete" });
  };

  // Select cancel
  const cancelDelete = () => {
    localDispatch({ type: "cancelDelete" });
  };

  // Select delete
  const handleDelete = () => {
    localDispatch({ type: "deleteKarte" });
    // 単純選択のカルテを削除
    const doDelete = async (pk) => {
      localDispatch({ type: "setStateTransition" });
      await margaret
        .getApi("karte")
        .deleteKarte(pk)
        .then(() => {
          localDispatch({ type: "reset" });
        });
    };
    doDelete(karteToDelete.id).catch((err) => console.log(err));
  };

  const handleSelectKarte = (e) => {
    e.preventDefault();
    const col = Number(e.currentTarget.getAttribute("data-item"));
    localDispatch({ type: "setSelected", payload: col });
  };

  const handleCancelDownload = () => {
    localDispatch({ type: "download", payload: null });
  };

  const handleUndo = () => {
    localDispatch({ type: "undo" });
  };

  const handleRedo = () => {
    localDispatch({ type: "redo" });
  };

  const handleSoaInput = (text) => {
    localDispatch({ type: "setSoaInput", payload: text });
  };

  const handleSoaBlur = () => {
    localDispatch({ type: "setSoaBlur" });
  };

  const handleOpenStampMaker = () => {
    dispatch({ type: "toggleStampMaker" });
  };

  const handleTestPopSelect = (item) => {
    localDispatch({ type: "testPop", payload: null });
    const { action, data } = item;
    // data: dnd: {}  important!
    const dnd = data?.dnd ?? null;

    if (action === "download") {
      PopFunc[action](data);
      return;
    }
    if (action === "copy" && dnd) {
      dispatch({ type: "copyBundle", bundle: dnd });
      return;
    }
    if (action === "paste" && bundleCopied) {
      const bdl = JSON.parse(bundleCopied);
      dispatch({ type: "dropStamp", stamp: bdl });
      return;
    }
    if (action === "edit" && dnd) {
      const bundle = JSON.parse(dnd);
      const { group } = bundle;
      if (group === GROUP_DIAGNOSIS) {
        dispatch({ type: "setDiagnosisToChange", target: bundle });
      } else {
        const r = /^[A-Z]/;
        const reducerAction = r.test(group)
          ? "setInputToChange"
          : "setBundleToChange";
        dispatch({ type: reducerAction, target: bundle });
      }
      return;
    }
    if (action === "delete" && dnd) {
      const bundle = JSON.parse(dnd);
      localDispatch({ type: "deleteBundle", payload: bundle.id });
      return;
    }
  };

  const handleTestPopCancel = () => {
    localDispatch({ type: "testPop", payload: null });
  };

  return (
    <Layout className="z3-karte">
      <div
        className="z3-flex z3-text-09-rem"
        style={{
          "--align": "center",
          padding: "0 16px 4px 16px",
          overflowY: "visible",
        }}
      >
        <button
          className="w3-button w3-round-small"
          disabled={
            !(
              (boardState === READY || boardState === SELECTED) &&
              render === "mosaic"
            )
          }
          onClick={handleNewKarte}
        >
          <AddStyle>
            <MdOutlineAdd />
            <AddText>{TEXT_NEW_KARTE}</AddText>
          </AddStyle>
        </button>
        <UndoButton
          size="18px"
          disabled={soaEditing || !canUndo}
          onClick={handleUndo}
        />
        <RedoButton
          size="18px"
          disabled={soaEditing || !canRedo}
          onClick={handleRedo}
        />
        <button
          className="w3-button w3-round-small"
          disabled={boardState !== EDITING}
          onClick={handleSave}
        >
          {SAVE_TEXT}
        </button>
        <button
          className="w3-button w3-round-small"
          disabled={!(boardState === SELECTED && render !== "receipt")}
          onClick={handleModifyKarte}
        >
          {MODIFY}
        </button>
        {boardState !== EDITING && (
          <button
            className="w3-button w3-hover-red w3-round-small"
            disabled={!(boardState === SELECTED && render === "mosaic")}
            onClick={showDeleteAlert}
          >
            {DELETE_TEXT}
          </button>
        )}
        {boardState === EDITING && (
          <button
            className="w3-button w3-hover-red w3-round-small"
            disabled={false}
            onClick={showDiscardAlert}
          >
            {DISCARD_TEXT}
          </button>
        )}
        <div className="z3-flex-glue" />
        <StampSearcher disabled={boardState !== EDITING} />
        <button
          className="w3-button w3-round-large w3-padding-small"
          disabled={boardState !== EDITING}
          onClick={handleOpenStampMaker}
        >
          {TEXT_ADD_PROCEDURE}
        </button>
        <div className="z3-flex-glue" />
        <span className="z3-white-space-pre">表示: </span>
        <MosaicSelector2
          options={RENDER_OPTIONS}
          myRender={render || "mosaic"}
          disabled={boardState === EDITING}
          localDispatch={localDispatch}
          right={true}
        />
      </div>
      <Board>
        <MyTable>
          <StickyColumn>
            <tr>
              <UpperLeft>診療日</UpperLeft>
              {karteList.map((karte, col) => {
                const { createdAt, status } = karte;
                const date = dateFormat(createdAt, "yyyy'年'm'月'd'日'");
                const frmNow = fromNowRough(createdAt);
                const newKarte = status === STATUS_NEW;
                const selected = col === selectedIndex;
                return (
                  <TimeCell
                    key={createdAt}
                    style={{
                      "--cell-width":
                        render === "dual"
                          ? "var(dual-cell-width)"
                          : render === "receipt"
                          ? "var(receipt-cell-width)"
                          : "var(data-cell-width)",
                      "--bk": selected ? "var(--primary)" : "var(--karte)",
                      "--on-bk": selected
                        ? "var(--on-primary)"
                        : "var(--on-header)",
                      "--text": newKarte ? "" : `'（${frmNow}）'`,
                    }}
                    data-item={col}
                    onClick={handleSelectKarte}
                  >
                    {newKarte ? "新規カルテ" : date}
                  </TimeCell>
                );
              })}
            </tr>
          </StickyColumn>
          {render === "dual" && pivot && receiptPivot ? (
            <DualRenderer
              facility={facility}
              karteList={karteList}
              entryDates={entryDates}
              pivot={pivot}
              receiptPivot={receiptPivot}
              localDispatch={localDispatch}
            />
          ) : render === "receipt" && pivot && receiptPivot ? (
            <ReceiptRenderer
              facility={facility}
              karteList={karteList}
              entryDates={entryDates}
              pivot={pivot}
              receiptPivot={receiptPivot}
              localDispatch={localDispatch}
            />
          ) : render === "mosaic" && pivot ? (
            <EntityRenderer
              facility={facility}
              karteList={karteList}
              entryDates={entryDates}
              pivot={pivot}
              sortedPivot={sortedPivot}
              soaText={soaText}
              handleSoaInput={handleSoaInput}
              handleSoaBlur={handleSoaBlur}
              localDispatch={localDispatch}
            />
          ) : (
            <div />
          )}
          {render !== "mosaic" && (
            <StickyBody>
              <tr>
                <IndexRow>
                  主訴
                  <br />
                  所見
                  <br />
                  評価
                </IndexRow>
                {karteList.map((karte) => {
                  return karte.status === "F" ? (
                    <SOACell
                      key={karte.id}
                      style={{
                        "--cell-width":
                          render === "dual"
                            ? "var(--dual-cell-width)"
                            : render === "receipt"
                            ? "var(--receipt-cell-width)"
                            : "var(--data-cell-width)",
                        "--bk": settings.isSoaColoring
                          ? "var(--soa)"
                          : "var(--karte)",
                        "--on-bk": settings.isSoaColoring
                          ? "var(--on-soa)"
                          : "var(--on-karte)",
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: karte.soa?.content }}
                      />
                    </SOACell>
                  ) : (
                    <SOACell
                      key={karte.id}
                      style={{
                        "--cell-width":
                          render === "dual"
                            ? "var(--dual-cell-width)"
                            : render === "receipt"
                            ? "var(--receipt-cell-width)"
                            : "var(--data-cell-width)",
                        "--bk": settings.isSoaColoring
                          ? "var(--soa)"
                          : "var(--karte)",
                        "--on-bk": settings.isSoaColoring
                          ? "var(--on-soa)"
                          : "var(--on-karte)",
                      }}
                    >
                      <SOAEditor2
                        htmlText={soaText}
                        onInput={handleSoaInput}
                        onBlur={handleSoaBlur}
                      />
                    </SOACell>
                  );
                })}
              </tr>
            </StickyBody>
          )}
          <StickyBody>
            {ADDITIONAL_ATTRIBUTES.map((attr) => {
              return (
                <tr key={attr.id}>
                  <AttributeLabel width="dual">{attr.label}</AttributeLabel>
                  {karteList.map((karte) => {
                    const key = attr["attr"];
                    let value;
                    if (key === "ageAt") {
                      const dob = karte["dob"];
                      const created = new Date(karte["createdAt"]);
                      value = ageAt(dob, created);
                    } else if (key === "revision") {
                      value = getRevision(karte[key]);
                    } else {
                      value = karte[key];
                    }
                    const id = `${attr.id}${karte.id}`;
                    return (
                      <AttributeValue
                        key={id}
                        style={{
                          "--cell-width":
                            render === "dual"
                              ? "var(--dual-cell-width)"
                              : render === "receipt"
                              ? "var(--receipt-cell-width)"
                              : "var(--data-cell-width)",
                        }}
                      >
                        {value}
                      </AttributeValue>
                    );
                  })}
                </tr>
              );
            })}
          </StickyBody>
        </MyTable>
        {DESC && <Observable ref={element} />}
      </Board>
      {transitionError && (
        <SimpleAlert
          width="384px"
          onCancel={() => localDispatch({ type: "recoverState" })}
        >
          {transitionError.map((msg, i) => {
            return <p key={i}>{msg}</p>;
          })}
        </SimpleAlert>
      )}
      {alert && (
        <SimpleAlert
          width="384px"
          onCancel={() => localDispatch({ type: "setAlert", payload: null })}
        >
          {alert.map((msg, i) => {
            return <p key={i}>{msg}</p>;
          })}
        </SimpleAlert>
      )}
      {karteToDiscard && (
        <DaingerSelection
          messages={["編集した内容を破棄しますか?"]}
          daingerText={DISCARD_TEXT}
          onDainger={handleDiscard}
          onCancel={cancelDiscard}
        />
      )}
      {karteToDelete && (
        <DaingerSelection
          messages={[
            `${dateFormat(
              karteToDelete.createdAt,
              "yyyy-m-d"
            )}のカルテを削除しますか?`,
          ]}
          onDainger={handleDelete}
          onCancel={cancelDelete}
        />
      )}
      {newKarteParams && (
        <NewKarteDialog
          empty={karteList.length === 0}
          activeEmpty={continuedDisease.length === 0}
          newKarteParams={newKarteParams}
          onSelect={handleNewKarteDialog}
          onCancel={handleCancelNewKarteDialog}
        />
      )}
      {testPop && (
        <ContextMenu
          clickPoint={testPop.point}
          menus={testPop.menus}
          onSelect={handleTestPopSelect}
          onCancel={handleTestPopCancel}
        />
      )}
      {downloadSrc && (
        <DownloadFile src={downloadSrc} onCancel={handleCancelDownload} />
      )}
      {showWhiteQR && (
        <WhiteQR
          user={user}
          onCancel={() => dispatch({ type: "showWhiteQR" })}
        />
      )}
    </Layout>
  );
};

const Layout = styled.div`
  padding-top: 16px;
  overflow-y: hidden;
`;

const Board = styled.div`
  display: flex;
  flex-wrap: nowrap;
  max-height: calc(100vh - 180px); // measure
  overflow-x: auto;
`;

const Observable = styled.div`
  width: 32px;
  flex-shrink: 0;
  align-items: stretch;
`;

const MyTable = styled.table.attrs({
  className: "w3-table w3-border w3-bordered",
})`
  flex-shrink: 0;
`;

const AddStyle = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
`;

const AddText = styled.div`
  font-size: 0.9rem !important;
`;

const EnhancedKarteBoard = withDisplayBlock(KarteBoard);
export default EnhancedKarteBoard;
