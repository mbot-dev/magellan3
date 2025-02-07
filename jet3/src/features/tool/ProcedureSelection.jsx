import { useEffect, useState } from 'react';
import hash from 'object-hash';
import { useStateValue } from "../../reducers/state";
import { SAVE_TEXT, REVERT_TEXT } from "../../aux/FormUtil";
import { currFacility } from "../../models/karteCtx";
import { getProcedureCatalogue } from "../../io/inputIO";
import { updateUsingProcedures } from "../../io/stampIO";
import Buttons from '../../cmp/Buttons';
import styled from 'styled-components';
import withDisplayNull from '../../aux/withDisplayNull';

// スタンプツリーに表紙する、i.e. 病院で使用する診療行為選択
const ProcedureSelection = () => {
    const [{ user, usingProcedures }, dispatch] = useStateValue();
    const [allProcedures, setAllProcedures] = useState([]);
    const [working, setWorking] = useState([]);
    const [usingHash, setUsingHash] = useState('');
    const [isDirty, setDirty] = useState(false);

    useEffect(() => {
        const asyncGet = async () => {
            try {
                const results = await getProcedureCatalogue();
                setAllProcedures(results);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncGet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const arr = [];
        arr.push(...usingProcedures);
        const entityHash = hash(arr.map(u => u.entity).join(' '));
        setUsingHash(entityHash);
        setWorking(arr);
    }, [usingProcedures]);

    useEffect(() => {
        const workingHash = hash(working.map(u => u.entity).join(' '));
        setDirty(workingHash !== usingHash);
    }, [working]);

    const handleOptionChange = e => {
        const { name, checked } = e.target;
        const newArr = [...working];
        const index = newArr.findIndex(x => x.entity === name);
        if (index === -1 && checked) {
            const idx = allProcedures.findIndex(x => x.entity === name);
            const add = allProcedures[idx];
            add.facilityId = currFacility(user).id;
            newArr.push(add);
        } else if (!checked) {
            newArr.splice(index, 1);
        }
        newArr.sort((a, b) => {
            if (a['entityOrder'] < b['entityOrder']) return -1;
            if (a['entityOrder'] > b['entityOrder']) return 1;
            return 0;
        });
        setWorking(newArr);
    };

    // usingProcedure配列が変化
    const handleSubmit = e => {
        e.preventDefault();
        const asyncUpdate = async (facilityId, payload) => {
            try {
                await updateUsingProcedures(facilityId, payload);
                dispatch({ type: 'setUsingProcedures', using: working });
            } catch (err) {
                console.log(err);
            }
        };
        const facilityId = currFacility(user).id;
        asyncUpdate(facilityId, working).catch(err => console.log(err));
    };

    const handleRevert = () => {
        const arr = [];
        arr.push(...usingProcedures);
        setWorking(arr);
    };

    const findUsingItem = entity => {
        const index = working.findIndex(x => x.entity === entity);
        return index !== -1;
    };

    return (
        <Layout>
            <MyForm onSubmit={handleSubmit}>
                <Scroller>
                    <table className='w3-table w3-hoverable'>
                        <MyHeader>
                            <tr>
                                <th>名称</th>
                                <th>略称（タブ名）</th>
                                <th>診療報酬区分</th>
                                <th>使用</th>
                            </tr>
                        </MyHeader>
                        <tbody>
                            {
                                allProcedures.filter(x => x.entity !== 'disease' && x.entity !== 'input').map(spec => {
                                    const { id, entity, name, shortName, category } = spec;
                                    const isUsing = findUsingItem(entity);
                                    return (
                                        <tr key={id}>
                                            <td>{name}</td>
                                            <td>{shortName}</td>
                                            <td>{category}</td>
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
                <div className='z3-flex' style={{'--justify': 'center', '--gap': '8px'}}>
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
`;

const ProcedureSelectionWithDisplayNull = withDisplayNull(ProcedureSelection);
export default ProcedureSelectionWithDisplayNull;
