import {useState, useEffect, useRef} from 'react';
import {v4} from 'uuid';
import styled from "styled-components";
import {LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, Legend} from 'recharts';
import {useReactToPrint} from 'react-to-print';
import {useStateValue} from "../../../reducers/state";
import {deleteLabTest, getLabTestPivot} from "../../../io/labTestIO";
import {currFacility} from "../../../models/karteCtx";
import withDisplayNull from "../../../aux/withDisplayNull";
import HoverInfo from "../../../cmp/HoverInfo";
import {fromNow} from "../../../util/dt2";
import {labDateString, labValueForm, sortTestCode} from "../../../util/labUtil";
import {getSelectedRow} from "../../../aux/FormUtil";
import DaingerSelection from '../../../cmp/DaingerSelection';

const TEST_HEADER = ['検査項目', '結果値', '下限値', '上限値', '単位', '判定', '備考'];
const ATTRIBUTES = ['testName', 'resultValue', 'lowerLimit', 'upperLimit', 'unit', 'abnormalFlg', 'comment'];
const DATE_FORMAT_TO_PRINT = 'yyyy\'年\'m\'月\'d\'日\'';

const valueWithForm = item => {
    const {resultValue, valueFrom} = item;
    const arr = [];
    if (resultValue) {
        arr.push(resultValue);
    }
    if (valueFrom) {
        arr.push(labValueForm(valueFrom));
    }
    return arr.length === 2 ? arr.join(' ') : arr.join('');
};

const flagColor = flg => {
    const blue = flg && flg.startsWith('L') ? 'w3-text-blue' : '';
    const red = flg && flg.startsWith('H') ? 'w3-text-red' : '';
    const purple = flg ? 'w3-text-purple': '';
    return (blue || red || purple || '');
};

const concatComment = (item) => {
    const arr = [];
    if (item['comment1']) {
        arr.push(item['comment1']);
    }
    if (item['comment2']) {
        arr.push(item['comment2']);
    }
    if (arr.length === 0) {
        return '';
    }
    if (arr.length === 1) {
        return arr.join('');
    }
    return arr.join(' ');
};

const useT = data => {
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [result, setResult] = useState([]);

    useEffect(() => {
        if (!data) {
            setColumns([]);
            setRows([]);
            setResult([]);
        } else {
            const d = [];
            data['columns'].forEach(sd => {
                const str = labDateString(sd, 'yyyy-m-d');
                const frmNow = fromNow(str);
                d.push({
                    id: v4(),
                    value: `${str}（${frmNow}）`
                });
            });
            setColumns(d);
            data['rows'].forEach(row => {
                row.forEach(ent => {
                    ent.id = v4();
                });
            });
            setRows(data['rows']);
    
            setResult(data['resultList']);
        }

    }, [data]);

    return [columns, rows, result];
};

// 印刷 Component
const PrintComponent = ({test}) => {
    const [testDate, setTestDate] = useState('');
    const [lab, setLab] = useState('');
    const [items, setItems] = useState([]);
    useEffect(() => {
        if (!test) {
            return;
        }
        const {labName, samplingDate, testDate, testItems} = test;
        const whichDate = testDate ? testDate: samplingDate;
        setTestDate(labDateString(whichDate, DATE_FORMAT_TO_PRINT));
        setLab(labName);
        const tmp = [];
        tmp.push(...testItems);
        sortTestCode(tmp);
        setItems(tmp);

    }, [test]);

    return (
        <div className='simple-a4'>
            <div style={{display: 'flex'}}>
                <span>検査結果</span>
                <span style={{flexGrow: '1'}}/>
                <span>{testDate}</span>
                <span style={{marginLeft: '8px'}}>{lab}</span>
            </div>
            <table>
                <thead>
                    <tr>
                    {
                        TEST_HEADER.map(name => {
                            return (
                                <th key={v4()}>{name}</th>
                            );
                        })
                    }
                    </tr>
                </thead>
                <tbody>
                {
                    items.map(item => {
                        return (
                            <tr key={item.id}>
                            {
                                ATTRIBUTES.map((attr, col) => {
                                    if (attr === 'resultValue') {
                                        return (
                                            <NumberColumn key={col}>{valueWithForm(item)}</NumberColumn>
                                        );
                                    } else if (attr === 'lowerLimit' || attr === 'upperLimit') {
                                        return (
                                            <NumberColumn key={col}>{item[attr]}</NumberColumn>
                                        );
                                    } else if (attr === 'comment') {
                                        return (
                                            <td key={col} >{concatComment(item)}</td>
                                        );
                                    } else {
                                        return (
                                            <td key={col}>{item[attr]}</td>
                                        );
                                    }
                                })
                            }
                            </tr>
                        );
                    })
                }
                </tbody>
            </table>
        </div>
    );
};

