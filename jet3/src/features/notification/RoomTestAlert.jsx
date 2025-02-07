import { useEffect, useState } from "react";
import { useStateValue } from '../../reducers/state';
import withDisplayBlock from '../../aux/withDisplayBlock';
import { getAbnormalLabTest } from "../../io/labTestIO";

const flagColor = flg => {
    const blue = flg && flg.startsWith('L') ? 'w3-text-blue' : '';
    const red = flg && flg.startsWith('H') ? 'w3-text-red' : '';
    const purple = flg && flg !== 'N' ? 'w3-text-purple' : '';
    return (blue || red || purple || '');
};

const getSelectedRow = e => {
    return Number(e.target.parentNode.getAttribute('data-item'));
};

const RoomTestAlert = () => {
    const [{ abnormalId }, dispatch] = useStateValue();
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!abnormalId) {
            return;
        }
        const asyncGet = async (abnormalId) => {
            try {
                const tests = await getAbnormalLabTest(abnormalId);
                const newData = [...data, ...tests];
                setData(newData);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        asyncGet(abnormalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abnormalId]);

    // 受付リスト選択
    const handleSelect = e => {
        e.preventDefault();
        const row = getSelectedRow(e);
        const test = data[row];
        const { ptId } = test;
        console.log(ptId);
    };

    return (
        <div className='w3-panel'>
            <table className='w3-table w3-striped w3-hoverable'>
                <tbody>
                    {
                        data.map((test, index) => {
                            const { id, ptId, ptName, spcName, testName, testDate, resultValue, valueType, unit, lowerLimit, upperLimit, abnormalFlg } = test;
                            const value = `${resultValue}${valueType}`;
                            const testedAt = testDate.split('T')[0];
                            const color = flagColor(abnormalFlg);
                            return (
                                <tr key={id} data-item={index} onClick={handleSelect}>
                                    <td>{ptId}</td>
                                    <td>{ptName}</td>
                                    <td>{spcName}</td>
                                    <td>{testName}</td>
                                    <td><span className={color}>{value}</span></td>
                                    <td>{unit}</td>
                                    <td>{lowerLimit}</td>
                                    <td>{upperLimit}</td>
                                    <td>{testedAt}</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
    );
};

const EnhancedRoomTestAlert = withDisplayBlock(RoomTestAlert);
export default EnhancedRoomTestAlert;
