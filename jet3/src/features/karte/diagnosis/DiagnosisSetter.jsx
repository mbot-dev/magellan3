import { useState, useEffect } from 'react';
import dateFormat from 'dateformat';
import hash from 'object-hash';
import withDisplayNull from "../../../aux/withDisplayNull";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import { fromNow } from "../../../util/dt2";
import { GridColumn12, GridItem, rowAt } from '../../../aux/commonStyles';
import { ADD_TEXT, EDIT_TEXT, SAVE_TEXT, getValue } from '../../../aux/FormUtil';
import { CATEGORY_TEXT, DIAGNOSIS_DATE_DISPLAY, DIED, DISEASE_TEXT, FULLY_RECOVERED, MAIN_DIAGNOSIS, ONSET_TEXT, OUTCOME_TEXT, PAUSED, REMISSION_TEXT, SUSPECTED_DIAGNOSIS } from './Dignosis';
import CustomSelect from '../../../cmp/CustomSelect';

const EMPTY_VALUE = '　';

const DiagnosisSetter = ({ diagnosisToEdit, onCancel, onEditEnd }) => {
    const [name, setName] = useState('');
    const [from, setFrom] = useState('');
    const [base, setBase] = useState(2);  // [name, icd1012
    const [diagnosisCategory, setDiagnosisCategory] = useState('');
    const [outcome, setOutcome] = useState('');
    const [dateOfOnset, setDateOfOnset] = useState('');  // date  ''->clear
    const [dateOfRemission, setDateOfRemission] = useState('');  // date
    const [okText, setOkTitle] = useState('');
    const [isFilled, setFilled] = useState(false);
    const [oldHash, setOldHash] = useState('');
    const [newHash, setNewHash] = useState('');

    useEffect(() => {
        if (!diagnosisToEdit) {
            return;
        }
        const { icd1012, name, diagnosisCategory, outcome, dateOfOnset, dateOfRemission } = diagnosisToEdit;
        setName(icd1012 ? `${name}（${icd1012}）` : name);
        setDiagnosisCategory(diagnosisCategory);
        setOutcome(outcome);
        let dOn = '';
        let dRem = '';
        if (dateOfOnset) {
            const frmNow = fromNow(dateOfOnset);
            setFrom(frmNow);
            setBase(3);
            dOn = dateFormat(new Date(dateOfOnset), DIAGNOSIS_DATE_DISPLAY);
            setDateOfOnset(dOn);
        } 
        if (dateOfRemission) {
            dRem = dateFormat(new Date(dateOfRemission), DIAGNOSIS_DATE_DISPLAY);
            setDateOfRemission(dRem);
        }
        setOkTitle(diagnosisToEdit.id ? SAVE_TEXT : ADD_TEXT);
        const h = hash({
            dateOfOnset: dOn,
            diagnosisCategory,
            outcome,
            dateOfRemission: dRem,
        });
        setOldHash(h);
        setNewHash(h);
        
    }, [diagnosisToEdit]);

    useEffect(() => {
        let ok = outcome && dateOfRemission;
        ok = ok || (dateOfOnset);
        setFilled(ok);
        const h = hash({
            dateOfOnset,
            diagnosisCategory,
            outcome,
            dateOfRemission,
        });
        setNewHash(h);

    }, [dateOfOnset, diagnosisCategory, outcome, dateOfRemission]);

    const handleCategoryChange = item => {
        const value = item.label;
        if (value === EMPTY_VALUE) {
            setDiagnosisCategory('');
        } else {
            setDiagnosisCategory(value);
        }
    };

    const handleOutcomeChange = item => {
        const value = item.label;
        if (value === EMPTY_VALUE) {
            setOutcome('');
            setDateOfRemission('');
            return;
        }
        setOutcome(value);
        const dr = dateFormat(new Date(), DIAGNOSIS_DATE_DISPLAY);
        setDateOfRemission(dr);
    };

    const getCategoryIndex = () => {
        if (diagnosisCategory === EMPTY_VALUE) {
            return 0;
        }
        if (diagnosisCategory === MAIN_DIAGNOSIS) {
            return 1;
        }
        if (diagnosisCategory === SUSPECTED_DIAGNOSIS) {
            return 2;
        }
        return -1;
    };

    const getOutcomeIndex = () => {
        if (outcome === EMPTY_VALUE) {
            return 0;
        }
        if (outcome === FULLY_RECOVERED) {
            return 1;
        }
        if (outcome === PAUSED) {
            return 2;
        } 
        if (outcome === DIED) {
            return 3;
        } 
        return -1;
    };

    const handleOnsetChange = e => {
        const d = getValue(e);
        if (d) {
            const str = dateFormat(d, DIAGNOSIS_DATE_DISPLAY);
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const s = now.getSeconds();
            setDateOfOnset(d);
            const frmNow = fromNow(`${str} ${h}:${m}:${s}`);
            setFrom(frmNow);
            setBase(3);
        }
    };

    const handleRemissionChange = e => {
        const d = getValue(e);
        setDateOfRemission(d);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleSubmit = () => {
        const edited = {
            diagnosisCategory,
            outcome,
            dateOfOnset: dateOfOnset ? dateFormat(dateOfOnset, 'isoDateTime') : '',     // +09:00
            dateOfRemission: dateOfRemission ? dateFormat(dateOfRemission, 'isoDateTime') : '',
        };
        const d = { ...diagnosisToEdit, ...edited };
        onEditEnd(d);
    };

    return (
        <ModalEditorLarge
            id='diagnosis_setter'   
            title={`${DISEASE_TEXT}${EDIT_TEXT}`}
            okText={okText}
            okEnabled={newHash !== oldHash && isFilled}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <GridColumn12 rowGap='16px'>

                <GridItem grid={rowAt(1, 1, 3)}>
                    <span>{DISEASE_TEXT}</span>
                </GridItem>
                <GridItem grid={rowAt(1, 4, 9)}>
                    <span>{name}</span>
                </GridItem>
                {
                    fromNow && (
                        <GridItem grid={rowAt(2, 4, 9)}>
                            <span>{from}</span>
                        </GridItem>
                    )
                }

                <GridItem grid={rowAt(base, 1, 3)}>
                    <span>{CATEGORY_TEXT}</span>
                </GridItem>
                <GridItem grid={rowAt(base, 4, 9)}>
                    <CustomSelect
                        options={[{label: '　'}, {label: MAIN_DIAGNOSIS}, {label: SUSPECTED_DIAGNOSIS}]}
                        labelGetter='label'
                        valueGetter='label'
                        startIndex={getCategoryIndex()}
                        onSelect={handleCategoryChange}
                    />
                </GridItem>

                <GridItem grid={rowAt(base+1, 1, 3)}>
                    <span>{OUTCOME_TEXT}</span>
                </GridItem>
                <GridItem grid={rowAt(base+1, 4, 9)}>
                    <CustomSelect
                        options={[{label: '　'}, {label: FULLY_RECOVERED}, {label: PAUSED}, {label: DIED}]}
                        labelGetter='label'
                        valueGetter='label'
                        startIndex={getOutcomeIndex()}
                        onSelect={handleOutcomeChange}
                    />
                </GridItem>

                <GridItem grid={rowAt(base+2, 1, 3)}>
                    <span>{ONSET_TEXT}</span>
                </GridItem>
                <GridItem grid={rowAt(base+2, 4, 9)}>
                    <input
                        type="date"
                        className='w3-input w3-border w3-round'
                        value={dateOfOnset}
                        onChange={handleOnsetChange}
                    />
                </GridItem>

                <GridItem grid={rowAt(base+3, 1, 3)}>
                    <span>{REMISSION_TEXT}</span>
                </GridItem>
                <GridItem grid={rowAt(base+3, 4, 9)}>
                    <input
                        type="date"
                        className='w3-input w3-border w3-round'
                        value={dateOfRemission}
                        onChange={handleRemissionChange}
                    />
                </GridItem>

            </GridColumn12>
        </ModalEditorLarge>
    );
};

const EnhancedDiagnosisSetter = withDisplayNull(DiagnosisSetter);
export default EnhancedDiagnosisSetter;

