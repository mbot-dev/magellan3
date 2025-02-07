import { useState, useEffect } from 'react';
import dateFormat from "dateformat";
import { getValue } from "../../../aux/FormUtil";
import { GridColumn12, GridItem, rowAt, FULL, QUARTER, THREE_QUARTER, HALF, LABEL_MARGIN } from '../../../aux/commonStyles';

const trimTime = dt => {
    return dt ? dt.split('T')[0] : DataTransferItemList;
};

const LetterForm = ({ doc, isValid }) => {
    const [issuedAt, setIssuedAt] = useState(dateFormat(new Date(), 'isoDate'));
    const [referralFacility, setReferralFacility] = useState('');
    const [referralDept, setReferralDept] = useState('');
    const [referralDoctor, setReferralDoctor] = useState('');
    const [disease, setDisease] = useState('');
    const [purpose, setPurpose] = useState('');
    const [notes, setNotes] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (doc) {
            setIssuedAt(trimTime(doc.issuedAt));
            setReferralFacility(doc.referralFacility);
            setReferralDept(doc.referralDept);
            setReferralDoctor(doc.referralDoctor);
            setDisease(doc.disease);
            setPurpose(doc.purpose);
            setNotes(doc.notes);
            setRemarks(doc.remarks);
        }

    }, [doc]);

    const validate = () => {
        let ok = (issuedAt);
        ok = ok && referralFacility;
        ok = ok && disease;
        ok = ok && purpose;
        ok = ok && notes;
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
    };

    const handleDoctor = e => {
        const value = getValue(e);
        doc.referralDoctor = value;
        setReferralDoctor(value);
    };

    const handleDisease = e => {
        const value = getValue(e);
        doc.disease = value;
        setDisease(value);
        validate();
    };

    const handlePurpose = e => {
        const value = getValue(e);
        doc.purpose = value;
        setPurpose(value);
        validate();
    };

    const handleNotes = e => {
        const value = getValue(e);
        doc.notes = value;
        setNotes(value);
        validate();
    };

    const handleRemarks = e => {
        const value = getValue(e);
        doc.remarks = value;
        setRemarks(value);
    };

    return (
        <div>
            <form className='w3-panel w3-padding-large'>
                <GridColumn12 rowGap='16px'>

                    <GridItem grid={rowAt(1, 1, FULL)}>
                        <span>診療情報提供書フォーム</span>
                    </GridItem>

                    <GridItem grid={rowAt(2, 1, QUARTER)}>
                        <label>日付</label>
                    </GridItem>
                    <GridItem grid={rowAt(2, QUARTER+1, QUARTER)}>
                        <input
                            type="date"
                            className='w3-input w3-border w3-round'
                            value={issuedAt}
                            onChange={handleDayChange}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(3, 1, QUARTER)}>
                        <label>紹介先病院</label>
                    </GridItem>
                    <GridItem grid={rowAt(3, QUARTER+1, THREE_QUARTER)}>
                        <input
                            className="w3-input w3-border w3-round"
                            type="text"
                            value={referralFacility}
                            onChange={handleFacility}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(4, 1, QUARTER)}>
                        <label>紹介先診療科</label>
                    </GridItem>
                    <GridItem grid={rowAt(4, QUARTER+1, THREE_QUARTER)}>
                        <input
                            className="w3-input w3-border w3-round"
                            type="text"
                            value={referralDept}
                            onChange={handleDept}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(5, 1, QUARTER)}>
                        <label>紹介先医師</label>
                    </GridItem>
                    <GridItem grid={rowAt(5, QUARTER+1, QUARTER)}>
                        <input
                            className="w3-input w3-border w3-round"
                            type="text"
                            value={referralDoctor}
                            onChange={handleDoctor}
                        />
                    </GridItem>
                    <GridItem grid={rowAt(5, HALF+1, HALF)}>
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

                    <GridItem grid={rowAt(6, 1, QUARTER)}>
                        <label>傷病名</label>
                    </GridItem>
                    <GridItem grid={rowAt(6, QUARTER+1, THREE_QUARTER)}>
                        <input
                            className="w3-input w3-border w3-round"
                            onChange={handleDisease}
                            value={disease}
                            type="text"
                        />
                    </GridItem>

                    <GridItem grid={rowAt(7, 1, QUARTER)}>
                        <label>紹介目的</label>
                    </GridItem>
                    <GridItem grid={rowAt(7, QUARTER+1, THREE_QUARTER)}>
                        <input
                            className="w3-input w3-border w3-round"
                            value={purpose}
                            onChange={handlePurpose}
                            type="text"
                        />
                    </GridItem>

                    <GridItem grid={rowAt(8, 1, FULL)}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px'}}>
                            <label>既往歴・家族歴・症状経過・検査結果・治療経過・現在の処方</label>
                            <textarea
                                className='w3-padding-small'
                                rows={15}
                                value={notes}
                                onChange={handleNotes}
                            />
                        </div>
                    </GridItem>

                    <GridItem grid={rowAt(9, 1, FULL)}>
                        <label>備考</label>
                        <input
                            type="text"
                            className="w3-input w3-border w3-round"
                            value={remarks}
                            onChange={handleRemarks}
                        />
                    </GridItem>

                </GridColumn12>
            </form>
        </div>
    );
};

export default LetterForm;
