import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useStateValue } from '../../reducers/state';
import CloseButton from '../../cmp/CloseButton';
import HoverInfo from '../../cmp/HoverInfo';
import { unlockVisit } from '../../io/pvtIO';
import { currFacility } from '../../models/karteCtx';

const useDisabled = (appStatus) => {
    const [disabled, setDisabled] = useState(true);
    useEffect(() => {
        setDisabled(appStatus !== 'login');

    }, [appStatus]);
    return disabled;
};

const AccountingTab = () => {
    const [{ appStatus, accountingList, currentAccounting, dirtyList, user }, dispatch] = useStateValue();
    const disabled = useDisabled(appStatus);

    const handleChangeKarte = pt => {
        if (!disabled) {
            dispatch({ type: 'changeAccounting', patient: pt });
        }
    };

    const handleCloseKarte = pt => {
        dispatch({ type: 'closeAccounting', patient: pt });
        const pvtId = pt?.visit?.id ?? null;
        if (!pvtId) {
            return;
        }
        const asyncClose = async (fc_id, pvt_id) => {
            try {
                await unlockVisit(fc_id, pvt_id);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const facilityId = currFacility(user).id;
        asyncClose(facilityId, pvtId);
    };

    return (
        <div className='z3-flex'>
            {
                accountingList.map((patient, index) => {
                    const { ptId, fullName } = patient;
                    const disabled = dirtyList.find(x => x === ptId);
                    const selected = ptId === currentAccounting.ptId;
                    return (
                        <PatientTab
                            className={selected ? 'z3-background z3-border-bottom-secondary w3-hover-light-gray' : 'z3-background z3-border-bottom-surface w3-hover-light-gray'}
                            key={ptId}
                        >
                            <NameText
                                data-index={index}
                                onClick={() => handleChangeKarte(patient)}
                                >
                                {fullName}
                            </NameText>
                            {
                                disabled && 
                                <HoverInfo messages={['編集中']} width='max-content'>
                                    <CloseButton
                                        selected={selected}
                                        disabled={disabled}
                                        onClick={() => handleCloseKarte(patient)}
                                    />
                                </HoverInfo>
                            }
                            {
                                !disabled &&
                                <CloseButton
                                    theme={selected ? 'z3-primary' : 'z3-background'}
                                    disabled={disabled}
                                    onClick={() => handleCloseKarte(patient)}
                                />
                            }
                        </PatientTab>
                    );
                })
            }
        </div>
    );
};

const PatientTab = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 12px;
    padding: 6px 8px 6px 16px;
`;

const NameText = styled.span`
    flex: 0 0 auto;
    cursor: pointer;
`;

export default AccountingTab;
