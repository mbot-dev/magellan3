import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  COPY_TEXT,
  DELETE_TEXT,
  DOWNLOAD_TEXT,
  EDIT_TEXT,
  PASTE_TEXT,
  THUMBNAIL_TEXT,
} from "../../../aux/FormUtil";
import { getImageSource } from "../../../io/mediaIO";
import {
  CLAIM_INSTRUCTION,
  CLAIM_MEDICINE,
  DOSE_TYPE_INJECTION,
  DOSE_TYPE_INTERNAL,
  DOSE_TYPE_TOPICAL,
  isComment,
} from "../../../models/claim";
import { useStateValue } from "../../../reducers/state";

const PATH_TO_THUMBNAIL = "/media/api/v1/upload/thumbnail";
const PATH_TO_BODY = "/media/api/v1/dl/body";
const PATH_TO_PDF = "/media/api/v1/dl/pdf";

const getDoseType = (bundle, coloring) => {
  if (!bundle?.claimItems || !coloring) {
    return null;
  }
  const item = bundle.claimItems.find((x) => x.type === CLAIM_MEDICINE);
  if (!item?.doseType) {
    return null;
  }
  const doseType = `${item.doseType}`;
  if (doseType === DOSE_TYPE_INTERNAL) {
    return "--oral";
  }
  if (doseType === DOSE_TYPE_TOPICAL) {
    return "--topical";
  }
  if (doseType === DOSE_TYPE_INJECTION) {
    return "--injection";
  }
  return null;
};

export const DragCell = ({ dnd, onDrag, onPop, children }) => {
  const handlePopup = (e) => {
    if (onPop) {
      e.preventDefault();
      const point = { x: e.clientX, y: e.clientY };
      const menus = [];
      menus.push({
        name: COPY_TEXT,
        action: "copy",
        data: { dnd },
      });
      const staff = {
        point,
        menus,
      };
      onPop(staff);
    }
  };

  return (
    <div
      draggable={true}
      id={dnd}
      onDragStart={onDrag}
      onContextMenu={handlePopup}
    >
      {children}
    </div>
  );
};

export const DropCell = ({ dnd, onDrop, onPop, bundleCopied, children }) => {
  const [isOver, setOver] = useState(false);

  const handleEnter = () => {
    setOver(true);
  };

  const handleLeave = () => {
    setOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    setOver(false);
    onDrop(e);
  };

  const handlePaste = (e) => {
    if (onPop) {
      e.preventDefault();
      const point = { x: e.clientX, y: e.clientY };
      const menus = [];
      menus.push({
        name: EDIT_TEXT,
        action: "edit",
        disabled: !dnd,
        data: { dnd },
      });
      menus.push({
        name: DELETE_TEXT,
        action: "delete",
        disabled: !dnd,
        destructive: true,
        data: { dnd },
      });
      menus.push({
        name: PASTE_TEXT,
        action: "paste",
        disabled: !bundleCopied,
      });
      const staff = {
        point,
        menus,
      };
      onPop(staff);
    }
  };

  return (
    <DropZone
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleEnter}
      onDragLeave={handleLeave}
      over={isOver}
      onContextMenu={handlePaste}
    >
      {children}
    </DropZone>
  );
};

const DropZone = styled.div`
  width: auto !important;
  min-height: 24px !important;
  background-color: ${(props) => (props.over ? "#e8f0fe" : "#fff")} !important;
`;

export const ImageSquare = ({ item, facility_id, onPop }) => {
  const dispatch = useStateValue()[1];
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!item || !facility_id) {
      return;
    }
    const asyncGet = async (path) => {
      try {
        const data = await getImageSource(path);
        setSrc(data);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    const path = `${PATH_TO_THUMBNAIL}/${facility_id}/${item.thumbnail}`;
    asyncGet(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, facility_id]);

  const handlePop = (e) => {
    if (onPop) {
      e.preventDefault();
      const point = { x: e.clientX, y: e.clientY };
      const menus = [];
      menus.push({
        name: DOWNLOAD_TEXT,
        action: "download",
        data: {
          facilityId: facility_id,
          pathToFile: PATH_TO_BODY,
          fileId: item.body,
        },
      });
      const staff = {
        point,
        menus,
      };
      onPop(staff);
    }
  };
  return src ? (
    <img
      style={{ margin: "0 auto" }}
      src={src}
      alt={THUMBNAIL_TEXT}
      onContextMenu={handlePop}
    />
  ) : (
    <div />
  );
};

