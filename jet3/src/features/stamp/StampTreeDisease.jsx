import { useState, useEffect, useRef } from "react";
import { v4 } from "uuid";
import withDisplayBlock from "../../aux/withDisplayBlock";
import { useStateValue } from "../../reducers/state";
import { DISEASE_STAMP_TREE_MENU } from "../../models/karteCtx";
import { useMargaret } from "../../io/MargaretProvider";
import ContextMenu from "../../cmp/ContextMenu";
import { currFacility } from "../../models/karteCtx";
import DiseaseNameEditor from "./DiseaseNameEditor";
import { lightenBundle } from "../karte/board/pManager";
import claimFunc from "../../models/claimFunc";

const DragStamp = ({ index, stampName, onDragStart, onDrop }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  return (
    <div
      id={`${index}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      <span>{stampName}</span>
    </div>
  );
};

// tab.entity = disease
const StampTreeDisease = ({ tab }) => {
  const margaret = useMargaret();
  const [{ appStatus, user, stampList, bundleArraySubmitted }, dispatch] =
    useStateValue();
  const [showPopup, setShowPopup] = useState(false);
  const [clickXY, setClickXY] = useState({ x: 0, y: 0 });
  const [popIndex, setPopIndex] = useState(-1);
  const [stampToEditName, setStampToEditName] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    let go = appStatus === "login";
    go = go && dispatch;
    go = go && user;
    go = go && !fetched.current;
    if (!go) {
      return;
    }
    let isCanceled = false;
    // 病名スタンプ -> sort(医療機関:診療科:コード)
    const asyncGet = async (fcId) => {
      try {
        const results = await margaret
          .getApi("stamp")
          .getDiseaseStampList(fcId);
        if (!isCanceled) {
          dispatch({ type: "setStampList", entity: tab.entity, list: results });
          fetched.current = true;
        }
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const fcId = currFacility(user).id;
    asyncGet(fcId);

    return () => {
      isCanceled = true;
    };
  }, [appStatus, user, tab, dispatch]);

  useEffect(() => {
    let accept = bundleArraySubmitted;
    // console.log(JSON.stringify(bundleArraySubmitted, null, 3));
    accept =
      accept &&
      (bundleArraySubmitted?.entity === tab.entity ||
        bundleArraySubmitted?.entity === "diagnosis");
    accept =
      accept &&
      (bundleArraySubmitted?.origin === "tool" ||
        bundleArraySubmitted?.origin === "karte"); // my sel
    accept = accept && bundleArraySubmitted?.array?.length > 0;
    if (!accept) {
      return;
    }
    const array = [];
    let freq = stampList[tab.entity].length;
    const newStamps = bundleArraySubmitted.array
      .map((bundle) => {
        const [diagnosis] = bundle.claimItems;
        const { code } = diagnosis;
        const index = stampList[tab.entity].findIndex((x) => x.code === code);
        if (index !== -1) {
          return null;
        }
        const newStamp = JSON.parse(JSON.stringify(diagnosis));
        newStamp.id = v4();
        newStamp.facilityId = currFacility(user).id;
        newStamp.physicianId = user.id;
        newStamp.entity = tab.entity;
        newStamp.stampName = `${newStamp.name}(${newStamp.icd1012})`;
        newStamp.freq = freq;
        freq += 1;
        array.push(newStamp);
        return margaret.getApi("stamp").saveDiseaseStamp(newStamp);
      })
      .filter((x) => x !== null);

    if (!newStamps.length) {
      return;
    }
    // 保存...
    Promise.all(newStamps)
      .then(() => {
        dispatch({ type: "addStamps", entity: tab.entity, stamps: array });
      })
      .catch((err) => {
        dispatch({ type: "setError", error: err }); // ToDo alert
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleArraySubmitted]);

  // Stamp が選択された
  const handleSelect = (row) => {
    const selected = stampList[tab.entity][row];
    const copy = JSON.parse(JSON.stringify(selected));
    const diagBundle = claimFunc["createBundle"]([tab.entity, copy]);
    const lightened = lightenBundle(diagBundle);
    dispatch(
      // bundleArraySubmitted へラップされる
      { type: "dropStamp", stamp: lightened }
    );
  };

  const handlePopup = (e, row) => {
    e.preventDefault();
    setPopIndex(row);
    const { clientX } = e;
    const { clientY } = e;
    setClickXY({ x: clientX, y: clientY });
    setShowPopup(true);
  };

  const handlePopSelect = (item) => {
    setShowPopup(false);
    if (popIndex < 0) {
      return;
    }
    if (item.action === "changeName") {
      const target = stampList[tab.entity][popIndex];
      setStampToEditName(target);
      return;
    }
    if (item.action === "delete") {
      const doDelete = async (st) => {
        try {
          await margaret.getApi("stamp").deleteDiseaseStamp(st.id);
          dispatch({
            type: "deleteStamp",
            entity: tab.entity,
            index: popIndex,
          });
        } catch (err) {
          dispatch({ type: "setError", error: err });
        }
      };
      const toDelete = stampList[tab.entity][popIndex];
      doDelete(toDelete);
    }
  };

  const handlePopCancel = () => {
    setShowPopup(false);
  };

  // Drag != not click, therefore no drop stamp
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", e.currentTarget.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e) => {
    const from = Number(e.dataTransfer.getData("text"));
    const to = Number(e.currentTarget.id);
    const newList = [...stampList[tab.entity]];
    newList.splice(to, 0, newList.splice(from, 1)[0]);
    const data = newList.map((st, index) => {
      return { id: st.id, freq: index };
    });
    const update = async (order) => {
      try {
        await margaret.getApi("stamp").updateDiseaseOrder(order);
        dispatch({ type: "reorderStamp", entity: tab.entity, list: newList });
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    update(data);
  };

  const handleEditNameEnd = (newName) => {
    const target = stampList[tab.entity][popIndex];
    const update = async (pk, data) => {
      try {
        await margaret.getApi("stamp").updateDiseaseStamp(pk, data);
        dispatch({
          type: "updateStamp",
          entity: tab.entity,
          index: popIndex,
          data: { stampName: newName },
        });
        setStampToEditName(null);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    update(target.id, { stamp_name: newName });
  };

  const handleCancelEditName = () => {
    setStampToEditName(null);
  };

  return (
    stampList &&
    stampList[tab.entity] && (
      <>
        <table className="w3-table w3-border-bottom w3-hoverable">
          <tbody>
            {stampList[tab.entity].map((entry, index) => {
              const { id, stampName, name, icd1012 } = entry;
              const leafName = stampName ? stampName : `${name}(${icd1012})`;
              return (
                <tr
                  className="w3-border-bottom"
                  key={id}
                  data-item={index}
                  onClick={() => handleSelect(index)}
                  onContextMenu={(e) => handlePopup(e, index)}
                >
                  <td>
                    <DragStamp
                      index={index}
                      stampName={leafName}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {showPopup && (
          <ContextMenu
            clickPoint={clickXY}
            menus={DISEASE_STAMP_TREE_MENU}
            onSelect={handlePopSelect}
            onCancel={handlePopCancel}
          />
        )}
        {stampToEditName && (
          <DiseaseNameEditor
            stamp={stampToEditName}
            onEditEnd={handleEditNameEnd}
            onCancel={handleCancelEditName}
          />
        )}
      </>
    )
  );
};

const NamedStampTreeDisease = withDisplayBlock(StampTreeDisease);
export default NamedStampTreeDisease;
