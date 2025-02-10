import { useEffect, useState, useRef } from "react";
import dateFormat from "dateformat";
import { useStateValue } from "../../../reducers/state";
import { useMargaret } from "../../../io/MargaretProvider";
import DiagnosisSetter from "./DiagnosisSetter";
import { useKarteState } from "../karteState";
import MoreVertClick from "../../../cmp/MoreVertClick";
import withDisplayNull from "../../../aux/withDisplayNull";
import { EDIT_TEXT, NAME_TEXT } from "../../../aux/FormUtil";
import { currFacility } from "../../../models/karteCtx";

export const DISEASE_TEXT = "傷病名";
export const MAIN_DIAGNOSIS = "主病名";
export const SUSPECTED_DIAGNOSIS = "疑い病名";
export const FULLY_RECOVERED = "全治";
export const PAUSED = "中止";
export const DIED = "死亡";
export const CATEGORY_TEXT = "カテゴリー";
export const ONSET_TEXT = "疾患開始日";
export const REMISSION_TEXT = "疾患終了日";
export const OUTCOME_TEXT = "転帰";
const DEPT_TEXT = "診療科";
export const DIAGNOSIS_DATE_DISPLAY = "yyyy-mm-dd";

const Diagnosis = ({ patient }) => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const [{ diagnosis_list }, karteDispatch] = useKarteState();
  const [entryToEdit, setEntryToEdit] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!patient || fetched?.current) {
      return;
    }
    const asyncGet = async (fc_id, pt_id) => {
      try {
        const list = await margaret.getApi("diagnosis").getDiagnosisList(fc_id, pt_id);
        fetched.current = true;
        karteDispatch({
          type: "setRiskList",
          payload: { entity: "diagnosis", list },
        });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const facility_id = currFacility(user).id;
    const patient_id = patient.id;
    asyncGet(facility_id, patient_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const handleSelect = (action, row) => {
    if (action === "edit") {
      const toEdit = diagnosis_list[row];
      const copy = JSON.parse(JSON.stringify(toEdit));
      setEntryToEdit(copy);
    }
  };

  const handleSetterClose = () => {
    setEntryToEdit(null);
  };

  const handleEditEnd = (edited) => {
    const index = diagnosis_list.findIndex((x) => x.id === edited.id);
    if (index === -1) {
      return;
    }
    const asyncPut = async (risk) => {
      try {
        await margaret.getApi("diagnosis").putDiagnosis(risk);
        karteDispatch({
          type: "upcertRisk",
          payload: { entity: "diagnosis", risk },
        });
        setEntryToEdit(null);
      } catch (err) {
        setEntryToEdit(null);
        dispatch({ type: "setError", error: err });
      }
    };
    edited.updatedAt = dateFormat(new Date(), "isoDateTime");
    asyncPut(edited);
  };

  return (
    diagnosis_list &&
    diagnosis_list.length > 0 && (
      <div className="w3-panel">
        <div>
          <table className="w3-table w3-bordered w3-hoverable">
            <thead>
              <tr>
                <th>ICD10</th>
                <th>{NAME_TEXT}</th>
                <th>{CATEGORY_TEXT}</th>
                <th>{ONSET_TEXT}</th>
                <th>{REMISSION_TEXT}</th>
                <th>{OUTCOME_TEXT}</th>
                <th>{DEPT_TEXT}</th>
                <th>{EDIT_TEXT}</th>
              </tr>
            </thead>
            <tbody>
              {diagnosis_list.map((entry, index) => {
                const {
                  id,
                  icd1012,
                  name,
                  diagnosisCategory,
                  outcome,
                  dateOfOnset,
                  dateOfRemission,
                  deptName,
                } = entry;
                return (
                  <tr key={id} data-item={index}>
                    <td>{icd1012}</td>
                    <td>{name}</td>
                    <td>{diagnosisCategory}</td>
                    <td>
                      {dateOfOnset
                        ? dateFormat(dateOfOnset, DIAGNOSIS_DATE_DISPLAY)
                        : ""}
                    </td>
                    <td>
                      {dateOfRemission
                        ? dateFormat(dateOfRemission, DIAGNOSIS_DATE_DISPLAY)
                        : ""}
                    </td>
                    <td>{outcome}</td>
                    <td>{deptName}</td>
                    <td className="w3-right-align">
                      <MoreVertClick
                        menus={[{ action: "edit", name: EDIT_TEXT }]}
                        sourceIndex={index}
                        onSelect={handleSelect}
                        right={true}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {entryToEdit && (
          <DiagnosisSetter
            show={entryToEdit ? "true" : undefined}
            diagnosisToEdit={entryToEdit}
            onCancel={handleSetterClose}
            onEditEnd={handleEditEnd}
          />
        )}
      </div>
    )
  );
};

const NamedDiagnosis = withDisplayNull(Diagnosis);
export default NamedDiagnosis;