export const PDFSquare = ({ facility_id, item, onPop }) => {
  const handlePop = (e) => {
    if (onPop) {
      const point = { x: e.clientX, y: e.clientY };
      const menus = [];
      menus.push({
        name: DOWNLOAD_TEXT,
        action: "download",
        data: {
          facilityId: facility_id,
          pathToFile: PATH_TO_PDF,
          fileId: item.body,
        },
      });
      const staff = {
        point,
        menus,
      };
      onPop(staff);
    }
  };
  return item ? (
    <span onContextMenu={handlePop}>
      {item.description ? item.description : item.filename}
    </span>
  ) : (
    <div />
  );
};

export const ReceiptSquare = ({ bundle }) => {
  return (
    <ReceiptBundle>
      {bundle.receiptItems.map((item) => {
        const { id, name, rcpTensu, rcpKaisu } = item;
        const kaisu = rcpTensu && rcpKaisu ? rcpKaisu : "";
        const ci = [];
        ci.push(name);
        if (!isComment(item)) {
          if (item.quantity && item.unit) {
            ci.push(item.quantity);
            ci.push(item.unit);
          }
        }
        const data = ci.join(" ");
        return (
          <React.Fragment key={id}>
            <NameQuantity>
              <span>{data}</span>
            </NameQuantity>
            <Tensu style={{ "--tc": "var(--tensu-color)" }}>
              <span>{rcpTensu ?? ""}</span>
            </Tensu>
            <Kaisu>
              <span>{kaisu}</span>
            </Kaisu>
          </React.Fragment>
        );
      })}
    </ReceiptBundle>
  );
};

const ReceiptBundle = styled.div`
  display: grid;
  grid-template-columns: [ci] 254px [tensu] 48px [kaisu] 32px;
  grid-auto-rows: row;
  column-gap: 6px;
`;

const NameQuantity = styled.div`
  grid-column: ci;
  grid-row: auto;
`;

const Tensu = styled.div`
  grid-column: tensu;
  grid-row: auto;
  text-align: right;
  color: var(--tc, --on-karte);
`;

const Kaisu = styled.div`
  grid-column: kaisu;
  grid-row: auto;
  text-align: right;
`;

export const DiagnosisSquare = ({ bundle }) => {
  const categoryDisplay = (item) => {
    const category = item?.diagnosisCategory ?? "";
    if (category === "01") {
      return "主";
    }
    return "";
  };

  const outcomeDisplay = (item) => {
    const outcome = item?.outcome ?? "";
    if (outcome === "2") {
      return "治ゆ";
    }
    if (outcome === "3") {
      return "死亡";
    }
    if (outcome === "4") {
      return "中止（転医）";
    }
    if (outcome === "1") {
      return "その他";
    }
    return "";
  };

  return (
    <div className="z3-flex-column">
      {bundle.claimItems.map((item) => {
        const { id, name } = item;
        const category = categoryDisplay(item);
        const outcome = outcomeDisplay(item);
        const arr = [];
        arr.push(name);
        if (category) {
          arr.push(`（${category}）`);
        }
        if (outcome) {
          arr.push(`（${outcome}）`);
        }
        const data = arr.join("");
        return <span key={id}>{data}</span>;
      })}
    </div>
  );
};

export const RpSquare = ({ bundle, coloring }) => {
  const doseType = getDoseType(bundle, coloring);
  const display = (item) => {
    const arr = [];
    arr.push(item.name);
    if (bundle.oral || bundle.temporary) {
      arr.push("1日");
      arr.push(item.quantity);
      arr.push(item.unit);
      arr.push("(分");
      arr.push(bundle.freqPerDay);
      arr.push("x");
      arr.push(bundle.quantity);
      arr.push("TD)");
    } else if (bundle.prn) {
      arr.push("1回");
      arr.push(item.quantityPerOnce);
      arr.push(item.unit);
      arr.push("(");
      arr.push(bundle.quantity);
      arr.push("P)");
    } else if (bundle.topical) {
      arr.push(item.quantity);
      arr.push(item.unit);
    }
    return arr.join("");
  };
  return (
    <div className="z3-flex-column">
      {bundle.claimItems
        .filter((x) => x.type !== CLAIM_INSTRUCTION)
        .map((item) => {
          const data = display(item);
          return (
            <MedicineText
              key={item.id}
              style={{ "--text-color": `var(${doseType ?? "--on-karte"})` }}
            >
              {data}
            </MedicineText>
          );
        })}
      {bundle.claimItems
        .filter((x) => x.type === CLAIM_INSTRUCTION)
        .map((item) => {
          return (
            <MedicineText
              key={item.id}
              style={{ "--text-color": `var(${doseType ?? "--on-karte"})` }}
            >
              {item.name}
            </MedicineText>
          );
        })}
      <MedicineText
        style={{ "--text-color": `var(${doseType ?? "--on-karte"})` }}
      >
        {bundle.issuedTo === "external" ? "院外処方" : "院内処方"}
      </MedicineText>
    </div>
  );
};

