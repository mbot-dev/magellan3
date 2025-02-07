import { useEffect, useState } from 'react';
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { currFacility } from '../../models/karteCtx';
import DeptSelecter from './DeptSelecter';
import { getTimeSchedule, replaceTimeSchedule, updateFacility } from '../../io/facilityIO';
import { CANCEL_SHORT_TEXT, EDIT_TEXT, SAVE_TEXT } from '../../aux/FormUtil';
import TimeEditor from './TimeEditor';
import TimeView from './TimeView';
import { getDefaultTimeTable } from './timeModel';
import withDisplayNull from '../../aux/withDisplayNull';

const useOwner = user => {
    const [isOwner, setOwner] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }
        const fc = currFacility(user);
        setOwner(fc.owner === user.id);

    }, [user]);

    return isOwner;
};

const Hyobo = () => {
    const [{ user }, dispatch] = useStateValue();
    const isOwner = useOwner(user);
    const [depts, setDepts] = useState([]);
    const [showDeptSelecter, setShowDeptSelecter] = useState(false);
    const [timeMode, setTimeMode] = useState('view');
    const [timeTable, setTimeTable] = useState(null);
    const [triggerSave, setTriggerSave] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }
        const fc = currFacility(user);
        if (!fc?.departments?.length) {
            return;
        }
        setDepts(fc.departments);
        const asyncGet = async (fcId) => {
            try {
                const result = await getTimeSchedule(fcId);
                const ts = result.length > 0 ? result[0] : null;
                if (!ts) {
                    setTimeTable(getDefaultTimeTable(fcId));
                    return;
                }
                ts.weekDays.sort((a, b) => a.day - b.day);
                setTimeTable(ts);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncGet(fc.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleShowDeptSelecter = () => {
        setShowDeptSelecter(!showDeptSelecter);
    };

    const handleChangeTimeView = () => {
        if (timeMode === 'edit') {
            return;
        }
        Promise.resolve().then(() => setTimeMode('edit'));
    };

    const handleSave = (newDepts) => {
        setShowDeptSelecter(!showDeptSelecter);
        const asyncUpdate = async (fc_id, attrs) => {
            try {
                await updateFacility(fc_id, attrs);
                dispatch({ type: 'updateFacility', attributes: attrs });
                setDepts(newDepts);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const attributes = { departments: newDepts };
        const facility_id = user.currFc;
        asyncUpdate(facility_id, attributes);
    };

    const handleCancel = () => {
        setShowDeptSelecter(!showDeptSelecter);
    };

    const handleCancelTimeEdit = () => {
        setTimeMode('view');
    };

    const handleTriggerSave = () => {
        setTriggerSave(!triggerSave);
    };

    const handleSaveTable = (newTable) => {
        const asyncUpcert = async (newTable) => {
            try {
                await replaceTimeSchedule(newTable);
                setTimeTable(newTable);
                setTimeMode('view');
                setTriggerSave(false);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncUpcert(newTable);
    };

    return timeTable && (
        <Layout>
            <Main>
                <Label>{TEXT_DEPT}</Label>
                <Control>
                    <div className='z3-flex' style={{'--gap': '32px'}}>
                        {
                            depts.map((d, i) => {
                                return (
                                    <div key={i} style={{ flex: '0 0 auto' }}>
                                        <span>{d.name}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </Control>
                <Command>
                    <button 
                        className='w3-button w3-border w3-round w3-padding-small' 
                        disabled={!isOwner} 
                        onClick={handleShowDeptSelecter}>
                        {EDIT_TEXT}
                    </button>
                </Command>
                <Label>{TEXT_TIME_SCHEDULE}</Label>
                <Control>
                    {timeMode === 'view' && <TimeView timeTable={timeTable} />}
                    {timeMode === 'edit' && <TimeEditor tableToEdit={timeTable} saveTable={triggerSave} onSave={handleSaveTable} />}
                </Control>
                <Command>
                    <div className='z3-flex-column' style={{'--gap': '4px'}}>
                        <button 
                            className='w3-button w3-border w3-round w3-padding-small' 
                            disabled={!isOwner || timeMode!=='view'} 
                            onClick={handleChangeTimeView}>
                            {EDIT_TEXT}
                        </button>
                        <button 
                            className='w3-button w3-border w3-round w3-padding-small' 
                            disabled={!isOwner || timeMode==='view'} 
                            onClick={handleCancelTimeEdit}>
                            {CANCEL_SHORT_TEXT}
                        </button>
                        <button 
                            className='w3-button w3-border w3-round w3-padding-small' 
                            disabled={!isOwner || timeMode==='view'} 
                            onClick={handleTriggerSave}>
                            {SAVE_TEXT}
                        </button>
                    </div>
                </Command>
                {
                    showDeptSelecter &&
                    <DeptSelecter
                        depts={depts}
                        onCancel={handleCancel}
                        onSave={handleSave}
                    />
                }
            </Main>
        </Layout>
    );
};

const Layout = styled.div`
    width: 1024px;
    padding: 0 0 0 32px;
    `;

const Main = styled.div`
    display: grid;
    grid-template-columns: [labels] minmax(100px, 0) [controls] 1fr [cmd] minmax(100px, 0);
    grid-auto-flow: row;
    column-gap: 16px;
    row-gap: 32px;
    `;

const Label = styled.div`
    grid-column: labels;
    grid-row: auto;
    padding-top: 8px;
`;

const Control = styled.div`
    grid-column: controls;
    grid-row: auto;
    padding: 8px;
`;

const Command = styled.div`
    grid-column: cmd;
    grid-row: auto;
`;

const TEXT_DEPT = '診療科目';
const TEXT_TIME_SCHEDULE = '診療時間';

const EnhancedHyobo = withDisplayNull(Hyobo);
export default EnhancedHyobo;