const LabTestPivot = ({show, patient}) => {
    const {user, settings} = useStateValue()[0];
    const [data, setData] = useState(null);
    const [columns, rows, resultList] = useT(data);
    const [selectedColumn, setSelectedColumn] = useState(-1);
    const [testToDelete, setTestToDelete] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [chartData, setChartData] = useState([]);
    const fetched = useRef(false);
    const componentRef = useRef(undefined);

    useEffect(() => {
        let go = show;
        go = go && !fetched.current;
        if (go) {
            fetch();
        }
    }, [show]);

    useEffect(() => {
        if (selectedTest) {
            const plots = [];
            selectedTest.forEach((ent, index) => {
                if (ent.count) {
                    const test = resultList[index-1];
                    const arr = test['testItems'].filter(x => x['testCode'] === ent['testCode']).map(item => {
                        const {samplingDate, testName, resultValue, upperLimit, lowerLimit, unit} = item;
                        const value = Number(resultValue);
                        const upper = Number(upperLimit);
                        const lower = Number(lowerLimit);
                        if (!isNaN(value)) {
                            return {
                                samplingDate: samplingDate.substring(0, 'yyyy-mm-dd'.length),
                                testName,
                                value,
                                upper,
                                lower,
                                unit,
                            };
                        } else {
                            return '';
                        }
                    });
                    plots.push(arr[0]);
                }
            });
            const plotData = plots.filter(x => typeof x === 'object' && x !== null);
            setChartData(plotData);
        }
    }, [selectedTest]);

    const fetch = () => {
        const facility = currFacility(user);
        Promise.all([getLabTestPivot(facility.id, patient.ptId, 100, 0, 'desc')])
            .then(res => {
                const [result] = res;
                // debugger;
                if (result) {
                    setData(result);
                } else {
                    setData(null);
                }
                if (!fetched.current) {
                    fetched.current = true;
                }
            })
            .catch(err=>console.log(err));
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    const handleDelete = () => {
        if (selectedColumn > -1) {
            setTestToDelete(resultList[selectedColumn]);
        }
    };

    const handleDeleteTest = () => {
        const {id} = testToDelete;
        setTestToDelete(null);
        Promise.all([deleteLabTest(id)])
            .then(result => {
                fetch();
            })
            .catch(err => {
                console.log(err);
            });
    };

    const handleCancelDelete = () => {
        setTestToDelete(null);
    };

    const handleColumnClick = e => {
        e.preventDefault();
        const col = Number(e.currentTarget.getAttribute('data-item'));
        if (col !== selectedColumn) {
            setSelectedColumn(col);
        } else {
            setSelectedColumn(-1);
        }
    };

    const handleSelectTestItem = e => {
        // 選択されたテスト項目
        const selected = rows[getSelectedRow(e)];
        setSelectedTest(selected);
    };

    // 検査が一つの場合の render
    const renderOne = () => {
        const [testResult] = resultList;  // == 1
        const lab = testResult['labName'];
        const sd = labDateString(testResult['samplingDate'], 'yyyy-m-d HH:MM');
        const testedAt = labDateString(testResult['testDate'], 'yyyy-m-d');
        const headerStr = testedAt ? `ラボ: ${lab}　検体採取日時: ${sd}　検査実施日: ${testedAt}` : `ラボ: ${lab}　検体採取日時: ${sd}`;
        return (
            <Board>
                <table className='w3-table w3-bordered w3-hoverable'>
                    <thead>
                        <tr className='w3-border-bottom'>
                            <th
                                colSpan={ATTRIBUTES.length}
                                className={selectedColumn === 0 ? settings.appTheme.secondary : settings.appTheme.background}
                                data-item={0}
                                onClick={handleColumnClick}
                                >{headerStr}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr className='w3-border-bottom'>
                    {
                        TEST_HEADER.map(name => {
                            return (
                                <td key={v4()}>{name}</td>
                            );
                        })
                    }
                    </tr>
                    {
                        rows.map(row => {
                            const key = row[0]['id'];
                            const rowTarget = testResult['testItems'].find(x => x['testCode'] === row[0]['testCode']);
                            const textColor = flagColor(rowTarget['abnormalFlg']);
                            const color = textColor ? textColor : 'z3-text-karte';
                            return (
                                <tr key={key}>
                                {
                                    ATTRIBUTES.map((attr, col) => {
                                        const colKey = `${key}_${col}`;
                                        if (attr === 'resultValue') {
                                            return (
                                                <NumberColumn key={colKey} className={color}>{valueWithForm(rowTarget)}</NumberColumn>
                                            );
                                        } else if (attr === 'lowerLimit' || attr === 'upperLimit') {
                                            return (
                                                <NumberColumn key={colKey} className={color}>{rowTarget[attr]}</NumberColumn>
                                            );
                                        } else if (attr === 'comment') {
                                            return (
                                                <td key={colKey} className={color}>{concatComment(rowTarget)}</td>
                                            );
                                        } else {
                                            return (
                                                <td key={colKey} className={color}>{rowTarget[attr]}</td>
                                            );
                                        }
                                    })
                                }
                                </tr>
                            );
                        })
                    }
                    </tbody>
                </table>
            </Board>
        );
    };

    // entry row[0], row[1], ....
    const render = (ent, col) => {
        // col = 0 -> テスト項目名称
        if (col === 0) {
            return ent['testName'];
        }
        // resultListに格納されているindex
        const index = col - 1;
        if (index >= columns.length ) {
            return '';
        }
        // entryと同じ testCodeを見つける
        const test = resultList[index]['testItems'].find(x => x['testCode'] === ent['testCode']);
        if (!test || !test.hasOwnProperty('resultValue')) {
            console.log(`Error ${ent}`);    // ToDo error
            return '';
        }
        const arr = [];
        if (ent.count > 0) {
            arr.push(test['resultValue']);
            if (test['valueForm']) {
                const frm = test['valueForm'];
                if (frm.match(/[UELOB]/)) {
                    arr.push(frm);
                }
            }
        } else if (test['resultValue']) {
            arr.push(test['resultValue']);
        } else if (test['comment1']) {
            arr.push(test['comment1']);
            if (test['comment2']) {
                arr.push(test['comment2']);
            }
        }
        if (arr.length === 0) {
            return '';
        }
        const value = arr.length > 1 ? arr.join(' ') : arr.join('');
        const flag = test['abnormalFlg'];
        const color = flagColor(flag);
        if (!color) {
            return <span>{value}</span>;
        }
        const {testName, unit, lowerLimit, upperLimit} = test;
        const msg0 = `${testName}`;
        const msg1 = `上限値=${upperLimit} ${unit}`;
        const msg2 = `下限値=${lowerLimit} ${unit}`;
        return (
            <HoverInfo messages={[msg0, msg1, msg2]} width='192px'>
                <span className={color}>{value}</span>
            </HoverInfo>
        );
    };

    const renderMany = () => {
        return (
            <Board>
                <table className='w3-table' style={{cursor: 'pointer'}}>
                    <thead>
                    <tr className='w3-border-bottom'>
                        <TopLeft>検査項目</TopLeft>
                        {
                            columns.map((sd, col) => {
                                if (col === selectedColumn) {
                                    return (
                                        <SelectedColumn
                                            key={sd.id}
                                            data-item={col}
                                            theme={settings.appTheme}
                                            onClick={handleColumnClick}
                                            >
                                            {sd.value}
                                        </SelectedColumn>
                                    );
                                } else {
                                    return (
                                        <DateColumn
                                            key={sd.id}
                                            data-item={col}
                                            theme={settings.appTheme.secondary}
                                            onClick={handleColumnClick}
                                            >
                                            {sd.value}
                                        </DateColumn>
                                    );
                                }
                            })
                        }
                    </tr>
                    </thead>
                    <tbody>
                    {
                        rows.map((row, rowNum) => {
                            const rowId = row[0]['id'];
                            return (
                                <tr key={rowId} className='w3-border-bottom' data-item={rowNum} onClick={handleSelectTestItem}>
                                {
                                    row.map((ent, col) => {
                                        return col === 0 ? (
                                            <FixedColumn key={ent.id}>
                                            {
                                                render(ent, col)
                                            }
                                            </FixedColumn>
                                        ) : (
                                            <td key={ent.id}>
                                            {
                                                render(ent, col)
                                            }
                                            </td>
                                        );
                                    })
                                }
                                </tr>
                            );
                        })
                    }
                    </tbody>
                </table>
            </Board>
        );
    };

    return (
        <div className='w3-panel'>
            {chartData && chartData.length > 1 &&
                <div>
                    <LineChart
                        width={730}
                        height={250}
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="samplingDate" />
                        <YAxis/>
                        <Tooltip />
                        <Legend />
                        <Line
                          name={`${chartData[0].testName}（${chartData[0].unit}）`}
                          type="monotone"
                          dataKey="value"
                          stroke={settings.appTheme.secondary}
                          isAnimationActive={false}
                        />
                        <Line
                          name='上限値'
                          type="monotone"
                          dataKey="upper"
                          stroke="#ff9800"
                          isAnimationActive={false}
                        />
                        <Line
                          name='下限値'
                          type="monotone"
                          dataKey="lower"
                          stroke="#607d8b"
                          isAnimationActive={false}
                        />
                    </LineChart>
                </div>
            }
            <div className='z3-flex' style={{'--align': 'center'}}>
                <button
                    className='w3-button w3-bar-item w3-round'
                    onClick={handlePrint}
                    disabled={selectedColumn === -1}
                    >印刷
                </button>
                <button
                    className='w3-button w3-bar-item w3-round'
                    onClick={handleDelete}
                    disabled={selectedColumn === -1}
                    >削除
                </button>
            </div>
            {resultList.length === 1 && renderOne()}
            {resultList.length !== 1 && renderMany()}
            <div style={{display: 'none'}}>
                <div ref={componentRef}>
                    <PrintComponent test={selectedColumn !== -1 ? resultList[selectedColumn] : null}/>
                </div>
            </div>
            {testToDelete &&
                <DaingerSelection
                    messages={['選択した検査結果を削除しますか?']}
                    onDainger={handleDeleteTest}
                    onCancel={handleCancelDelete}
                />
            }
        </div>
    );
};

const Board = styled.div`
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
`;

const TopLeft = styled.th`
    position: sticky;
    left: 0;
    min-width: 224px;
    max-width: 224px;
    z-index: 1;
    background-color: var(--surface) !important;
    color: var(--on-surface) !important;
`;

const FixedColumn = styled.td`
    position: sticky;
    left: 0;
    min-width: 224px;
    max-width: 224px;
    background-color: #ffffff;
    z-index: 1;
`;

const DateColumn = styled.th`
    min-width: 80px;
    max-width: 80px;
    color: var(--on-background);
    background-color: var(--background);
    cursor: pointer;
    `;

const SelectedColumn = styled.th`
    min-width: 80px;
    max-width: 80px;
    color: var(--on-surface);
    background-color: var(--surface);
    cursor: pointer;
    `;

const NumberColumn = styled.td`
    text-align: right;
`;

const NamedLabTestPivot = withDisplayNull(LabTestPivot);
export default NamedLabTestPivot;
