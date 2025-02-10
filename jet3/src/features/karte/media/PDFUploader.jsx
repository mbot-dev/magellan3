import { useRef, useState } from "react";
import styled from "styled-components";
import { useStateValue } from "../../../reducers/state";
import { currFacility } from "../../../models/karteCtx";
import { useMargaret } from "../../../io/MargaretProvider";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { getValue, handleKeyDown } from "../../../aux/FormUtil";
import { useFileInfo } from "../../../hook/useFileInfo";
import claimFunc from "../../../models/claimFunc";

const UPLOAD_PATH = "/media/api/v1/upload/pdf";
const TEXT_TITLE = "PDF添付";
const TEXT_ATTACH = "添 付";
const TEXT_FILE_NAME = "ファイル名";
const TEXT_SIZE = "容量";
const TEXT_LAST_MODIFIED = "最終更新日";
const TEXT_MEMO = "用途（オプション）";
const TEXT_PLACE_HOLDER = "問診、紹介状...";

const PDFUploader = ({ target }) => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const [pdfName, pdfSize, pdfLastModified] = useFileInfo(target);
  const [desc, setDesc] = useState("");
  const facility_id = useRef(currFacility(user).id);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", target, pdfName);
    const path = `${UPLOAD_PATH}/${facility_id.current}`;
    await margaret
      .getApi("media")
      .upload(path, formData) // upload pdf file
      .then((res) => {
        const { body, filename } = res; // response = body -> uuid.pdf -> claimItems.body
        const { lastModified, size, type } = target;
        const pdfData = {
          filename, // original filename
          contentType: type,
          size,
          lastModified,
          body, // upload response: pdf file name(unique) to download
          description: desc,
        };
        const pdfItem = claimFunc["createPDFItem"](pdfData); // pdfItem
        const pdfBundle = claimFunc["createBundle"](["pdf", pdfItem]); // pdf=entity -> bundle template
        dispatch({ type: pdfBundle.onCreate, bundle: pdfBundle }); // pdfBundle.onCreate=submitPDFFile
      })
      .catch((err) => {
        console.log(err); // ToDo Alert
      })
      .finally(() => {
        dispatch({ type: "setPdfFileToUpload", target: null });
      });
  };

  const handleCancel = () => {
    dispatch({ type: "setPdfFileToUpload", target: null });
  };

  const handleMemo = (e) => {
    setDesc(getValue(e));
  };

  return (
    target && (
      <ModalEditorLarge
        id="pdf_uploader"
        title={TEXT_TITLE}
        okText={TEXT_ATTACH}
        onSubmit={handleUpload}
        onCancel={handleCancel}
        width="512px"
      >
        <ul className="w3-ul">
          <li style={ListStyle}>
            <div className="z3-flex">
              <ItemName>{TEXT_FILE_NAME}</ItemName>
              <ItemValue>{pdfName}</ItemValue>
            </div>
          </li>
          <li style={ListStyle}>
            <div className="z3-flex">
              <ItemName>{TEXT_SIZE}</ItemName>
              <ItemValue>{pdfSize}</ItemValue>
            </div>
          </li>
          <li style={ListStyle}>
            <div className="z3-flex">
              <ItemName>{TEXT_LAST_MODIFIED}</ItemName>
              <ItemValue>{pdfLastModified}</ItemValue>
            </div>
          </li>
          <li style={ListStyle}>
            <div className="z3-flex">
              <ItemName>{TEXT_MEMO}</ItemName>
              <input
                type="text"
                className="w3-input w3-border w3-border-light-gray w3-round"
                style={{ marginLeft: "10px" }}
                autoFocus={true}
                placeholder={TEXT_PLACE_HOLDER}
                value={desc}
                onChange={handleMemo}
                onKeyDown={handleKeyDown}
              />
            </div>
          </li>
        </ul>
      </ModalEditorLarge>
    )
  );
};

const ListStyle = {
  borderBottom: "0",
};

const ItemName = styled.span`
  flex: 0 0 180px;
`;

const ItemValue = styled.span`
  flex-grow: 1;
  margin-left: 16px;
`;

export default PDFUploader;
