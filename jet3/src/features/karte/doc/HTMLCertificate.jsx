import dateFormat from 'dateformat';
import {ISSUED_FORMAT, CenterText, TitleText,
    RightText, ColumnText, EndText, MarginTop, BorderBox, Notes} from "./letterStyle";

const HTMLCertificate = ({certificate}) => {
    const {
        issuedAt, facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        disease, notes
    } = certificate;
    const title = '診断書';
    const issued = dateFormat(issuedAt, ISSUED_FORMAT);
    const greetings = `上記の通り診断する。`;

    return (
        <div className='simple-a4'>

            <CenterText>
                <TitleText>{title}</TitleText>
            </CenterText>

            <RightText><p>{issued}</p></RightText>

            <MarginTop>
                <MarginTop>
                    <ColumnText>
                        <span>氏名: {ptFullName}（{ptKana}）　生年月日: {ptDob}　性別: {ptGender}</span>
                        <span>住所: {ptZipCode} {ptAddress}　電話: {ptTelephone}</span>
                    </ColumnText>
                </MarginTop>
            </MarginTop>

            <MarginTop>
                <p>傷病名: {disease}</p>
            </MarginTop>

            <Notes>
                <span>付記</span>
                <BorderBox>
                    <p>{notes}</p>
                </BorderBox>
            </Notes>

            <MarginTop>
                <span>{greetings}</span>
            </MarginTop>

            <EndText>
                <ColumnText>
                    <span>{facility}</span>
                    <span>{zipCode} {address}</span>
                    <span>電話: {telephone}　FAX: {fax}</span>
                    <span>{phyFullName}</span>
                </ColumnText>
            </EndText>

        </div>
    );
};

export default HTMLCertificate;
