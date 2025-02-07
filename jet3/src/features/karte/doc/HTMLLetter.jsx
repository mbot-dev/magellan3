import dateFormat from 'dateformat';
import {ISSUED_FORMAT, CenterText, TitleText,
    RightText, ColumnText, EndText, MarginTop, BorderBox, Notes} from "./letterStyle";

const HTMLLetter = ({letter}) => {
    const {
        issuedAt, referralFacility, referralDept, referralDoctor,
        facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        disease, purpose, notes, remarks
    } = letter;
    const title = '診療情報提供書';
    const issued = dateFormat(issuedAt, ISSUED_FORMAT);
    const greetings = '下記の患者さんを紹介いたします。ご高診のほどよろしくお願い申し上げます。';

    return (
        <div className='simple-a4'>

            <CenterText>
                <TitleText>{title}</TitleText>
            </CenterText>

            <RightText><p>{issued}</p></RightText>

            <ColumnText>
                <span>{referralFacility}</span>
                <span>{referralDept}</span>
                <span>{referralDoctor}</span>
            </ColumnText>

            <EndText>
                <ColumnText>
                    <span>{facility}</span>
                    <span>{zipCode} {address}</span>
                    <span>電話: {telephone}　FAX: {fax}</span>
                    <span>{phyFullName}</span>
                </ColumnText>
            </EndText>

            <MarginTop>
                <span>{greetings}</span>
                <MarginTop>
                    <ColumnText>
                        <span>氏名: {ptFullName}（{ptKana}）　生年月日: {ptDob} 性別 {ptGender}</span>
                        <span>住所: {ptZipCode} {ptAddress} 電話: {ptTelephone}</span>
                    </ColumnText>
                </MarginTop>
            </MarginTop>

            <MarginTop>
                <p>傷病名: {disease}</p>
            </MarginTop>

            <MarginTop>
                <p>紹介目的: {purpose}</p>
            </MarginTop>

            <Notes>
                <span>既往歴・家族歴・症状経過・検査結果・治療経過・現在の処方</span>
                <BorderBox>
                    <p>{notes}</p>
                </BorderBox>
            </Notes>

            <MarginTop>
                <span>備考</span>
                <BorderBox>
                    <p>{remarks}</p>
                </BorderBox>
            </MarginTop>

        </div>
    );
};

export default HTMLLetter;

