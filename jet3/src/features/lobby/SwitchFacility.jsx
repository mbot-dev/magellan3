import { useState, useEffect } from 'react';
import { v4 } from "uuid";
import { useLockBodyScroll } from "../../hook/useLockBodyScroll";
import { useEscKey } from "../../hook/useEscKey";
import ModalEditorLarge from '../../cmp/ModalEditorLarge';

const SwitchFacility = ({ user, onSelect, onCancel }) => {
    const [hospIndex, setHospIndex] = useState(-1);
    const [hasChanged, setHasChanged] = useState(false);
    useLockBodyScroll();
    useEscKey(onCancel);

    useEffect(() => {
        if (hospIndex === -1) {
            return;
        }
        const selected = user['facilities'][hospIndex];
        setHasChanged(selected.id !== user.currFc);

    }, [hospIndex, user]);

    const handleSubmit = () => {
        const selected = user['facilities'][hospIndex];
        onSelect(selected.id);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleHospChange = e => {
        setHospIndex(Number(e.target.value));
    };

    return (
        <ModalEditorLarge
            id='switchFacility'
            title='医療機関切り替え'
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            okText={TEXT_SELECT}
            width='384px'
        >
            <ul className='w3-ul'>
                <li style={ListStyle}><span className='w3-text-red'>切り替える医療機関を選択してください</span></li>
                <li style={ListStyle}>
                    <div className='z3-flex'>
                        <select className='w3-select' value={hospIndex} onChange={handleHospChange} style={{ flex: '0 0 auto' }}>
                            {
                                user['facilities'].map((fc, index) => {
                                    return (
                                        <option
                                            key={v4()}
                                            value={index}
                                            disabled={user && user.currFc === fc.id}
                                        >{fc.name}
                                        </option>
                                    );
                                })
                            }
                        </select>
                    </div>
                </li>
            </ul>
        </ModalEditorLarge>
    );
};

const ListStyle = {
    borderBottom: '0'
};

const TEXT_SELECT = '選択';

export default SwitchFacility;