export const ProtocolSquare = ({ bundle }) => {
  return (
    <div className="z3-flex-column">
      {bundle.claimItems.map((item) => {
        let name = item.name;
        name = name.replace(/料/g, "");
        return <MedicineText key={item.id}>{name}</MedicineText>;
      })}
    </div>
  );
};

export const BundleSquare = ({ bundle, coloring }) => {
  const doseType = getDoseType(bundle, coloring);
  return (
    <div className="z3-flex-column">
      {bundle.claimItems.map((item) => {
        const arr = [];
        arr.push(item.name);
        arr.push(item.quantity || "");
        arr.push(item.unit || "");
        const data = arr.join(" ");
        return (
          <MedicineText
            key={item.id}
            style={{ "--text-color": `var(${doseType ?? "--on-karte"})` }}
          >
            {data}
          </MedicineText>
        );
      })}
    </div>
  );
};

export const InputSquare = ({ bundle }) => {
  return (
    <div className="z3-flex-column">
      {bundle.claimItems.map((item) => {
        if (item.description) {
          return <span key={item.id}>{item.description}</span>;
        }
        const arr = [];
        arr.push(item.value);
        arr.push(item.unit || "");
        const data = arr.join(" ");
        return <span key={item.id}>{data}</span>;
      })}
    </div>
  );
};

//---------------------------------------------
// Karete Board Common Styles
//---------------------------------------------
// 左上
export const UpperLeft = styled.th`
  padding: 8px 8px !important;
  width: var(--index-cell-width) !important;
  min-width: var(--index-cell-width) !important;
  max-width: var(----index-cell-width) !important;
  background-color: var(--karte);
  color: var(--on-header) !important;
  border-right: 1px solid #ddd;
`;
// 左端 Row Index
export const IndexRow = styled.th`
  padding: 16px 8px !important;
  width: var(--index-cell-width);
  min-width: var(--index-cell-width);
  max-width: var(--index-cell-width);
  height: 100%;
  background-color: var(--karte);
  color: var(--on-header) !important;
  border-right: 1px solid #ddd;
  font-size: 0.9rem;
  font-weight: 400;
`;
// カルテ確定日
export const TimeCell = styled.th`
  width: var(--cell-width);
  min-width: var(--cell-width);
  max-width: var(--cell-width);
  padding: 8px 8px !important;
  background-color: var(--bk) !important;
  color: var(--on-bk) !important;
  font-size: 0.9rem;
  font-weight: 400;
  cursor: pointer;
  &::after {
    content: var(--text);
  }
`;
export const DataCell = styled.td`
  width: var(--data-cell-width);
  min-width: var(--data-cell-width);
  max-width: var(--data-cell-width);
  padding: 16px 8px !important;
  background-color: var(--karte);
  color: var(--on-karte);
`;
export const DualCell = styled.td`
  width: var(--dual-cell-width);
  min-width: var(--dual-cell-width);
  max-width: var(--dual-cell-width);
  padding: 16px 8px !important;
  background-color: var(--karte);
  color: var(--on-karte);
`;
export const ReceiptCell = styled.td`
  width: var(--receipt-cell-width);
  min-width: var(--receipt-cell-width);
  max-width: var(--receipt-cell-width);
  padding: 16px 8px !important;
  background-color: var(--karte);
  color: var(--on-karte);
`;
export const SOACell = styled.td`
  width: var(--cell-width);
  min-width: var(--cell-width);
  max-width: var(--cell-width);
  background-color: var(--bk, --karte) !important;
  color: var(--on-bk, --on-karte) !important;
`;
export const AttributeLabel = styled(IndexRow)`
  padding: 8px 8px !important;
`;
export const AttributeValue = styled.td`
  width: var(--cell-width);
  min-width: var(--cell-width);
  max-width: var(--cell-width);
  padding: 8px 8px !important;
  font-size: 0.9rem !important;
  background-color: var(--karte);
  color: var(--on-karte);
`;
export const MedicineText = styled.span`
  color: var(--text-color, --on-karte) !important;
`;
