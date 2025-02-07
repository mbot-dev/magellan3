import { useState, useEffect, useRef } from "react";
import { getSelectedRow } from "../../aux/FormUtil";
import { useStateValue } from "../../reducers/state";
import withDisplayBlock from "../../aux/withDisplayBlock";
import { getInputBundle } from "../../io/inputIO";
import { getUsingInput } from "../../io/stampIO";
import { currFacility } from "../../models/karteCtx";

const MAX_PD_FILE_SIZE = 1024 * 1024 * 10; // 10M
const TEXT_IMAGE_FILE = "画像ファイル";
const TEXT_PDF_FILE = "PDFファイル";

const StampTreeInput = () => {
  const [
    { appStatus, user, usingInputs, dirtyList, currentPatient },
    dispatch,
  ] = useStateValue();
  const [canDrop, setCanDrop] = useState(false);
  const fetched = useRef(false);
  const imageRef = useRef(null);
  const pdfRef = useRef(null);

  // 使用しているInputCatalogueを取得
  // -> usingInputsにdispatchする
  // usingInputsが変化しTreeにマップされる
  useEffect(() => {
    let go = appStatus === "login";
    go = go && !fetched.current;
    let isCanceled = false;
    if (!go) {
      return;
    }
    const asyncGet = async (fcId) => {
      try {
        const results = await getUsingInput(fcId);
        if (!isCanceled) {
          dispatch({ type: "setUsingInputs", using: results });
          fetched.current = true;
        }
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facility_id = currFacility(user).id;
    asyncGet(facility_id);

    return () => {
      isCanceled = true;
    };
  }, [appStatus, dispatch, user]);

  useEffect(() => {
    if (!dirtyList.length || !currentPatient) {
      setCanDrop(false);
      return;
    }
    const _is = dirtyList.find((x) => x === currentPatient.ptId);
    setCanDrop(_is);
  }, [dirtyList, currentPatient]);

  // 選択されたLeafのentityに対応するInputBundleをDBから取得する
  // entity に対応するエディタを起動する
  // mainRoom で状態変化 setInputToEdit
  const handleSelect = (e) => {
    if (!canDrop) {
      return;
    }
    e.preventDefault();
    const row = getSelectedRow(e);
    const { entity } = usingInputs[row];
    const asyncGet = async (ent) => {
      await getInputBundle(ent).then((inputCatalogue) => {
        const { entity } = inputCatalogue;
        if (entity === "smartShot") {
          dispatch({ type: "showWhiteQR" });
          return;
        }
        if (entity === "schema") {
          dispatch({ type: "openSchemaPanel" });
          return;
        }
        dispatch({ type: "setInputToEdit", target: inputCatalogue });
      });
    };
    asyncGet(entity).catch((err) => console.log(err));
  };

  const handleImageSelectionChange = (e) => {
    const files = e.currentTarget.files;
    if (!files || files?.length === 0) {
      return;
    }
    const file = files[0];
    dispatch({ type: "setImageFileToUpload", target: file });
  };

  const handlePDFSelectionChange = (e) => {
    const files = e.currentTarget.files;
    if (!files || files?.length === 0) {
      return;
    }
    const file = files[0];
    if (file.size > MAX_PD_FILE_SIZE) {
      return;
    }
    dispatch({ type: "setPdfFileToUpload", target: file });
  };

  const handleClickImage = () => {
    imageRef?.current.click();
  };

  const handleClickPdf = () => {
    pdfRef?.current.click();
  };

  return (
    <>
      <table className="w3-table w3-border-bottom w3-hoverable">
        <tbody>
          {usingInputs.map((tool, index) => {
            const { id, name, entity } = tool;
            if (entity === "imageFile") {
              return (
                <tr key={id} className="w3-border-bottom">
                  <td style={{ cursor: "pointer" }}>
                    <span onClick={handleClickImage}>
                      {TEXT_IMAGE_FILE}
                      <input
                        type="file"
                        ref={imageRef}
                        accept={"image/jpeg, image/png"}
                        onChange={handleImageSelectionChange}
                        disabled={!canDrop}
                        style={{ display: "none" }}
                      />
                    </span>
                  </td>
                </tr>
              );
            }
            if (entity === "pdf") {
              return (
                <tr key={id} className="w3-border-bottom">
                  <td style={{ cursor: "pointer" }}>
                    <span onClick={handleClickPdf}>
                      {TEXT_PDF_FILE}
                      <input
                        type="file"
                        ref={pdfRef}
                        accept="application/pdf"
                        onChange={handlePDFSelectionChange}
                        disabled={!canDrop}
                        style={{ display: "none" }}
                      />
                    </span>
                  </td>
                </tr>
              );
            }
            return (
              <tr
                className="w3-border-bottom"
                key={id}
                data-item={index}
                onClick={handleSelect}
              >
                <td style={{ cursor: "pointer" }}>{name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const NamedStampTreeInput = withDisplayBlock(StampTreeInput);
export default NamedStampTreeInput;
