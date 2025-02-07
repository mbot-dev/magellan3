import { useEffect, useReducer } from 'react';
import {produce} from 'immer';
import { v4 } from 'uuid';
import styled from "styled-components";
import { SAVE_TEXT, getValue, handleKeyDown } from "../../../aux/FormUtil";
import { useStateValue } from "../../../reducers/state";
import inputFunc from "../../../models/inputFunc";
import { useLockBodyScroll } from "../../../hook/useLockBodyScroll";
import { useEscKey } from "../../../hook/useEscKey";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import withDisplayNull from '../../../aux/withDisplayNull';
import claimFunc from "../../../models/claimFunc";

const initialState = {
    name: null,
    items: [],
    mandatory: null,
    isFilled: false
};

const reducer = produce((draft, action) => {
    const { type, payload } = action;
    switch (type) {
        case 'init': {
            const { name, claimItems, mandatory } = payload;
            draft.name = name;
            draft.items = claimItems;
            draft.mandatory = mandatory;
            break;
        }
        case 'change': {
            const { index, value } = payload;
            draft.items[index].strValue = value;
            if (draft.mandatory) {
                const filled = draft.mandatory.split(' ').every(str => {
                    const index = parseInt(str);
                    return draft.items[index].strValue;
                });
                draft.isFilled = filled;
            }
            // 計算  bmi etc
            draft.items.forEach((it, index) => {
                if (it.equation) {
                    const params = [];
                    const { equationParams } = it;
                    const filled = equationParams.split(' ').every(str => {
                        const index = parseInt(str);  // '0 1'
                        const test = draft.items[index]?.strValue ?? null;
                        if (test) {
                            params.push(test);
                            return true;
                        }
                        return false;
                    });
                    if (filled) {
                        const val = inputFunc[it.equation](params);
                        draft.items[index].strValue = val;
                        console.log(JSON.stringify(params, null, 3));
                        console.log(val);
                    }
                }
                // 評価  mapp calc to evaluation
                if (it['evalFunc']) {
                    const params = [];
                    const { evalParams } = it;
                    const filled = evalParams.split(' ').every(str => {
                        const index = parseInt(str);
                        const test = draft.items[index]?.strValue ?? null;
                        if (test) {
                            params.push(test);
                            return true;
                        }
                        return false;
                    });
                    if (filled) {
                        const val = inputFunc[it['evalFunc']](params);
                        draft.items[index].description = val;
                    }
                }
            });
            break;
        }
        default:
            break;
    }

});

const InputEditor = ({ width = '384px' }) => {
    const [{ inputToEdit }, dispatch] = useStateValue();  // from reducer
    const [{ name, items, isFilled }, localDispatch] = useReducer(reducer, initialState);
    useLockBodyScroll();
    useEscKey(() => dispatch({ type: 'setInputToEdit', target: null }));  // null -> close

    // inputToEdit: DB から取得したInputCatalogue=InputBundle
    useEffect(() => {
        if (inputToEdit && localDispatch) {
            localDispatch({ type: 'init', payload: inputToEdit });
        }

    }, [inputToEdit, localDispatch]);

    // Bundleに変換
    const handleSubmit = () => {
        // mandatory, items
        const inputBundle = claimFunc['createInputBundle'](inputToEdit);
        // InputItem -> ClaimItem valueType, fracDigits, equation, equationParams, evalFunc, evalParams
        items.forEach(it => {
            if (it.strValue) {
                const { group, category } = inputBundle;
                const data = { ...{ group, category }, ...it };
                const claimItem = claimFunc['createInputItem'](data);
                claimItem.id = v4();
                claimItem.value = Number(it.strValue);
                claimItem.description = it.description || `${claimItem.value}${claimItem.unit}`;
                inputBundle.claimItems.push(claimItem);
            }
        });
        //---------------------------------------------------------
        dispatch({ type: 'submitInput', bundle: inputBundle });
        //---------------------------------------------------------
    };

    const handleCancel = () => {
        dispatch({ type: 'setInputToEdit', target: null });
    };

    const handleChange = e => {
        const index = Number(e.target.name);
        const value = getValue(e);
        localDispatch({ type: 'change', payload: { index: index, value: value } });
    };

    return (
        <ModalEditorLarge
            id='input_editor'
            title={name}
            okText={SAVE_TEXT}
            okEnabled={isFilled}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            width={width}>
            <div className='w3-panel'>
                <ul className='w3-ul'>
                    {
                        items.map((item, index) => {
                            const { code, name, strValue, valueType, unit, placeholder, equation } = item;
                            return (
                                <li style={ListStyle} key={code}>
                                    <div className='z3-flex'>
                                        <ItemName>{name}</ItemName>
                                        <input
                                            type='text'
                                            className={DEFAULT_INPUT_STYLE}
                                            style={valueType && valueType !== 'string' ? { flex: '1 0 144px', textAlign: 'right' } : { flex: '1 0 144px' }}
                                            autoFocus={index === 0}
                                            name={index}
                                            value={strValue}
                                            placeholder={placeholder || ''}
                                            disabled={equation || false}
                                            onChange={handleChange}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <Spacer8 />
                                        <Unit>{unit}</Unit>
                                    </div>
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
        </ModalEditorLarge>
    );
};

const DEFAULT_INPUT_STYLE = 'w3-input w3-border w3-border-light-gray w3-round';

const ListStyle = {
    borderBottom: '0'
};

// flex: grow shrink basis
const ItemName = styled.span`
    flex: 0 0 96px;
`;

const Spacer8 = styled.span`
    flex: 0 0 8px;
`;

const Unit = styled.span`
    flex: 0 0 96px;
    margin-left: 8px;
`;

const EnhancedInputEditor = withDisplayNull(InputEditor);
export default EnhancedInputEditor;
