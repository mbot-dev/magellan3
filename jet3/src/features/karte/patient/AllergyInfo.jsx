import styled from "styled-components";
import { useKarteState } from "../karteState";

const AllergyInfo = ({ patient }) => {
    const { allergy_list } = useKarteState()[0];

    return allergy_list && (
        <Layout>
            <span>{TEXT_ALLERGY}</span>
            {
                allergy_list.length > 0 &&
                <table className="w3-table">
                    <tbody>
                        {
                            allergy_list.map(entry => {
                                const { id, substance, severity } = entry;
                                return (
                                    <tr key={id}>
                                        <MyTd>{substance}</MyTd>
                                        <MyTd>{severity}</MyTd>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            }
            {
                allergy_list.length === 0 &&
                <span>{TEXT_NOT_REGISTERED}</span>
            }
        </Layout>
    );
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
`;

const MyTd = styled.td`
    padding: 4px 8px !important;
`;

const TEXT_ALLERGY = 'アレルギー';
const TEXT_NOT_REGISTERED = '登録されていません';

export default AllergyInfo;
