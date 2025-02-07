import { useEffect, useState, useCallback } from 'react';
import { StickyBody } from '../../../aux/commonStyles';
import { BundleSquare, ReceiptSquare, DiagnosisSquare, DragCell, DropCell, DualCell, RpSquare, IndexRow } from './BoardCmp';
import { GROUP_DIAGNOSIS, RECEIPT_CODE_NAME } from "../../../models/claim";
import { STATUS_NEW, STATUS_UPDATE } from '../../../models/karteCtx';
import { useStateValue } from '../../../reducers/state';
import { lightenBundle } from './pManager';
import styled from 'styled-components';

const entriesFromGroup = (groupCode, pivot, date) => {
    const entries = [];
    Object.keys(pivot).forEach(k => {
        if (k.startsWith(groupCode) && pivot[k]?.[date]) {
            entries.push(...pivot[k][date]); // entries=[bundle.id,,,]
        }
    });
    return entries;
};

const dndForBundle = bundle => {
    return JSON.stringify(lightenBundle(bundle));
};

const dndForEdit = bundle => {
    return JSON.stringify(bundle);
};

const DualRenderer = ({ facility, karteList, entryDates, pivot, receiptPivot, localDispatch }) => {
    const [{ bundleCopied }, dispatch] = useStateValue();
    const [bothKeys, setBothKeys] = useState([]);

    useEffect(() => {
        if (!pivot || !receiptPivot) {
            return;
        }
        const arr1 = Object.keys(pivot);
        const arr2 = Object.keys(receiptPivot);
        const array3 = [...new Set([...arr1, ...arr2])];
        array3.sort();
        setBothKeys(array3);
        console.log(JSON.stringify(array3, null, 3));

    }, [pivot, receiptPivot]);

    const receiptName = (group) => {
        const rc = group.substring(0, 2);
        const name = RECEIPT_CODE_NAME[rc];
        return group === '000' ? name : `${rc} ${name}`;
    };

    const handlePop = popData => {
        localDispatch({ type: 'testPop', payload: popData });
    };

    const handleDrag = useCallback(e => {
        e.dataTransfer.setData('text/plain', e.currentTarget.id);
        e.dataTransfer.effectAllowed = "copy";
    }, []);

    const handleDrop = useCallback(e => {
        const data = e.dataTransfer.getData('text');
        try {
            const bundle = JSON.parse(data);
            if (bundle.claimItems) {
                dispatch({ type: 'dropStamp', stamp: bundle });
            }
        } catch (err) {
            console.log(err.message);
        }

    }, [dispatch]);

    const dispatchReceipt = (facility, entries, r) => {
        const bundles = (entries?.length && r?.length) ? r.filter(x => entries.includes(x.id)) : [];
        return (
            <div className='z3-bundle-list'>
                {
                    bundles.map(bundle => {
                        const { id } = bundle;
                        return (
                            <DragCell key={id} onDrag={handleDrag}>
                                <ReceiptSquare bundle={bundle} />
                            </DragCell>
                        );
                    })
                }
            </div>
        );
    };

    const dispatchBundles = (facility, entries, p, isEditing, onDrag, onDrop, onPop, bundleCopied) => {
        const bundles = (entries?.length && p?.length) ? p.filter(x => entries.includes(x.id)) : [];
        return (
            <>
                {
                    bundles.map(bundle => {
                        const { id, group } = bundle;
                        const dnd = isEditing ? dndForEdit(bundle) : dndForBundle(bundle);
                        const isDiagnosis = group === GROUP_DIAGNOSIS;
                        const isRp = group.startsWith('21') || group.startsWith('22') || group.startsWith('23');
                        if (isDiagnosis) {
                            return isEditing ? (
                                <DropCell key={id} dnd={dnd} onDrop={onDrop} onPop={onPop} bundleCopied={bundleCopied}>
                                    <DiagnosisSquare bundle={bundle} />
                                </DropCell>
                            ) : (
                                <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                                    <DiagnosisSquare bundle={bundle} />
                                </DragCell>
                            );
                        }
                        if (isRp) {
                            return isEditing ? (
                                <DropCell key={id} dnd={dnd} onDrop={onDrop} onPop={onPop} bundleCopied={bundleCopied}>
                                    <RpSquare bundle={bundle} />
                                </DropCell>
                            ) : (
                                <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                                    <RpSquare bundle={bundle} />
                                </DragCell>
                            );
                        }
                        return isEditing ? (
                            <DropCell key={id} dnd={dnd} onDrop={onDrop} onPop={onPop} bundleCopied={bundleCopied}>
                                <BundleSquare bundle={bundle} />
                            </DropCell>
                        ) : (
                            <DragCell key={id} dnd={dnd} onDrag={onDrag} onPop={onPop}>
                                <BundleSquare bundle={bundle} />
                            </DragCell>
                        );
                    })
                }
            </>
        );
    };

    return (
        <>
            <StickyBody>
                {
                    bothKeys.filter(g => g.startsWith(GROUP_DIAGNOSIS)).map((g) => {
                        const groupName = receiptName(g);
                        return (
                            <tr key={g}>
                                <IndexRow>{groupName}</IndexRow>
                                {
                                    entryDates.map((date, col) => {
                                        const entries = entriesFromGroup(g, pivot, date);
                                        const karte = col < karteList.length ? karteList[col] : null;
                                        const isEditing = karte?.status === STATUS_NEW || karte?.status === STATUS_UPDATE;
                                        if (karte === null) {
                                            return <DualCell key={date} />;
                                        }
                                        return (
                                            <DualCell key={date}>
                                                {dispatchBundles(facility, entries, karte.p, isEditing, handleDrag, handleDrop, handlePop, bundleCopied)}
                                            </DualCell>
                                        );
                                    })
                                }
                            </tr>
                        );
                    })
                }
            </StickyBody>
            <StickyBody>
                {
                    bothKeys.filter(g => g > '000' && g < '999').map((g) => {
                        const groupName = receiptName(g);
                        return (
                            <tr key={g}>
                                <IndexRow>{groupName}</IndexRow>
                                {
                                    entryDates.map((date, col) => {
                                        const receiptEntries = entriesFromGroup(g, receiptPivot, date);
                                        const karteEntries = entriesFromGroup(g, pivot, date);
                                        const karte = col < karteList.length ? karteList[col] : null;
                                        const isEditing = karte?.status === STATUS_NEW || karte?.status === STATUS_UPDATE;
                                        if (karte === null) {
                                            return <DualCell key={date} />;
                                        }
                                        return (
                                            <DualCell key={date}>
                                                <DualDiv>
                                                    <KarteData>
                                                        {dispatchBundles(facility, karteEntries, karte.p, isEditing, handleDrag, handleDrop, handlePop, bundleCopied)}
                                                    </KarteData>
                                                    <ReceiptData>
                                                        {dispatchReceipt(facility, receiptEntries, karte.r)}
                                                    </ReceiptData>
                                                </DualDiv>
                                            </DualCell>
                                        );
                                    })
                                }
                            </tr>
                        );
                    })
                }
            </StickyBody>
        </>
    );
};

const DualDiv = styled.div`
    display: grid;
    grid-template-columns: [karte] 360px [rcp] 452px;
    grid-auto-flow: row;
    column-gap: 8px;
`;

const KarteData = styled.div`
    grid-column: karte;
    grid-row: auto;
`;

const ReceiptData = styled.div`
    grid-column: rcp;
    grid-row: auto;
`;

export default DualRenderer;