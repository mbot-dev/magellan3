import { useEffect, useState, useRef } from "react";
import dateFormat from "dateformat";
import { useStateValue } from "../../../reducers/state";
import {
  ISO_DATE_TIME,
  newDocumentContext,
  STATUS_FINAL,
  STATUS_NEW,
  STATUS_UPDATE,
} from "../../../models/karteCtx";
import LetterForm from "./LetterForm";
import LetterReply from "./LetterReply";
import MedicalCertificateForm from "./MedicalCertificateForm";
import { letterHTML, replyHTML, certificateHTML } from "./leterTemplate";
import { useMargaret } from "../../../io/MargaretProvider";
import withDisplayNull from "../../../aux/withDisplayNull";
import { currFacility } from "../../../models/karteCtx";
import styled from "styled-components";
import { getSelectedRow } from "../../../aux/FormUtil";
import { useReactToPrint } from "react-to-print";
import HTMLLetter from "./HTMLLetter";
import HTMLReply from "./HTMLReply";
import HTMLCertificate from "./HTMLCertificate";
import ClickDropdown from "../../../cmp/ClickDropdown";

const CommandBar = styled.div`
  display: inline-block;
  margin-top: 16px;
  padding-left: 16px;
`;

const DOC_TYPE_LETTER = "letter";
const DOC_TYPE_REPLY = "reply";
const DOC_TYPE_CERTIFICATION = "certification";

const LETTER_INDEX = 0;
const REPLY_INDEX = 1;
const CERTIFICATE_INDEX = 2;

const MEDICAL_DOCUMENT_MENUS = [
  { index: LETTER_INDEX, name: "診療情報提供書" },
  { index: REPLY_INDEX, name: "ご報告(返書)" },
  { index: CERTIFICATE_INDEX, name: "診断書" },
];

const ENTRY_FORMAT = "yyyy-mm-dd";

const getDocType = (docType) => {
  if (docType === "letter") {
    return "診療情報提供書";
  }
  if (docType === "reply") {
    return "返書";
  }
  if (docType === "certification") {
    return "診断書";
  }
};

const useControl = (mode, selectedRow, isValid) => {
  const [canSelect, setCanSelect] = useState(false);
  const [caneNew, setCanNew] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [canPreview, setCanPreview] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canDiscard, setCanDiscard] = useState(false);

  useEffect(() => {
    // Browsing mode
    if (mode === 0) {
      setCanSelect(true);
      setCanNew(true);
      setCanModify(selectedRow !== -1);
      setCanPreview(selectedRow !== -1);
      setCanSave(false);
      setCanDelete(selectedRow !== -1);
      setCanDiscard(false);
    }
    // New doc mode
    else if (mode === 1) {
      setCanSelect(false);
      setCanNew(false);
      setCanModify(false);
      setCanPreview(true);
      setCanSave(isValid);
      setCanDelete(false);
      setCanDiscard(true);
    }
    // Modify mode
    else if (mode === 2) {
      setCanSelect(false);
      setCanNew(false);
      setCanModify(false);
      setCanPreview(true);
      setCanSave(isValid);
      setCanDelete(false);
      setCanDiscard(true);
    }
  }, [mode, selectedRow, isValid]);

  return [
    canSelect,
    caneNew,
    canModify,
    canPreview,
    canSave,
    canDelete,
    canDiscard,
  ];
};

