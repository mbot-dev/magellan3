import { useState, useEffect } from 'react';
import dateFormat from "dateformat";
import { getValue } from "../../../aux/FormUtil";
import { FULL, GridColumn12, GridItem, QUARTER, THREE_QUARTER, HALF, rowAt, LABEL_MARGIN } from '../../../aux/commonStyles';

const trimTime = dt => {
    return dt ? dt.split('T')[0] : dt;
};

const LetterReply = ({ doc, isValid }) => {
    const [issuedAt, setIssuedAt] = useState(dateFormat(new Date(), 'isoDate'));
    const [referralFacility, setReferralFacility] = useState('');
    const [referralDept, setReferralDept] = useState('');
    const [referralDoctor, setReferralDoctor] = useState('');
    const [objectiveNotes, setObjectiveNotes] = useState('');

    useEffect(() => {
        if (doc) {
            setIssuedAt(trimTime(doc.issuedAt));
            setReferralFacility(doc.referralFacility);
            setReferralDept(doc.referralDept);
            setReferralDoctor(doc.referralDoctor);
            setObjectiveNotes(doc.objectiveNotes);
        }
    }, [doc]);

    const validate = () => {
        let ok = (issuedAt);
        ok = ok && referralFacility;
        ok = ok && objectiveNotes;
        isValid(ok);
    };

    const handleDayChange = e => {
        const d = getValue(e);
        doc.issuedAt = d;
        setIssuedAt(d);
        validate();
    };

    const handleFacility = e => {
        const value = getValue(e);
        doc.referralFacility = value;
        setReferralFacility(value);
        validate();
    };

    const handleDept = e => {
        const value = getValue(e);
        doc.referralDept = value;
        setReferralDept(value);
        validate();
    };

    const handleDoctor = e => {
        const value = getValue(e);
        doc.referralDoctor = value;
        setReferralDoctor(value);
        validate();
    };

    const handleNotes = e => {
        const value = getValue(e);
        doc.objectiveNotes = value;
        setObjectiveNotes(value);
        validate();
    };

    return (
        <div>
            <form className='w3-panel w3-padding-large'>
                <GridColumn12 rowGap='16px'>

                    <GridItem grid={rowAt(1, 1, FULL)}>
                        <span>返書フォーム</span>
                    </GridItem>

                    <GridItem grid={rowAt(2, 1, QUARTER)}>
                        <label>日付</label>
                    </GridItem>
                    <GridItem grid={rowAt(2, QUARTER + 1, QUARTER)}>
                        <input
                            type='date'
                            className='w3-input w3-border w3-round'
                            value={issuedAt}
                            onChange={handleDayChange}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(3, 1, QUARTER)}>
                        <label>紹介元医療機関</label>
                    </GridItem>
                    <GridItem grid={rowAt(3, QUARTER + 1, THREE_QUARTER)}>
                        <input
                            type="text"
                            className="w3-input w3-border w3-round"
                            value={referralFacility}
                            onChange={handleFacility}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(4, 1, QUARTER)}>
                        <label>診療科</label>
                    </GridItem>
                    <GridItem grid={rowAt(4, QUARTER + 1, THREE_QUARTER)}>
                        <input
                            type="text"
                            className="w3-input w3-border w3-round"
                            value={referralDept}
                            onChange={handleDept}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(5, 1, QUARTER)}>
                        <label>医師</label>
                    </GridItem>
                    <GridItem grid={rowAt(5, QUARTER + 1, QUARTER)}>
                        <input
                            type="text"
                            className="w3-input w3-border w3-round"
                            value={referralDoctor}
                            onChange={handleDoctor}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(5, HALF + 1, HALF)}>
                        <div className='z3-flex' style={{'--justify': 'space-around',  '--gap': '16px'}}>
                            <label>
                                <input
                                    type='radio'
                                    className='w3-radio'
                                    style={LABEL_MARGIN}
                                />
                                先生
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    className='w3-radio'
                                    style={LABEL_MARGIN}
                                />
                                御机下
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    className='w3-radio'
                                    style={LABEL_MARGIN}
                                />
                                御侍史
                            </label>
                        </div>
                    </GridItem>

                    <GridItem grid={rowAt(6, 1, FULL)}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px'}}>
                            <label>所見等</label>
                            <textarea
                                className='w3-padding-small'
                                rows={10}
                                value={objectiveNotes}
                                onChange={handleNotes}
                            />
                        </div>
                    </GridItem>

                </GridColumn12>
            </form>
        </div>
    );
};

export default LetterReply;
