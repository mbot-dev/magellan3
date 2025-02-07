import { useState, useEffect } from 'react';
import dateFormat from "dateformat";
import { getValue } from "../../../aux/FormUtil";
import { GridColumn12, GridItem, rowAt, FULL, QUARTER, THREE_QUARTER } from '../../../aux/commonStyles';

const trimTime = dt => {
    return dt ? dt.split('T')[0] : DataTransferItemList;
};

const MedicalCertificateForm = ({ doc, isValid }) => {
    const [issuedAt, setIssuedAt] = useState(dateFormat(new Date(), 'isoDate'));
    const [disease, setDisease] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (doc) {
            setIssuedAt(trimTime(doc.issuedAt));
            setDisease(doc.disease);
            setNotes(doc.notes);
        }
    }, [doc]);

    const validate = () => {
        let ok = (issuedAt);
        ok = ok && disease;
        ok = ok && notes;
        isValid(ok);
    };

    const handleDayChange = e => {
        const d = getValue(e);
        doc.issuedAt = d;
        setIssuedAt(d);
        validate();
    };

    const handleDisease = e => {
        const value = getValue(e);
        doc.disease = value;
        setDisease(value);
        validate();
    };

    const handleNotes = e => {
        const value = getValue(e);
        doc.notes = value;
        setNotes(value);
        validate();
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
                    <GridItem grid={rowAt(2, QUARTER + 1, QUARTER)}>
                        <input
                            type="date"
                            className='w3-input w3-border w3-round'
                            value={issuedAt}
                            onChange={handleDayChange}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(3, 1, QUARTER)}>
                        <label>傷病名</label>
                    </GridItem>
                    <GridItem grid={rowAt(3, QUARTER + 1, THREE_QUARTER)}>
                        <input
                            type="text"
                            className="w3-input w3-border w3-round"
                            value={disease}
                            onChange={handleDisease}
                        />
                    </GridItem>

                    <GridItem grid={rowAt(4, 1, FULL)}>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px'}}>
                            <label>付記</label>
                            <textarea
                                className='w3-padding-small'
                                style={{width: '100%'}}
                                value={notes}
                                onChange={handleNotes}
                                rows={10}
                            />
                        </div>
                    </GridItem>

                </GridColumn12>

            </form>
        </div>
    );
};

export default MedicalCertificateForm;
