import { StickyBody } from '../../../aux/commonStyles';
import { GROUP_DIAGNOSIS, RECEIPT_CODE_NAME } from "../../../models/claim";
import { DiagnosisSquare, ReceiptSquare, IndexRow, ReceiptCell } from './BoardCmp';

const ReceiptRenderer = ({ facility, karteList, entryDates, pivot, receiptPivot, localDispatch }) => {

    // 行ヘッダーの名前を返す
    const receiptName = rowGroup => {
        const group = rowGroup;
        const rc = group.substring(0, 2);
        const name = RECEIPT_CODE_NAME[rc];
        return rc === '00' ? name : `${rc} ${name}`;
    };

    const dispatchBundle = (entries, r) => {
        // r の中にある entries の id に対応する bundle を返す
        const bundles = [];
        entries.forEach(id => {
            const x = r.find(x => x.id === id);
            if (x) {
                bundles.push(x);
            }
        });
        const { group } = bundles[0];
        // Diagnosis
        if (group === GROUP_DIAGNOSIS) {
            return (
                <>
                    {
                        bundles.map(bundle => {
                            const { id } = bundle;
                            return <DiagnosisSquare key={id} bundle={bundle} />;
                        })
                    }
                </>
            );
        }
        // Other 600-labTest 600-physi
        return (
            <>
                {
                    bundles.map(bundle => {
                        return <ReceiptSquare key={bundle.id} bundle={bundle} />;
                    })
                }
            </>
        );
    };

    return (
        <>
            <StickyBody>
                {
                    Object.keys(pivot).sort().filter(g => g.startsWith(GROUP_DIAGNOSIS)).map((g) => {
                        const name = receiptName(g);
                        return (
                            <tr key={g}>
                                <IndexRow>{name}</IndexRow>
                                {
                                    entryDates.map((date, col) => {
                                        const entries = pivot[g]?.[date] ?? [];
                                        const karte = col < karteList.length ? karteList[col] : null;
                                        if (entries.length === 0 || karte === null) {
                                            return <ReceiptCell key={date} />;
                                        }
                                        return (
                                            <ReceiptCell key={date}>
                                                {dispatchBundle(entries, karte.p)}
                                            </ReceiptCell>
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
                    Object.keys(receiptPivot).sort().map((g) => {
                        const name = receiptName(g);
                        return (
                            <tr key={g}>
                                <IndexRow>{name}</IndexRow>
                                {
                                    entryDates.map((date, col) => {
                                        const entries = receiptPivot[g]?.[date] ?? [];
                                        const karte = col < karteList.length ? karteList[col] : null;
                                        if (entries.length === 0 || karte === null) {
                                            return <ReceiptCell key={date} />;
                                        }
                                        return (
                                            <ReceiptCell key={date}>
                                                {dispatchBundle(entries, karte.r)}
                                            </ReceiptCell>
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

export default ReceiptRenderer;