// Container for Letter, Reply, Certificate
const MedicalDocument = ({ show, patient }) => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const [docList, setDocList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(-1); // No selection
  const [editingDoc, setEditingDoc] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [mode, setMode] = useState(0);
  const [
    canSelect,
    caneNew,
    canModify,
    canPreview,
    canSave,
    canDelete,
    canDiscard,
  ] = useControl(mode, selectedRow, isValid);
  const fetched = useRef(false);
  const compToPrint = useRef(undefined);
  const docToPrintRef = useRef(undefined);

  useEffect(() => {
    let go = show;
    go = go && !fetched.current;
    go = go && user;
    go = go && patient;
    if (!go) {
      return;
    }
    const asyncGet = async (facility_id, patient_id) => {
      try {
        const list = await margaret.getApi("document").getDocumentListByPatient(facility_id, patient_id);
        setDocList(list);
        fetched.current = true;
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facility_id = currFacility(user).id;
    const patient_id = patient.id;
    asyncGet(facility_id, patient_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, user, patient]);

  const handleSelectViewDoc = (e) => {
    if (!canSelect) {
      return;
    }
    setSelectedRow(getSelectedRow(e));
  };

  const setNewDocument = (newOne) => {
    setMode(1);
    setEditingDoc(newOne);
    setIsValid(false);
  };

  // Referral Letter
  const handleCreateLetter = () => {
    const facility = currFacility(user);
    const context = newDocumentContext(facility, user, patient);
    const content = {
      docType: DOC_TYPE_LETTER,
      issuedAt: dateFormat(new Date(), ISO_DATE_TIME),
      // To
      referralFacility: "",
      referralDept: "",
      referralDoctor: "",
      // Content
      disease: "",
      purpose: "",
      notes: "",
      remarks: "",
    };
    const letter = { ...context, ...content };
    setNewDocument(letter);
  };

  // Reply
  const handleCreateLetterReply = () => {
    const facility = currFacility(user);
    const context = newDocumentContext(facility, user, patient);
    const content = {
      docType: DOC_TYPE_REPLY,
      issuedAt: dateFormat(new Date(), ISO_DATE_TIME),
      // From
      referralFacility: "",
      referralDept: "",
      referralDoctor: "",
      // Content
      patientVisitedAt: null,
      objectiveNotes: "",
    };
    const reply = { ...context, ...content };
    setNewDocument(reply);
  };

  // Certification
  const handleCreateCertificate = () => {
    const facility = currFacility(user);
    const context = newDocumentContext(facility, user, patient);
    const content = {
      docType: DOC_TYPE_CERTIFICATION,
      // Contents
      issuedAt: dateFormat(new Date(), ISO_DATE_TIME),
      disease: "", // diagnosis to disease
      notes: "",
    };
    const certificate = { ...context, ...content };
    setNewDocument(certificate);
  };

  // Click dropdown
  const handleNew = (item) => {
    switch (item.index) {
      case LETTER_INDEX:
        handleCreateLetter();
        break;
      case REPLY_INDEX:
        handleCreateLetterReply();
        break;
      case CERTIFICATE_INDEX:
        handleCreateCertificate();
        break;
      default:
        break;
    }
  };

  const handlePrint = useReactToPrint({
    content: () => compToPrint.current,
  });

  const print = (target) => {
    let html;
    switch (target.docType) {
      case DOC_TYPE_LETTER:
        html = letterHTML(target);
        break;
      case DOC_TYPE_REPLY:
        html = replyHTML(target);
        break;
      case DOC_TYPE_CERTIFICATION:
        html = certificateHTML(target);
        break;
      default:
        break;
    }
    if (!html) {
      return;
    }
    const encoded = encodeURIComponent(html);
    const dataURl = `data:text/html;charset=utf-8,${encoded}`;
    Promise.all([window.bridge.printToPdf(dataURl)]).catch((err) => {
      console.log(err);
    });
  };

  const handlePreview = () => {
    if (canPreview) {
      if (mode === 0) {
        handlePrint();
      } else if (editingDoc) {
        // handlePrint2();
        print(editingDoc);
      }
    }
  };

  const save = async (doc) => {
    const isNew = doc.status === STATUS_NEW;
    const confirmed = dateFormat(new Date(), ISO_DATE_TIME);
    doc.createdAt = isNew ? confirmed : doc.createdAt;
    doc.updatedAt = confirmed;
    doc.status = STATUS_FINAL;
    const issued = doc.issuedAt
      ? doc.issuedAt
      : dateFormat(new Date(), ISO_DATE_TIME);
    doc.issuedAt = issued;
    if (isNew) {
      await margaret.getApi("document").saveDocument(doc).then(() => {
        const newList = [...docList];
        newList.unshift(doc);
        setDocList(newList);
        setEditingDoc(null);
        setIsValid(false);
        setMode(0);
        setSelectedRow(0);
      });
    } else {
      await margaret.getApi("document").updateDocument(doc.id, doc).then(() => {
        const newList = [...docList];
        newList.splice(selectedRow, 1, doc);
        setDocList(newList);
        setEditingDoc(null);
        setIsValid(false);
        setMode(0);
      });
    }
  };

  const saveLetter = (letter) => {
    save(letter).catch((err) => console.log(err));
  };

  const saveReply = (reply) => {
    if (reply.patientVisitedAt) {
      reply.patientVisitedAt = dateFormat(reply.patientVisitedAt, "yyyy-mm-dd");
    }
    save(reply).catch((err) => console.log(err));
  };

  const saveCertificate = (certificate) => {
    save(certificate).catch((err) => console.log(err));
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    const target = mode !== 0 && editingDoc ? editingDoc : null;
    if (!target) {
      return;
    }
    switch (target.docType) {
      case DOC_TYPE_LETTER:
        saveLetter(target);
        break;
      case DOC_TYPE_REPLY:
        saveReply(target);
        break;
      case DOC_TYPE_CERTIFICATION:
        saveCertificate(target);
        break;
      default:
        break;
    }
  };

  const handleDiscard = () => {
    if (canDiscard) {
      if (mode !== 0 && editingDoc) {
        setEditingDoc(null);
        setIsValid(false);
      }
      setMode(0);
    }
  };

  const handleDelete = () => {
    if (!canDelete) {
      return;
    }
    const target = docList[selectedRow];
    const doDelete = async (pk) => {
      await margaret.getApi("document").deleteDocument(pk).then(() => {
        const newList = [...docList];
        newList.splice(selectedRow, 1);
        setDocList(newList);
        if (newList.length === 0) {
          setSelectedRow(-1);
        }
        setMode(0); // Browsing
      });
    };
    doDelete(target.id).catch((err) => console.log(err));
  };

  const handleModify = () => {
    if (!canModify) {
      return;
    }
    const target = docList[selectedRow];
    const proxy = JSON.parse(JSON.stringify(target));
    proxy.status = STATUS_UPDATE;
    setEditingDoc(proxy);
    setMode(2);
  };

  return (
    <div className="w3-panel">
      <div className="w3-container">
        <table className="w3-table w3-hoverable" style={{ cursor: "pointer" }}>
          <thead>
            <tr className="w3-border-bottom">
              <th colSpan={3}>文書履歴</th>
            </tr>
          </thead>
          <tbody className="w3-border-bottom">
            {docList.map((entry, index) => {
              return (
                <tr
                  className={selectedRow === index ? "w3-light-gray" : ""}
                  key={entry.id}
                  data-item={index}
                  onClick={handleSelectViewDoc}
                >
                  <td>{dateFormat(entry.issuedAt, ENTRY_FORMAT)}</td>
                  <td>{getDocType(entry.docType)}</td>
                  <td>
                    {entry.docType !== DOC_TYPE_CERTIFICATION
                      ? entry.referralFacility
                      : entry.disease}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CommandBar>
        <ClickDropdown
          show={"true"}
          title="+新規文書"
          options={MEDICAL_DOCUMENT_MENUS}
          onSelect={handleNew}
          disabled={!caneNew}
          color={"w3-white"}
        />
        <button
          className="w3-bar-item w3-button w3-round"
          onClick={handleModify}
          disabled={!canModify}
        >
          修正
        </button>
        <button
          className="w3-bar-item w3-button w3-round"
          onClick={handlePreview}
          disabled={!canPreview}
        >
          プレビュー/印刷
        </button>
        <button
          className="w3-bar-item w3-button w3-round"
          onClick={handleSave}
          disabled={!canSave}
        >
          保存
        </button>
        {canDelete && (
          <button
            className="w3-bar-item w3-button w3-round"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            削除
          </button>
        )}
        {canDiscard && (
          <button
            className="w3-bar-item w3-button w3-round"
            onClick={handleDiscard}
            disabled={!canDiscard}
          >
            破棄
          </button>
        )}
      </CommandBar>
      {editingDoc && editingDoc.docType === DOC_TYPE_LETTER && (
        <LetterForm doc={editingDoc} isValid={setIsValid} />
      )}
      {editingDoc && editingDoc.docType === DOC_TYPE_REPLY && (
        <LetterReply doc={editingDoc} isValid={setIsValid} />
      )}
      {editingDoc && editingDoc.docType === DOC_TYPE_CERTIFICATION && (
        <MedicalCertificateForm doc={editingDoc} isValid={setIsValid} />
      )}
      <div ref={compToPrint}>
        {mode === 0 &&
          selectedRow !== -1 &&
          docList[selectedRow].docType === DOC_TYPE_LETTER && (
            <HTMLLetter letter={docList[selectedRow]} />
          )}
        {mode === 0 &&
          selectedRow !== -1 &&
          docList[selectedRow].docType === DOC_TYPE_REPLY && (
            <HTMLReply reply={docList[selectedRow]} />
          )}
        {mode === 0 &&
          selectedRow !== -1 &&
          docList[selectedRow].docType === DOC_TYPE_CERTIFICATION && (
            <HTMLCertificate certificate={docList[selectedRow]} />
          )}
      </div>
      <div style={{ display: "none" }}>
        <div ref={docToPrintRef}>
          {editingDoc && editingDoc.docType === DOC_TYPE_LETTER && (
            <HTMLLetter letter={editingDoc} />
          )}
          {editingDoc && editingDoc.docType === DOC_TYPE_REPLY && (
            <HTMLReply reply={editingDoc} />
          )}
          {editingDoc && editingDoc.docType === DOC_TYPE_CERTIFICATION && (
            <HTMLCertificate certificate={editingDoc} />
          )}
        </div>
      </div>
    </div>
  );
};

const MedicalDocumentWithDisplayNull = withDisplayNull(MedicalDocument);
export default MedicalDocumentWithDisplayNull;
