import React from 'react';
import styled from "styled-components";
import QrScan from 'react-qr-reader';
import {useStateValue} from "../reducer/state";
import withDisplayNull from './withDisplayNull';

const QRCScan = () => {
    const dispatch = useStateValue()[1];

    const handleScan = data => {
        if (!data) {
            return;
        }
        dispatch({type: 'mode', mode: 'capture', token: data});
    };

    const handleError = err => {
        console.log(err);
    };

    return (
        <ScanBox>
            <CenteringBox>
                <QrScan
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{width: '70%', borderRadius: '8px'}}
                />
            </CenteringBox>
        </ScanBox>
    )
};

const ScanBox = styled.div`
    width: 100%;
    background-color: black;
`;

const CenteringBox = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 32px;
    border-radius: 8px;
    background-color: black;
`;

export default withDisplayNull(QRCScan);
