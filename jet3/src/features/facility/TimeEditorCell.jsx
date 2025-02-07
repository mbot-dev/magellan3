import { useEffect, useReducer } from 'react';
import {produce} from 'immer';
import hash from 'object-hash';
import styled from 'styled-components';
import ModalEditorLarge from '../../cmp/ModalEditorLarge';

const initilaState = {
    copyTime: null,
    oldHash: null,
    isDirty: false,
    amOff: false,
    pmOff: false,
};

const reducer = (state, action) => {
    return produce(state, draft => {
        switch (action.type) {
            case 'init':
                draft.copyTime = JSON.parse(JSON.stringify(action.payload));
                draft.oldHash = hash(draft.copyTime);
                break;
            case 'setAmOff':
                draft.amOff = !draft.amOff;
                if (draft.amOff) {
                    draft.copyTime.amStart = '';
                    draft.copyTime.amEnd = '';
                }
                draft.isDirty = hash(draft.copyTime) !== draft.oldHash;
                break;
            case 'setPmOff':
                draft.pmOff = !draft.pmOff;
                if (draft.pmOff) {
                    draft.copyTime.pmStart = '';
                    draft.copyTime.pmEnd = '';
                }
                draft.isDirty = hash(draft.copyTime) !== draft.oldHash;
                break;
            case 'setTime': {
                const { time, value } = action.payload;
                draft.copyTime[time] = value;
                draft.isDirty = hash(draft.copyTime) !== draft.oldHash;
                break;
            }
            default:
                break;
        }
    });
};

const TimeCellEditor = ({ time, onCancel, onSubmit }) => {
    const [{ copyTime, amOff, pmOff, isDirty }, localDispatch] = useReducer(reducer, initilaState);

    useEffect(() => {
        if (!time) {
            return;
        }
        localDispatch({ type: 'init', payload: time });
    }, [time]);

    const handleAmOff = () => {
        localDispatch({ type: 'setAmOff' });
    };

    const handlePmOff = () => {
        localDispatch({ type: 'setPmOff' });
    };

    const handleTimeChange = (e) => {
        const { value } = e.target;
        const time = e.target.getAttribute('data-item');
        const data = { time, value };
        localDispatch({ type: 'setTime', payload: data });
    };

    const handleSubmit = () => {
        onSubmit(JSON.parse(JSON.stringify(copyTime)));
    };

    return copyTime && (
        <ModalEditorLarge
            id='time_editor'
            title='診療時間個別編集'
            onCancel={onCancel}
            okEnabled={isDirty}
            onSubmit={handleSubmit}
            justify='center'
            width='400px'
        >
            <div className="z3-flex-column" style={{'--gap': '16px'}}>
                <span>{`${copyTime.disp}曜日の時間変更`}</span>
                <div className='z3-flex' style={{'--gap': '4px'}}>
                    <span>AM</span>
                    <TimeInput
                        name='amStart'
                        value={copyTime.amStart}
                        data-item='amStart'
                        onChange={handleTimeChange}
                    />
                    <span>&#65374;</span>
                    <TimeInput
                        name='amEnd'
                        value={copyTime.amEnd}
                        data-item='amEnd'
                        onChange={handleTimeChange}
                    />
                    <div className='z3-h-spacer' style={{'--w': '16px'}} />
                    <div style={{ width: '128px' }}>
                        <input className="w3-check" type="checkbox" id='amOff' name='' value={amOff} checked={amOff} onChange={handleAmOff} />
                        <label htmlFor='amOff'>休診</label>
                    </div>
                </div>
                <div className='z3-flex' style={{'--gap': '4px'}}>
                    <span>PM</span>
                    <TimeInput
                        name='pmStart'
                        value={copyTime.pmStart}
                        data-item='pmStart'
                        onChange={handleTimeChange}
                    />
                    <span>&#65374;</span>
                    <TimeInput
                        name='pmEnd'
                        value={copyTime.pmEnd}
                        data-item='pmEnd'
                        onChange={handleTimeChange}
                    />
                    <div className='z3-h-spacer' style={{'--w': '16px'}} />
                    <div style={{ width: '128px' }}>
                        <input className="w3-check" type="checkbox" id='pmOff' name='' value={pmOff} checked={pmOff} onChange={handlePmOff} />
                        <label htmlFor='pmOff'>休診</label>
                    </div>
                </div>
            </div>
        </ModalEditorLarge>
    );
};

const TimeInput = styled.input.attrs({
    type: 'text'
})`
    width: 64px;
    text-align: center;
`;

export default TimeCellEditor;