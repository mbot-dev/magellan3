import { useEffect, useReducer } from "react";
import { produce } from 'immer';
import hash from "object-hash";
import ModalEditorLarge from "../../cmp/ModalEditorLarge";
import { SAVE_TEXT } from "../../aux/FormUtil";
import { getAllDepts } from "../../io/masterIO";
import { useStateValue } from "../../reducers/state";

const initialState = {
    selections: [],
    allDepts: [],
    oldHash: '',
    isFilled: false,
    isDirty: false,
};

const reducer = (state, action) => {
    return produce(state, draft => {
        switch (action.type) {
            case 'init':
                draft.allDepts = action.payload;
                break;
            case 'setDepts':
                draft.selections = JSON.parse(JSON.stringify(action.payload));
                draft.oldHash = hash(action.payload);
                draft.isFilled = action.payload.length > 0;
                break;
            case 'setCheck': {
                const {name, checked} = action.payload;
                const dept = draft.allDepts.find(x => x.code === name);
                if (checked && !draft.selections.find(x => x.code === dept.code)) {
                    draft.selections.push(dept);
                } else if (!checked && draft.selections.find(x => x.code === dept.code)) {
                    const index = draft.selections.findIndex(x => x.code === dept.code);
                    draft.selections.splice(index, 1);
                }
                draft.selections.sort((a, b) => {
                    if (a.code < b.code) {
                        return -1;
                    }
                    if (a.code > b.code) {
                        return 1;
                    }
                    return 0;
                });
                draft.isFilled = draft.selections.length > 0;
                draft.isDirty = hash(draft.selections) !== draft.oldHash;
                break;
            }
            default:
                break;
        }
    });
};

const DeptSelecter = ({ depts, onCancel, onSave }) => {
    const dispatch = useStateValue()[1];
    const [{selections, allDepts, isFilled, isDirty}, localDispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const asyncGet = async () => {
            try {
                const results = await getAllDepts();
                localDispatch({ type: 'init', payload: results });
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncGet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!depts?.length) {
            return;
        }
        localDispatch({ type: 'setDepts', payload: depts });

    }, [depts]);

    const handleChange = e => {
        const {name, checked} = e.target;
        const data = {
            name,
            checked,
        };
        localDispatch({ type: 'setCheck', payload: data });
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleSubmit = () => {
        onSave(JSON.parse(JSON.stringify(selections)));
    };

    return (
        <ModalEditorLarge
            id='dept_selector'
            title={TEXT_NOTIFY_DEPT}
            okText={SAVE_TEXT}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            okEnabled={isFilled && isDirty}
            width="920px"
        >
            <div className='w3-border w3-padding-small'>
                <div className="z3-auto-fit-grid" style={{'--min-width': '220px'}}>
                    {
                        allDepts.filter(x => x.name !== null).map((d, i) => {
                            const checked = selections.find(x => x.code === d.code) || false;  // Needs!
                            return (
                                <div key={i} className="z3-flex" style={{'--align': 'center', '--gap': '4px'}}>
                                    <input 
                                        type="checkbox"
                                        className="w3-check"
                                        id={d.code}
                                        name={d.code}
                                        checked={checked}
                                        disabled={false}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor={d.code}>{`${d.code}(${d.name})`}</label>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </ModalEditorLarge>
    );
};

const TEXT_NOTIFY_DEPT = '診療科選択';

export default DeptSelecter;