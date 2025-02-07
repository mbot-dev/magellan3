import { useCallback } from "react";
import { lightenBundle } from "./pManager";
import { StickyBody } from "../../../aux/commonStyles";
import { STATUS_NEW, STATUS_UPDATE } from "../../../models/karteCtx";
import { useStateValue } from "../../../reducers/state";
import {
  DragCell,
  DropCell,
  ImageSquare,
  PDFSquare,
  DiagnosisSquare,
  RpSquare,
  BundleSquare,
  ProtocolSquare,
  IndexRow,
  DataCell,
  SOACell,
} from "./BoardCmp";
import SOAEditor2 from "./SOAEditor2";

const dndForBundle = (bundle) => {
  return JSON.stringify(lightenBundle(bundle));
};

const dndForEdit = (bundle) => {
  return JSON.stringify(bundle);
};

const EntityRenderer = ({
  facility,
  karteList,
  entryDates,
  pivot,
  sortedPivot,
  soaText,
  handleSoaInput,
  handleSoaBlur,
  localDispatch,
}) => {
  const [{ bundleCopied, settings }, dispatch] = useStateValue();

  const handlePop = (popData) => {
    localDispatch({ type: "testPop", payload: popData });
  };

  const handleDrag = useCallback((e) => {
    e.dataTransfer.setData("text/plain", e.currentTarget.id);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleDrop = useCallback(
    (e) => {
      const data = e.dataTransfer.getData("text");
      try {
        const bundle = JSON.parse(data);
        if (bundle.claimItems) {
          dispatch({ type: "dropStamp", stamp: bundle });
        }
      } catch (err) {
        console.log(err.message);
      }
    },
    [dispatch],
  );

  const dispatchBundles = (
    facility,
    entries,
    p,
    isEditing,
    onDrag,
    onDrop,
    onPop,
    bundleCopied,
    isMedicineColoring,
  ) => {
    const bundles =
      entries?.length && p?.length
        ? p.filter((x) => entries.includes(x.id))
        : [];
    return (
      <>
        {bundles.map((bundle) => {
          const { id, entity } = bundle;
          const drag = !isEditing;
          const dnd = drag ? dndForBundle(bundle) : dndForEdit(bundle);
          const isDiagnosis = entity === "diagnosis";
          const isProtocol = entity === "baseCharge"; // First Visit and Follow up Visit
          const isRp = entity === "rp";
          const isImage =
            entity === "camera" || entity === "schema" || entity === "refImage";
          const isPdf = entity === "pdf";
          // const isInput = !isDiagnosis && !isRp && !isImage && !isPdf;
          if (isImage) {
            return (
              <ImageSquare
                key={id}
                item={bundle.claimItems[0]}
                facility_id={facility.id}
                onPop={onPop}
              />
            );
          }
          if (isPdf) {
            return (
              <PDFSquare
                key={id}
                item={bundle.claimItems[0]}
                facility_id={facility.id}
                onPop={onPop}
              />
            );
          }
          if (isDiagnosis) {
            return drag ? (
              <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                <DiagnosisSquare bundle={bundle} />
              </DragCell>
            ) : (
              <DropCell
                key={id}
                dnd={dnd}
                onDrop={onDrop}
                onPop={onPop}
                bundleCopied={bundleCopied}
              >
                <DiagnosisSquare bundle={bundle} />
              </DropCell>
            );
          }
          if (isProtocol) {
            return drag ? (
              <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                <ProtocolSquare bundle={bundle} />
              </DragCell>
            ) : (
              <DropCell
                key={id}
                dnd={dnd}
                onDrop={onDrop}
                onPop={onPop}
                bundleCopied={bundleCopied}
              >
                <ProtocolSquare bundle={bundle} />
              </DropCell>
            );
          }
          if (isRp) {
            return drag ? (
              <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                <RpSquare bundle={bundle} coloring={isMedicineColoring} />
              </DragCell>
            ) : (
              <DropCell
                key={id}
                dnd={dnd}
                onDrop={onDrop}
                onPop={onPop}
                bundleCopied={bundleCopied}
              >
                <RpSquare bundle={bundle} coloring={isMedicineColoring} />
              </DropCell>
            );
          }
          // if (isVital) {
          //     return drag ? (
          //         <DragCell key={id} dnd={dnd} onPop={onPop}>
          //             <InputSquare bundle={bundle} />
          //         </DragCell>
          //     ) : (
          //         <DropCell key={id} dnd={dnd} onDrop={onDrop} onPop={onPop} bundleCopied={bundleCopied}>
          //             <InputSquare bundle={bundle} />
          //         </DropCell>
          //     );
          // }
          return drag ? (
            <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
              <BundleSquare bundle={bundle} coloring={isMedicineColoring} />
            </DragCell>
          ) : (
            <DropCell
              key={id}
              dnd={dnd}
              onDrop={onDrop}
              onPop={onPop}
              bundleCopied={bundleCopied}
            >
              <BundleSquare bundle={bundle} coloring={isMedicineColoring} />
            </DropCell>
          );
        })}
      </>
    );
  };

  return (
    pivot && (
      <>
        <StickyBody>
          {sortedPivot
            .filter((x) => x.order < 2)
            .map((g) => {
              const { entity, name } = g;
              return (
                <tr key={entity}>
                  <IndexRow>{name}</IndexRow>
                  {entryDates.map((date, col) => {
                    const entries = pivot[entity]?.[date] ?? [];
                    const karte =
                      col < karteList.length ? karteList[col] : null;
                    const isEditing =
                      karte?.status === STATUS_NEW ||
                      karte?.status === STATUS_UPDATE;
                    const isEmpty = entries.length === 0;
                    if (karte === null) {
                      return <DataCell key={date} />;
                    }
                    if (isEmpty) {
                      return isEditing ? (
                        <DataCell key={date}>
                          <DropCell
                            onDrop={handleDrop}
                            onPop={handlePop}
                            bundleCopied={bundleCopied}
                          />
                        </DataCell>
                      ) : (
                        <DataCell key={date} />
                      );
                    }
                    return (
                      <DataCell key={date}>
                        {dispatchBundles(
                          facility,
                          entries,
                          karte.p,
                          isEditing,
                          handleDrag,
                          handleDrop,
                          handlePop,
                          bundleCopied,
                          settings.isMedicineColoring,
                        )}
                      </DataCell>
                    );
                  })}
                </tr>
              );
            })}
        </StickyBody>
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
                    "--cell-width": "var(--data-cell-width)",
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
                    "--cell-width": "var(--data-cell-width)",
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
        <StickyBody>
          {sortedPivot
            .filter((x) => x.order > 1)
            .map((g) => {
              const { entity, name } = g;
              return (
                <tr key={entity}>
                  <IndexRow>{name}</IndexRow>
                  {entryDates.map((date, col) => {
                    const entries = pivot[entity]?.[date] ?? [];
                    const karte =
                      col < karteList.length ? karteList[col] : null;
                    const isEditing =
                      karte?.status === STATUS_NEW ||
                      karte?.status === STATUS_UPDATE;
                    const isEmpty = entries.length === 0;
                    if (karte === null) {
                      return <DataCell key={date} />;
                    }
                    if (isEmpty) {
                      return isEditing ? (
                        <DataCell key={date}>
                          <DropCell
                            onDrop={handleDrop}
                            onPop={handlePop}
                            bundleCopied={bundleCopied}
                          />
                        </DataCell>
                      ) : (
                        <DataCell key={date} />
                      );
                    }
                    return (
                      <DataCell key={date}>
                        {dispatchBundles(
                          facility,
                          entries,
                          karte.p,
                          isEditing,
                          handleDrag,
                          handleDrop,
                          handlePop,
                          bundleCopied,
                          settings.isMedicineColoring,
                        )}
                      </DataCell>
                    );
                  })}
                </tr>
              );
            })}
        </StickyBody>
      </>
    )
  );
};

export default EntityRenderer;

