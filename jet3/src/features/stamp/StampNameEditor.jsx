import { useState } from 'react';
import { useStamp } from './useClaim';
import ModalEditorLarge from '../../cmp/ModalEditorLarge';
import { GridColumn12, GridItem, rowAt } from '../../aux/commonStyles';
import { KanjiInput } from '../../cmp/KanjiInput';
import { CHANGE_TEXT, getValue } from '../../aux/FormUtil';

const StampNameEditor = ({ stamp, onEditEnd, onCancel }) => {
    const [stampName, setStampName] = useState(stamp.stampName);
    const [claimItems, instructions, title, isPrescription] = useStamp(stamp);

    const handleCancel = () => {
        onCancel();
    };

    const handleSubmit = () => {
        onEditEnd(stampName);
    };

    const handleChangeName = e => {
        setStampName(getValue(e));
    };

    return (
        <ModalEditorLarge
            id='stamp_name'
            title={title}
            okText={CHANGE_TEXT}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <GridColumn12 rowGap='16px'>
                <GridItem grid={rowAt(1, 1, 3)}>
                    <label>{TEXT_STAMP_NAME}</label>
                </GridItem>
                <GridItem grid={rowAt(1, 4, 9)}>
                    <KanjiInput
                        value={stampName}
                        autoFocus={true}
                        onChange={handleChangeName}
                    />
                </GridItem>
                <GridItem grid={rowAt(2, 1, 12)}>
                    <table className='w3-table w3-bordered'>
                        <tbody>
                            <tr>
                                <th>{TEXT_CONTENT}</th>
                                <th>{TEXT_QUANTITY}</th>
                                <th>{TEXT_UNIT}</th>
                            </tr>
                            {
                                claimItems.map(item => {
                                    const unit = item.unit || null;
                                    const quantity = unit ? item.quantity : null;
                                    return (
                                        <tr key={item.code}>
                                            <td>{item.name}</td>
                                            <td>{quantity}</td>
                                            <td>{unit}</td>
                                        </tr>
                                    );
                                })
                            }
                            {
                                isPrescription && (
                                    instructions.map((item, index) => {
                                        const quantity = index === 0 ? stamp.quantity : null;
                                        const unit = index === 0 ? stamp.unit : null;
                                        return (
                                            <tr key={item.code}>
                                                <td>{`[${TEXT_USAGE}] ${item.name}`}</td>
                                                <td>{quantity}</td>
                                                <td>{unit}</td>
                                            </tr>
                                        );
                                    })
                                )
                            }
                        </tbody>
                    </table>
                </GridItem>
            </GridColumn12>
        </ModalEditorLarge>
    );
};

const TEXT_STAMP_NAME = 'スタンプ名';
const TEXT_CONTENT = '内容';
const TEXT_QUANTITY = '数量';
const TEXT_UNIT = '単位';
const TEXT_USAGE = '用法';

export default StampNameEditor;
