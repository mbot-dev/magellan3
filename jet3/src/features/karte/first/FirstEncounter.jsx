import { useEffect, useState } from "react";
import styled from "styled-components";
import { useKarteState } from "../karteState";
import RiskView from "./RiskView";
import EntryBox from "./EntryBox";
import { ENTITY_SPEC_ALLERGY, ENTITY_SPEC_BLOOD_TYPE, ENTITY_SPEC_CHILDHOOD, ENTITY_SPEC_FAMILIY_HISTORY, ENTITY_SPEC_INFECTION, ENTITY_SPEC_LIFE_STYLE, ENTITY_SPEC_PAST_HISTORY, ENTITY_SPEC_VACCINATION, FIRST_ENCOUNTER_ENTRIES } from "./firstSpec";
import RiskAddEditor from "./RiskAdd";
import withDisplayNull from "../../../aux/withDisplayNull";
import { useStateValue } from "../../../reducers/state";
import { currFacility } from "../../../models/karteCtx";
import { getEntities } from "../../../io/riskIO";
import SmallClickDropdown from "../../../cmp/SmallClickDropdown";

const RISK_DATA_MENUS = [
    { index: 0, name: 'アレルギー' },
    { index: 1, name: '感染症' },
    { name: '-' },
    { index: 2, name: '既往歴' },
    { index: 3, name: '家族歴' },
    { name: '-' },
    { index: 4, name: '予防接種' },
    { index: 5, name: '出生時情報' },
    { name: '-' },
    { index: 6, name: '血液型' },
    { index: 7, name: '生活習慣' }
];

const FirstEncounter = ({ show, patient }) => {
    const [{ user }, dispatch] = useStateValue();
    const [{ allergy_list, infection_list, past_history_list, family_history_list, vaccination_list,
        childhood_list, blood_type_list, life_style_list, riskToEdit }, karteDispatch] = useKarteState();
    const [firstData, setFirstData] = useState([]);
    const [risk, setRisk] = useState(-1);

    useEffect(() => {
        if (!patient || !user) {
            return;
        }
        const arr = FIRST_ENCOUNTER_ENTRIES.filter(x => x.default === undefined);
        const fc_id = currFacility(user).id;
        const pt_id = patient.id;
        const promises = arr.map((entry) => {
            return getEntities(entry.entity, fc_id, pt_id);
        });
        Promise.all(promises).then((res) => {
            res.forEach((list, i) => {
                if (list?.length > 0) {
                    const entity = arr[i].entity;
                    karteDispatch({ type: 'setRiskList', payload: { entity, list, } });
                }
            });
        }).catch(err => {
            dispatch({ type: 'setError', payload: err });
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patient, user, karteDispatch]);

    useEffect(() => {
        const arr = [];
        FIRST_ENCOUNTER_ENTRIES.filter(x => x.default).forEach((entry) => {
            arr.push({ entity: entry.entity, title: entry.label });
        });
        FIRST_ENCOUNTER_ENTRIES.filter(x => x.default === undefined).forEach((entry) => {
            const test = `${entry.entity}_list`;
            if (test && test.length > 0) {
                arr.push({ entity: entry.entity, title: entry.label });
            }
        });
        setFirstData(arr);

    }, [infection_list, family_history_list, vaccination_list, childhood_list, blood_type_list, life_style_list]);

    const handleSelectRisk = (item) => {
        setRisk(item.index);
    };

    const handleAddClose = () => {
        setRisk(-1);
    };

    return firstData && (
        <Layout>
            <CommandBar>
                <SmallClickDropdown
                    padding='small'
                    round="default"
                    options={RISK_DATA_MENUS}
                    onSelect={handleSelectRisk}
                    labelGetter='name'
                    title='+ 追加'
                    disabled={false}
                />
            </CommandBar>
            <Contents>
                {
                    firstData.map((item, i) => {
                        const entity = item.entity;
                        const key = entity;
                        let riskList;
                        let spec;
                        if (entity === 'allergy') {
                            spec = ENTITY_SPEC_ALLERGY;
                            riskList = allergy_list;
                        } 
                        else if (entity === 'infection') {
                            spec = ENTITY_SPEC_INFECTION;
                            riskList = infection_list;
                        } 
                        else if (entity === 'past_history') {
                            spec = ENTITY_SPEC_PAST_HISTORY;
                            riskList = past_history_list;
                        } 
                        else if (entity === 'family_history') {
                            spec = ENTITY_SPEC_FAMILIY_HISTORY;
                            riskList = family_history_list;
                        }
                        else if (entity === 'vaccination') {
                            spec = ENTITY_SPEC_VACCINATION;
                            riskList = vaccination_list;
                        }
                        else if (entity === 'childhood') {
                            spec = ENTITY_SPEC_CHILDHOOD;
                            riskList = childhood_list;
                        }
                        else if (entity === 'blood_type') {
                            spec = ENTITY_SPEC_BLOOD_TYPE;
                            riskList = blood_type_list;
                        }
                        else if (entity === 'life_style') {
                            spec = ENTITY_SPEC_LIFE_STYLE;
                            riskList = life_style_list;
                        }
                        return <Data><RiskView key={key} patient={patient} spec={spec} riskList={riskList} /></Data>;
                    })
                }
            </Contents>
            {
                riskToEdit && riskToEdit.entity === 'allergy' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_ALLERGY} riskList={allergy_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'infection' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_INFECTION} riskList={infection_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'past_history' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_PAST_HISTORY} riskList={past_history_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'family_history' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_FAMILIY_HISTORY} riskList={family_history_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'vaccination' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_VACCINATION} riskList={vaccination_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'childhood' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_CHILDHOOD} riskList={childhood_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'blood_type' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_BLOOD_TYPE} riskList={blood_type_list} />
            }
            {
                riskToEdit && riskToEdit.entity === 'life_style' &&
                <EntryBox patient={patient} spec={ENTITY_SPEC_LIFE_STYLE} riskList={life_style_list} />
            }
            {risk === 0 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_ALLERGY} onAddCancel={handleAddClose} />}
            {risk === 1 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_INFECTION} onAddCancel={handleAddClose} />}
            {risk === 2 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_PAST_HISTORY} onAddCancel={handleAddClose} />}
            {risk === 3 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_FAMILIY_HISTORY} onAddCancel={handleAddClose} />}
            {risk === 4 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_VACCINATION} onAddCancel={handleAddClose} />}
            {risk === 5 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_CHILDHOOD} onAddCancel={handleAddClose} />}
            {risk === 6 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_BLOOD_TYPE} onAddCancel={handleAddClose} />}
            {risk === 7 && <RiskAddEditor patient={patient} spec={ENTITY_SPEC_LIFE_STYLE} onAddCancel={handleAddClose} />}
        </Layout>
    );
};

const Layout = styled.div`
    width: 100%;
    height: 100%;
    max-height: calc(100vh - 180px);
    padding: 0 16px;
    overflow-y: auto;
`;

const CommandBar = styled.div`
    display: flex;
    justify-content: flex-start;
    padding: 2px 0;
`;

const Contents = styled.div`
    width: 90%;
    height: 100%;
    padding-top: 16px;
    display: grid;
    grid-template-columns: [data] minmax(0, 1fr);
    grid-auto-flow: row;
    row-gap: 32px;
`;

const Data = styled.div`
    grid-column: data;
    grid-row: auto;
`;  

const EnhancedFirstEncounter = withDisplayNull(FirstEncounter);
export default EnhancedFirstEncounter;
