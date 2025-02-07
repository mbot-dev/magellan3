import dateFormat from 'dateformat';

const df = 'yyyy\'年\'m\'月\'d\'日\'';

const style = `
    @page{size:A4;margin:0;}
    @media print and (min-resolution: 300dpi) {
        body{font:11pt sans-serif;line-height:1.4;background:#fff !important;color:#000;-webkit-font-smoothing:antialiased !important;}
        .a4{padding:25mm 25mm 25mm 25mm;}
        .title{font-size:14pt;}
        .center{text-align:center;}
        .right{text-align:right;}
        .margin-top-10{margin-top:10mm;}
        .margin-top-2{margin-top:2mm;}
        .notes{margin-top:2mm;min-height:30%;}
        .border-box{border:1px solid #d1d1d1;}
        .padding-2{padding-left:2mm;padding-right:2mm;}
        .flex-column{display:flex;flex-direction:column;}
        .flex-end{display:flex;justify-content:flex-end;}
    }
`;

const viewStyle = `
    .title{font-size:16pt;}
    .center{text-align:center;}
    .right{text-align:right;}
    .margin-top{margin-top:16px;}
    .margin-top-small{margin-top:8px;}
    .notes{margin-top:6mm;min-height:30%;}
    .border-box{border:1px solid #d1d1d1;padding-left:4px;padding-right:4px;}
    .flex-column{display:flex;flex-direction:column;}
    .flex-end{display:flex;justify-content:flex-end;}
`;

export const letterHTML = (letter, printing=true) => {
    const {
        issuedAt, referralFacility, referralDept, referralDoctor,
        facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        disease, purpose, notes, remarks
    } = letter;
    const htmlNotes = notes.replace(/\n/g, '<br/>');
    const title = '診療情報提供書';
    const issued = dateFormat(issuedAt, df);
    const greetings = '下記の患者さんを紹介いたします。ご高診のほどよろしくお願い申し上げます。';

    const css = printing ? style : viewStyle;
    const page = printing ? 'a4' : '';

    return `
    <!DOCTYPE html>
    <html lang="jp">
    <head>
        <title>${title}</title>
        <meta charset="utf-8"/>
        <style>${css}</style>
    </head>
    <body>
        <div class=${page}>
            <div class="center">
                <p class="title">${title}</p>
            </div>
            <div class="right">
                <p>${issued}</p>
            </div>
            <div class="flex-column">
                <span>${referralFacility}</span>
                <span>${referralDept}</span>
                <span>${referralDoctor}</span>
            </div>
            <div class="flex-end">
                <div class="flex-column">
                    <span>${facility}</span>
                    <span>${zipCode} ${address}</span>
                    <span>電話: ${telephone}　FAX: ${fax}</span>
                    <span>${phyFullName}</span>
                </div>
            </div>
            <div class="margin-top-10">
                <span>${greetings}</span>
            </div>    
            <div class="margin-top-10">
                <div class="flex-column">
                    <span>氏名: ${ptFullName}（${ptKana}）　生年月日: ${ptDob}　性別: ${ptGender}</span>
                    <span>住所: ${ptZipCode} ${ptAddress}　電話: ${ptTelephone}</span>
                </div>
            </div>
            <div class="margin-top-10">
                <p>傷病名: ${disease}</p>
                <p>紹介目的: ${purpose}</p>
            </div>
            <div class="notes">
                <span>既往歴・家族歴・症状経過・検査結果・治療経過・現在の処方</span>
                <div class="border-box">
                    <p class="padding-2">${htmlNotes}</p>
                </div>
            </div>    
            <div class="margin-top-2">
                <span>備考</span>
                <p>${remarks}</p>
            </div>    
        </div>
    </body>
    </html>            
    `;
};

export const replyHTML = (reply, printing=true) => {
    const {
        issuedAt, referralFacility, referralDept, referralDoctor,
        facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        patientVisitedAt, objectiveNotes
    } = reply;
    const htmlNotes = objectiveNotes.replace(/\n/g, '<br/>');
    const issued = dateFormat(issuedAt, df);
    let visitedStr;
    visitedStr = patientVisitedAt ? dateFormat(patientVisitedAt, df) : null;

    const title = '診療情報提供書（返書）';
    const greetings = visitedStr
        ? `ご紹介いただきました患者様、${visitedStr} に受診され、下記の通り診断しました。`
        : 'ご紹介いただきました患者様、来院され、下記の通り診断しました。';

    const css = printing ? style : viewStyle;
    const page = printing ? 'a4' : '';

    return `
    <!DOCTYPE html>
    <html lang="jp">
    <head>
        <title>${title}</title>
        <meta charset="utf-8"/>
        <style>${css}</style>
    </head>
    <body>
        <div class=${page}>
            <div class="center">
                <p class="title">${title}</p>
            </div>
            <div class="right"><p>${issued}</p></div>
            <div class="flex-column">
                <span>${referralFacility}</span>
                <span>${referralDept}</span>
                <span>${referralDoctor}</span>
            </div>
            <div class="flex-end">
                <div class="flex-column">
                    <span>${facility}</span>
                    <span>${zipCode} ${address}</span>
                    <span>電話: ${telephone}　FAX: ${fax}</span>
                    <span>${phyFullName}</span>
                </div>
            </div>
            <div class="margin-top">
                <span>${greetings}</span>
            </div>    
            <div class="margin-top">
                <div class="flex-column">
                    <span>氏名: ${ptFullName}（${ptKana}）　生年月日: ${ptDob}　性別: ${ptGender}</span>
                    <span>住所: ${ptZipCode} ${ptAddress}　電話: ${ptTelephone}</span>
                </div>
            </div>
            <div class="notes">
                <span>所見等</span>
                <div class="border-box">
                    <p>${htmlNotes}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const certificateHTML = (certificate, printing=true) => {
    const {
        issuedAt, facility, zipCode, address, telephone, fax, phyFullName,
        ptFullName, ptKana, ptGender, ptDob, ptZipCode, ptAddress, ptTelephone,
        disease, notes
    } = certificate;
    const htmlNotes = notes.replace(/\n/g, '<br/>');
    const title = '診断書';
    const issued = dateFormat(issuedAt, df);
    const greetings = `上記の通り診断する。`;

    const css = printing ? style : viewStyle;
    const page = printing ? 'a4' : '';

    return `
    <!DOCTYPE html>
    <html lang="jp">
    <head>
        <title>${title}</title>
        <meta charset="utf-8"/>
        <style>${css}</style>
    </head>
    <body>
        <div class=${page}>
            <div class="center">
                <p class="title">${title}</p>
            </div>
            <div class="right">
                <p>${issued}</p>
            </div>
            <div class="margin-top"/>
            <div class="margin-top">
                <div class="flex-column">
                    <span>氏名: ${ptFullName}（${ptKana}）　生年月日: ${ptDob}　性別: ${ptGender}</span>
                    <span>住所: ${ptZipCode} ${ptAddress}　電話: ${ptTelephone}</span>
                </div>
            </div>
            <div class="margin-top-small">
                <p>傷病名: ${disease}</p>
            </div>
            <div class="notes">
                <span>付記</span>
                <div class="border-box">
                    <p>${htmlNotes}</p>
                </div>
            </div>
            <div class="margin-top">
                <span>${greetings}</span>
            </div>
            <div class="flex-end">
                <div class="flex-column">
                    <span>${facility}</span>
                    <span>${zipCode} ${address}</span>
                    <span>電話: ${telephone}　FAX: ${fax}</span>
                    <span>${phyFullName}</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};
