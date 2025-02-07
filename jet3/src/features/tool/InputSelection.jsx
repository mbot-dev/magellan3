import { useEffect, useState } from 'react';
import styled from 'styled-components';
import hash from 'object-hash';
import { useStateValue } from "../../reducers/state";
import { REVERT_TEXT, SAVE_TEXT } from "../../aux/FormUtil";
import { getInputCatalogue } from "../../io/inputIO";
import { updateUsingInput } from "../../io/stampIO";
import { currFacility } from "../../models/karteCtx";
import Buttons from '../../cmp/Buttons';
import withDisplayNull from '../../aux/withDisplayNull';

const InputSelection = () => {
    const [{ user, usingInputs }, dispatch] = useStateValue();
    const [allInputs, setAllInputs] = useState([]);
    const [working, setWorking] = useState([]);
    const [usingHash, setUsingHash] = useState('');
    const [isDirty, setDirty] = useState(false);

    // 入力項目カタログを取得する
    useEffect(() => {
        const asyncGet = async () => {
            try {
                const results = await getInputCatalogue();
                setAllInputs(results);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncGet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const arr = [];
        arr.push(...usingInputs);
        const entityHash = hash(arr.map(u => u.entity).join(' '));
        setUsingHash(entityHash);
        setWorking(arr);
    }, [usingInputs]);

    useEffect(() => {
        const workingHash = hash(working.map(u => u.entity).join(' '));
        setDirty(workingHash !== usingHash);
    }, [working]);

    const handleSubmit = e => {
        e.preventDefault();
        const asyncUpdate = async (fcId, arr) => {
            await updateUsingInput(fcId, arr)
                .then((result) => {
                    dispatch({ type: 'setUsingInputs', using: working });
                });
        };
        const facility_id = currFacility(user).id;
        asyncUpdate(facility_id, working).catch(err => console.log(err));
    };

    const handleRevert = () => {
        const arr = [];
        arr.push(...usingInputs);
        setWorking(arr);
    };

    const findUsingItem = entity => {
        const index = working.findIndex(x => x.entity === entity);
        return index !== -1;
    };

    const handleOptionChange = e => {
        const { name, checked } = e.target;
        const newArr = [...working];
        const index = newArr.findIndex(x => x.entity === name);
        if (index === -1 && checked) {
            const idx = allInputs.findIndex(x => x.entity === name);
            const add = allInputs[idx];
            add.facilityId = currFacility(user).id;
            newArr.push(add);
        } else if (!checked) {
            newArr.splice(index, 1);
        }
        setWorking(newArr);
    };

    return (
        <Layout>
            <MyForm onSubmit={handleSubmit}>
                <Scroller>
                    <table className='w3-table w3-hoverable'>
                        <MyHeader>
                            <tr>
                                <th>名称</th>
                                <th>入力項目</th>
                                <th>使用</th>
                            </tr>
                        </MyHeader>
                        <tbody>
                            {
                                allInputs.map((spec, index) => {
                                    const { id, entity, name, items } = spec;
                                    const isUsing = findUsingItem(entity);
                                    return (
                                        <tr key={id}>
                                            <td>{name}</td>
                                            <td>{items}</td>
                                            <td>
                                                <input
                                                    type='checkbox'
                                                    className='w3-check'
                                                    name={entity}
                                                    checked={isUsing}
                                                    onChange={e => handleOptionChange(e)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </Scroller>
                <div className='z3-flex' style={{'--gap': '8px', '--justify': 'center'}}>
                    <Buttons
                        optionText={REVERT_TEXT}
                        optionEnabled={isDirty}
                        onOption={handleRevert}
                        okText={SAVE_TEXT}
                        okEnabled={isDirty}
                        onSubmit={handleSubmit}
                    />
                </div>
            </MyForm>
        </Layout>
    );
};

const Layout = styled.div`
`;

const MyForm = styled.form`
    display: flex;
    flex-direction: column;
    row-gap: 16px;
`;

const Scroller = styled.div`
    max-height: calc(100vh - 60px - 32px - 38px);
    overflow-y: auto;
`;

const MyHeader = styled.thead`
    & th {
        position: sticky;
        top: 0;
        color: var(--on-background);
        z-index: 2;
    }
    & th: first-child {
        z-index: 3;
    }
`;

const NamedInputSelection = withDisplayNull(InputSelection);
export default NamedInputSelection;
