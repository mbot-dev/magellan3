import dateFormat from 'dateformat';
import withDisplayBlock from '../../../aux/withDisplayBlock';
import {useKarteState} from "../karteState";

const ENTRY_FORMAT = 'yyyy-mm-dd';

const getDocType = (docType) => {
    if (docType === 'letter') {
        return '診療情報提供書';
    }
    if (docType === 'reply') {
        return '返書';
    }
    if (docType === 'certification') {
        return '診断書';
    }
};

const DocumentEntries = ({patient}) => {
    const {documentList} = useKarteState()[0];

    return (
        <div className='w3-panel'>
            <table className='w3-table w3-border w3-hoverable' style={{cursor: 'pointer'}}>
                <tbody>
                <tr className='w3-light-grey w3-padding-small w3-border-bottom'>
                    <th colSpan={3}>文書履歴</th>
                </tr>
                {
                    documentList.map((entry, index) => {
                        return (
                            <tr key={entry.id} data-item={index}>
                                <td>{dateFormat(entry.issuedAt, ENTRY_FORMAT)}</td>
                                <td>{getDocType(entry.docType)}</td>
                                <td>{entry.docType !== 'certification' ? entry.referralFacility : entry.disease}</td>
                            </tr>
                        );
                    })
                }
                </tbody>
            </table>
        </div>
    );
};

const DocumentEntriesWithDisplayBlock = withDisplayBlock(DocumentEntries);
export default DocumentEntriesWithDisplayBlock;
