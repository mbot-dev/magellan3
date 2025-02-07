import dateFormat from 'dateformat';
import {ISSUED_FORMAT, CenterText, TitleText,
    RightText, ColumnText, EndText, MarginTop, BorderBox, Notes} from "./letterStyle";

const HTMLReply = ({reply}) => {
    const {
        issuedAt, referralFacility, referralDept, referralDoctor,
        facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        patientVisitedAt, objectiveNotes
    } = reply;
    const issued = dateFormat(issuedAt, ISSUED_FORMAT);
    let visitedStr;
    visitedStr = patientVisitedAt ? dateFormat(patientVisitedAt, ISSUED_FORMAT) : null;

    const title = '診療情報提供書（返書）';
    const greetings = visitedStr
        ? `ご紹介いただきました患者様、{visitedStr} に受診され、下記の通り診断いたしました。`
        : 'ご紹介いただきました患者様、来院され、下記の通り診断いたしました。';

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
                        <span>氏名: {ptFullName}（{ptKana}）　生年月日: {ptDob}　性別: {ptGender}</span>
                        <span>住所: {ptZipCode} {ptAddress}　電話: {ptTelephone}</span>
                    </ColumnText>
                </MarginTop>
            </MarginTop>

            <Notes>
                <span>所見等</span>
                <BorderBox>
                    <p>{objectiveNotes}</p>
                </BorderBox>
            </Notes>

        </div>
    );
};

export default HTMLReply;
