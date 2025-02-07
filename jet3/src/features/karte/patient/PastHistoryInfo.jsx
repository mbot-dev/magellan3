import { useKarteState } from "../karteState";
import styled from "styled-components";

const PastHistoryInfo = ({ patient }) => {
    const { past_history_list } = useKarteState()[0];

    return past_history_list && (
        <Layout>
            <span>{TEXT_PAST_HISTORY}</span>
            {
                past_history_list.length > 0 &&
                <table className="w3-table">
                    <tbody>
                        {
                            past_history_list.map(entry => {
                                const { id, timeExpression, eventExpression } = entry;
                                return (
                                    <tr key={id}>
                                        <MyTd>{eventExpression}</MyTd>
                                        <MyTd>{timeExpression}</MyTd>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            }
            {
                past_history_list.length === 0 &&
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

const TEXT_PAST_HISTORY = '既往歴';
const TEXT_NOT_REGISTERED = '登録されていません';

export default PastHistoryInfo;
