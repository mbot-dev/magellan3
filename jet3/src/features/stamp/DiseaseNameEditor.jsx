import {useState, useEffect} from 'react';
import {getValue, isEnter} from '../../aux/FormUtil';
import ModalEditorLarge from '../../cmp/ModalEditorLarge';

const DiseaseNameEditor = ({stamp, onEditEnd, onCancel}) => {
    const [stampName, setStampName] = useState('');

    useEffect(() => {
        if (!stamp) {
            return;
        }
        const name = stamp.stampName ? stamp.stampName : `${stamp.name}(${stamp.icd1012})`;
        setStampName(name);
    }, [stamp]);

    const handleCancel = () => {
        onCancel();
    };

    const handleSubmit = () => {
        onEditEnd(stampName);
    };

    const handleChangeName = e => {
        setStampName(getValue(e));
    };

    const handleKeydown = e => {
        if (isEnter(e)) {
            e.preventDefault();
            e.target.blur();
        }
    };

    return (
        <ModalEditorLarge 
            id='stamp_name' 
            title='名称変更' 
            okText='変更' 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}>
            <div className='w3-panel'>
                <label>名称</label>
                <input
                    className='w3-input w3-border-0 w3-pale-red'
                    type='text'
                    value={stampName}
                    autoFocus={true}
                    onKeyDown={handleKeydown}
                    onChange={handleChangeName}
                />
            </div>
            <table className='w3-table'>
                <tbody className='w3-border-bottom'>
                <tr>
                    <th>傷病名</th>
                    <td>{stamp.name}</td>
                </tr>
                <tr>
                    <th>ICD10</th>
                    <td>{stamp.icd1012}</td>
                </tr>
                </tbody>
            </table>
        </ModalEditorLarge>
    );
};

export default DiseaseNameEditor;
