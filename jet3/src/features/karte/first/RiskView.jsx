import { useKarteState } from '../karteState';
import { useAttributes } from '../../../hook/useAttributes';
import styled from 'styled-components';

const RiskView = ({ spec, riskList }) => {
    const karteDispatch = useKarteState()[1];
    const [title, entity, attributes] = useAttributes(spec);

    const handleEdit = () => {
        karteDispatch({ type: 'setRiskToEdit', payload: { entity: entity } });
    };

    // [] is true 
    return attributes && riskList && (
        <Layout>
            <Label>
                <span>{title}</span>
            </Label>
            <Control>
                <table className='w3-table w3-border'>
                    <ClickableTh onClick={handleEdit}>
                        <tr>
                            {
                                attributes.map((attr, index) => {
                                    return <th key={index}>{attr.label}</th>;
                                })
                            }
                        </tr>
                    </ClickableTh>
                    <tbody>
                        {
                            riskList.length === 0 && 
                            <tr span={attributes.length}>
                                <td>{TEXT_NO_DATA}</td>
                            </tr>
                        }
                        {
                            riskList.length > 0 &&
                            riskList.map((entry) => {
                                return (
                                    <tr key={entry.id}>
                                        {
                                            attributes.map((attr) => {
                                                const key = attr.key;
                                                return <td key={key}>{entry[key] ?? ''}</td>;
                                            })
                                        }
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </Control>
        </Layout>
    );
};

const Layout = styled.div`
    width: 100%;
    height: 100%;
    padding: 0 16px 0 0;
    display: grid;
    grid-template-columns: [labels] minmax(100px, 0) [controls] 1fr;
    grid-auto-flow: row;
    align-items: start;
    column-gap: 16px;
    overflow: hidden;
`;

const Label = styled.div`
    grid-column: labels;
    grid-row: auto;  /* auto places the element in the next available row */
    padding-top: 8px;
`;

const Control = styled.div`
    grid-column: controls;
    grid-row: auto;
`;

const ClickableTh = styled.thead`
    cursor: pointer;
    &:hover {
        background-color: var(--surface);
        border-bottom: 1px solid #ddd;
    }
`;

const TEXT_NO_DATA = '登録されていません';

export default RiskView;

