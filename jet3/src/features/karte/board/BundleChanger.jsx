import { useState, useEffect } from 'react';
import hash from "object-hash";
import { useStateValue } from "../../../reducers/state";
import { useStamp } from '../../stamp/useClaim';
import { halfFrom } from "../../../util/strings";
import { handleKeyDown, handleInputFocus, getValue, CHANGE_TEXT } from "../../../aux/FormUtil";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { hasValidQuantity } from "../../../models/claim";
import { useLockBodyScroll } from "../../../hook/useLockBodyScroll";
import { useEscKey } from "../../../hook/useEscKey";

const BundleChanger = ({ target, patient }) => {
    const dispatch = useStateValue()[1];
    const [bundle, setBundle] = useState(null);
    const [claimItems, instructions, title, isPrescription] = useStamp(bundle);
    const [isFilled, setFilled] = useState(false);
    const [oldHash, setOldHash] = useState('');
    const [newHash, setNewHash] = useState('');
    const [isDirty, setDirty] = useState(false);

    useLockBodyScroll();
    useEscKey(() => dispatch({ type: 'setBundleToChange', target: null }));

    useEffect(() => {
        if (!target) {
            return;
        }
        // Copyを編集する
        const copy = JSON.parse(JSON.stringify(target));
        setBundle(copy);
        setOldHash(hash(JSON.stringify(copy)));
    }, [target]);

    useEffect(() => {
        const dirty = newHash && oldHash && newHash !== oldHash;
        setDirty(dirty);

    }, [oldHash, newHash]);

    const handleQuantity = (row, e) => {
        // ClaimItemの数量
        const value = halfFrom(getValue(e)) || '';
        const newBundle = { ...bundle };
        newBundle.claimItems[row].quantity = value;
        setBundle(newBundle);
        setFilled(hasValidQuantity(newBundle));
        setNewHash(hash(JSON.stringify(newBundle)));
    };

    const handleBundleQuantity = e => {
        // Bundleの数量（回分、日分、セット数）
        const value = halfFrom(getValue(e)) || '';
        const newBundle = { ...bundle };
        newBundle.quantity = value;
        setBundle(newBundle);
        setFilled(hasValidQuantity(newBundle));
        setNewHash(hash(JSON.stringify(newBundle)));
    };

    const handleSubmit = () => {
        dispatch({ type: 'submitBundleChange', bundle: bundle, patient: patient });
    };

    const handleCancel = () => {
        dispatch({ type: 'setBundleToChange', target: null });
    };

    let firstRow = 0;

    return bundle ? (
        <ModalEditorLarge
            id='bundle_changer'
            title={title}
            okText={CHANGE_TEXT}
            okEnabled={isFilled && isDirty}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <table className='w3-table w3-bordered'>
                <tbody>
                    <tr>
                        <th>{TEXT_NAME}</th>
                        <th>{TEXT_QUANTITY}</th>
                        <th>{TEXT_UNIT}</th>
                    </tr>
                    {
                        // 名称 数量(input) 単位 単位がない項目は input なし
                        claimItems.map((item, index) => {
                            const { code, name, quantity, unit } = item;
                            // const unit = item.unit || null;
                            const autoFocus = unit && (firstRow === 0);
                            firstRow = autoFocus ? firstRow + 1 : firstRow;
                            return (
                                <tr key={code}>
                                    <td>{name}</td>
                                    {
                                        unit ? (
                                            <td>
                                                <input
                                                    type='text'
                                                    className='w3-input w3-right-align w3-border-0 w3-pale-red'
                                                    style={CellStyle}
                                                    value={quantity}
                                                    autoFocus={autoFocus}
                                                    onFocus={handleInputFocus}
                                                    onChange={(e)=>handleQuantity(index, e)}
                                                    onKeyDown={handleKeyDown}
                                                />
                                            </td>
                                        ) : (
                                            <td />
                                        )
                                    }
                                    <td>{unit || null}</td>
                                </tr>
                            );
                        })
                    }
                    {
                        // 数量部分->バンドルについている
                        isPrescription && (
                            instructions.map(item => {
                                const { code, name } = item;
                                return (
                                    <tr key={code}>
                                        <td>{`[${TEXT_USAGE}] ${name}`}</td>
                                        <td>
                                            <input
                                                type='text'
                                                className='w3-input w3-right-align w3-border-0 w3-pale-red'
                                                style={CellStyle}
                                                value={bundle.quantity}
                                                onFocus={handleInputFocus}
                                                onChange={handleBundleQuantity}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </td>
                                        <td>{bundle.unit}</td>
                                    </tr>
                                );
                            })
                        )
                    }
                </tbody>
            </table>
        </ModalEditorLarge>
    ) : (
        <div />
    );
};

const CellStyle = { width: '60px', height: '18px' };
const TEXT_NAME = '名称';
const TEXT_QUANTITY = '数量';
const TEXT_UNIT = '単位';
const TEXT_USAGE = '用法';

export default BundleChanger;
