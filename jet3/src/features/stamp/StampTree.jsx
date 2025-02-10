import { useState, useEffect, useRef } from "react";
import { v4 } from "uuid";
import hash from "object-hash";
import withDisplayBlock from "../../aux/withDisplayBlock";
import { useStateValue } from "../../reducers/state";
import {
  CLAIM_MATERIAL,
  CLAIM_MEDICINE,
  CLAIM_PROCEDURE,
  sortClaimItems,
} from "../../models/claim";
import { STAMP_NAME_LENGTH, STAMP_TREE_MENU } from "../../models/karteCtx";
import { useMargaret } from "../../io/MargaretProvider";
import ContextMenu from "../../cmp/ContextMenu";
import StampNameEditor from "./StampNameEditor";
import { currFacility } from "../../models/karteCtx";
import { lightenBundle } from "../karte/board/pManager";

const stampHash = (bundle) => {
  if (!bundle || !bundle?.claimItems?.length) {
    return null;
  }
  const codeArray = bundle.claimItems.map((x) => x.code);
  return hash(codeArray.join(""));
};

const stampName = (bundle) => {
  if (!bundle || !bundle?.claimItems?.length) {
    return null;
  }
  const nameArray = bundle.claimItems
    .filter(
      (x) =>
        x.type === CLAIM_PROCEDURE ||
        x.type === CLAIM_MEDICINE ||
        x.type === CLAIM_MATERIAL,
    )
    .map((x) => x.name);
  let stampName = nameArray.join(" ");
  if (stampName.length - 3 > STAMP_NAME_LENGTH) {
    stampName = stampName.substr(0, STAMP_NAME_LENGTH);
    stampName = `${stampName}...`;
  }
  return stampName;
};

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

const StampTree = ({ tab }) => {
  const margaret = useMargaret();
  const [
    { appStatus, user, stampList, bundleArraySubmitted },
    dispatch,
  ] = useStateValue();
  const [clickXY, setClickXY] = useState({ x: 0, y: 0 });
  const [popIndex, setPopIndex] = useState(-1);
  const [stampToEditName, setStampToEditName] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    let go = appStatus === "login";
    go = go && dispatch;
    go = go && user;
    go = go && tab;
    go = go && !fetched.current;
    if (!go) {
      return;
    }
    let isCanceled = false;
    const facility_id = currFacility(user).id;
    const asyncGet = async (fcId, entity) => {
      try {
        const results = await margaret.getApi("stamp").getStampList(fcId, entity);
        const arr = [];
        results.forEach((entry) => {
          sortClaimItems(entry["claimItems"]); // sort
          arr.push(entry);
        });
        if (!isCanceled) {
          dispatch({ type: "setStampList", entity: tab.entity, list: arr });
          fetched.current = true;
        }
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet(facility_id, tab.entity);

    return () => {
      isCanceled = true;
    };
  }, [appStatus, user, tab, dispatch]);

  useEffect(() => {
    // console.log(JSON.stringify(bundleArraySubmitted, null, 3));
    let accept = (bundleArraySubmitted);
    accept = accept && bundleArraySubmitted.array;
    accept = accept && bundleArraySubmitted.entity === tab.entity;
    accept = accept && (bundleArraySubmitted.origin === "tool" || bundleArraySubmitted.origin === "karte"); // my sel
    if (!accept) {
      return;
    }
    const addList = [];
    const addPromise = [];
    let freq = stampList[tab.entity].length;
    bundleArraySubmitted.array.forEach((bdl) => {
      const hashValue = stampHash(bdl);
      const idx = stampList[tab.entity].findIndex((x) => x.hash === hashValue);
      if (idx === -1) {
        const newStamp = createStamp(bdl, hashValue, freq);
        addList.push(newStamp);
        addPromise.push(margaret.getApi("stamp").saveStamp(newStamp));
        freq += 1;
      }
    });
    // console.log(JSON.stringify(addList, null, 3));
    if (addList.length === 0) {
      return;
    }
    Promise.all(addPromise)
      .then(() => {
        dispatch({ type: "addStamps", entity: tab.entity, stamps: addList });
      })
      .catch((err) => {
        dispatch({ type: "setError", error: err }); // ToDo alert
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleArraySubmitted]);

  const createStamp = (bundle, hashValue, freq) => {
    const facility = currFacility(user);
    const newStamp = JSON.parse(JSON.stringify(bundle)); // <- bundle
    newStamp.id = v4();
    newStamp.facilityId = facility.id;
    newStamp.physicianId = user.id;
    newStamp.hash = hashValue;
    newStamp.stampName = stampName(bundle);
    newStamp.freq = freq;
    return newStamp;
  };

  // Stamp が選択された
  // Bundle にorigin=stampBox属性をつける => karte に追加さる
  const handleSelect = (row) => {
    const selected = stampList[tab.entity][row];
    const lightened = lightenBundle(selected); // make bundle lightened
    const copy = JSON.parse(JSON.stringify(lightened)); // deep copy why?
    dispatch({ type: "dropStamp", stamp: copy }); // dispatch event to global store
  };

  // Right button click
  const handlePopup = (e, row) => {
    e.preventDefault();
    setPopIndex(row);
    const x = e.clientX;
    const y = e.clientY;
    setClickXY({ x: x, y: y });
    setOpen(!isOpen);
  };

  // Selected pop up menu
  const handlePopSelect = (item) => {
    setOpen(!isOpen);
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
          await margaret.getApi("stamp").deleteStamp(st.id);
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
    setOpen(!isOpen);
  };

  // Drag != not click, therefore no drop stamp
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", e.currentTarget.id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Drag -> Drop on tree
  const handleDrop = (e) => {
    const from = Number(e.dataTransfer.getData("text"));
    const to = Number(e.currentTarget.id);
    const newList = [...stampList[tab.entity]]; // copy...
    newList.splice(to, 0, newList.splice(from, 1)[0]); // splice(at, 1) => Array of removed elements
    // 順番をdbに保存
    const data = newList.map((st, index) => {
      return { id: st.id, freq: index };
    });
    const update = async (order) => {
      try {
        await margaret.getApi("stamp").updateStampOrder(order);
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
        await margaret.getApi("stamp").updateStamp(pk, data);
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
              const { id, stampName } = entry;
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
                      stampName={stampName}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {isOpen && (
          <ContextMenu
            clickPoint={clickXY}
            menus={STAMP_TREE_MENU}
            onSelect={handlePopSelect}
            onCancel={handlePopCancel}
          />
        )}
        {stampToEditName && (
          <StampNameEditor
            stamp={stampToEditName}
            onEditEnd={handleEditNameEnd}
            onCancel={handleCancelEditName}
          />
        )}
      </>
    )
  );
};

const NamedStampTree = withDisplayBlock(StampTree);
export default NamedStampTree;
