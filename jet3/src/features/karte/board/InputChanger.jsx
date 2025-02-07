import {useState, useEffect} from 'react';
import styled from "styled-components";
import {useStateValue} from "../../../reducers/state";
import {handleKeyDown, getValue, SAVE_TEXT} from "../../../aux/FormUtil";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import {useLockBodyScroll} from "../../../hook/useLockBodyScroll";
import {useEscKey} from "../../../hook/useEscKey";
import inputFunc from "../../../models/inputFunc";
import claimFunc from "../../../models/claimFunc";

const InputChanger = ({target}) => {
    const dispatch = useStateValue()[1];
    const [copy, setCopy] = useState(null);
    const [name, setName] = useState('');
    const [items, setItems] = useState([]);

    useLockBodyScroll();
    useEscKey(() => dispatch({type: 'setInputToChange', target: null}));

    useEffect(() => {
        if (!target) {
            return;
        }
        // Bundle -> InputItemを復元する
        const copy = JSON.parse(JSON.stringify(target));     // {...target};
        const {name, claimItems} = copy;
        claimItems.forEach(cl => {
            cl.value = 0;
            cl.description = '';
        });
        setName(name);
        setItems(claimItems);
        setCopy(copy);
    }, [target]);

    const handleSubmit = () => {
        // const inputBundle = {...target};
        copy.claimItems = [];
        items.forEach(it => {
            if (it.strValue) {
                const {group, category} = copy;
                it.value = Number(it.strValue);
                it.description = it.description || `${it.value}${it.unit}`;
                const data = {...{group, category}, ...it};
                const claimItem = claimFunc['createInputItem'](data);
                claimItem.id = it.id;
                copy.claimItems.push(claimItem);
            }
        });
        dispatch({type: 'submitInputChange', bundle: copy});
    };

    const handleCancel = () => {
        dispatch({type: 'setInputToChange', target: null});
    };

    const handleChange = e => {
        const newItems = [...items];
        const target = newItems[Number(e.target.name)];
        target.strValue = getValue(e);
        newItems.forEach((it, index) => {
            if (it.equation) {
                const params = [];
                const {equationParams} = it;
                const filled = equationParams.split(' ').every(str => {
                    const index = parseInt(str);
                    const test = newItems[index]?.strValue ?? null;
                    if (test) {
                        params.push(test);
                        return true;
                    }
                    return false;
                });
                if (filled) {
                    const val = inputFunc[it.equation](params);
                    const t = newItems[index];
                    t.strValue = val;
                }
            }
            if (it.evalFunc) {
                const params = [];
                const {evalParams} = it;
                const filled = evalParams.split(' ').every(str => {
                    const index = parseInt(str);
                    const test = newItems[index]?.strValue ?? null;
                    if (test) {
                        params.push(test);
                        return true;
                    }
                    return false;
                });
                if (filled) {
                    const val = inputFunc[it.evalFunc](params);
                    const t = newItems[index];
                    t.description = val;
                }
            }
        });
        setItems(newItems);
    };

    return (
        <ModalEditorLarge
            id='input_editor'
            title={name}
            okText={SAVE_TEXT}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            width={'384px'}>
            <div className='w3-panel'>
                <ul className='w3-ul'>
                {
                    items.map((item, index) => {
                        const {code, name, strValue, valueType, unit, placeholder, equation} = item;
                        return (
                            <li style={ListStyle} key={code}>
                                <div className='z3-flex'>
                                    <ItemName>{name}</ItemName>
                                    <input
                                        type='text'
                                        className={DEFAULT_INPUT_STYLE}
                                        style={valueType && valueType !== 'string' ? {flex: '1 0 144px', textAlign: 'right'} : {flex: '1 0 144px'}}
                                        autoFocus={index === 0}
                                        name={index}
                                        value={strValue}
                                        placeholder={placeholder}
                                        disabled={equation}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <Spacer8/>
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

export default InputChanger;
