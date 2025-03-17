import { useEffect, useRef, useState } from "react";
import { v4 } from "uuid";
import styled from "styled-components";
import { parseTestFile } from "../../util/labParser";
import { useStateValue } from "../../reducers/state";
import { currFacility } from "../../models/karteCtx";
import { useMargaret } from "../../io/MargaretProvider";
import { labDateString } from "../../util/labUtil";
import withDisplayNull from "../../aux/withDisplayNull";

// const SAMPLING_DF = 'yyyy-m-d HH:MM';
const SAMPLING_DF = "yyyy-m-d";

const CommandBar = styled.div`
	display: flex;
	justify-content: center;
	column-gap: ${(props) => props.gap || "8px"};
`;

const moduleAttributes = [
	"lab_name",
	"pt_id",
	"pt_name",
	"pt_kana",
	"pt_dob",
	"pt_gender",
	"test_date",
	"count",
	"createResult"
];

const moduleHeader = [
	"ラボ",
	"患者ID",
	"氏 名",
	"カ ナ",
	"生年月日",
	"性 別",
	"検査実施日",
	"検査項目数",
	"登録結果"
];

const testAttributes = [
	"index",
	"lab_name",
	"pt_id",
	"pt_name",
	"pt_kana",
	"pt_dob",
	"pt_gender",
	"order_date",
	"test_date",
	"spc_name",
	"test_name",
	"result_value",
	"unit",
	"result_status"
];

const testHeader = [
	"番号",
	"ラボ",
	"患者ID",
	"氏名",
	"カナ",
	"生年月日",
	"性別",
	"検査依頼日",
	"検査実施日",
	"検体",
	"検査項目",
	"結果値",
	"単位",
	"状態"
];

// LabModle-oneToMany-LabTestItem
const useModule = (testArray) => {
	const [modules, setModules] = useState([]);
	useEffect(() => {
		if (!testArray?.length) {
			return;
		}
		let currMap; // LabModule Info
		let currId = null;
		const arr = [];
		testArray.forEach((item) => {
			if (item["order_id"] !== currId) {
				currId = item["order_id"];
				currMap = {
					fc_id: item["fc_id"], // magellan facility_id  not 厚生労働省医療機関コード
					order_date: item["order_date"],
					sampling_date: item["sampling_date"],
					test_date: item["test_date"],
					lab_code: item["lab_code"],
					lab_name: item["lab_name"],
					pt_id: item["pt_id"], // 検査結果登録時の患者存在テスト用
					pt_name: item["pt_name"], // 検査結果登録時の患者存在テスト用
					pt_kana: item["pt_kana"], // 検査結果登録時の患者存在テスト用
					pt_dob: item["pt_dob"], // 検査結果登録時の患者存在テスト用
					pt_gender: item["pt_gender"], // 検査結果登録時の患者存在テスト用
					order_id: currId,
					test_items: []
				};
				currMap["test_items"].push(item);
				arr.push(currMap);
			} else {
				currMap["test_items"].push(item);
			}
		});
		setModules(arr);
	}, [testArray]);

	return modules;
};

const RoomLab = () => {
	const margaret = useMargaret();
	const { user, patientIdDigits } = useStateValue()[0];
	const [files, setFiles] = useState([]);
	const [testArray, setTestArray] = useState([]);
	const [createResult, setCreateResult] = useState([]);
	const modules = useModule(testArray);
	const inputRef = useRef(undefined);

	// File selection
	useEffect(() => {
		if (!user || files.length === 0) {
			return;
		}
		const { id, name } = currFacility(user);
		let results = [];
		files.forEach((file) => {
			parseTestFile(file, id, name, patientIdDigits, (error, list) => {
				if (error) {
					console.log(error); // ToDo Alert
					return;
				}
				results.push(...list);
				setTestArray(results);
				setCreateResult([]);
			});
		});
	}, [user, files]);

	const handleClick = () => {
		inputRef.current.click();
	};

	// File選択 -> parse
	const handleChange = (e) => {
		e.preventDefault();
		const files = e.target.files;
		const array = [...files].filter((x) => x.name.endsWith(".csv"));
		if (array.length > 0) {
			setFiles(array);
		}
	};

	const fileNames = () => {
		if (files.length === 0) {
			return "";
		}
		const arr = [];
		files.forEach((f) => {
			arr.push(f.name);
		});
		return arr.join(" ");
	};

	const handleSave = () => {
		const pArr = [];
		modules.forEach((m) => {
			// Add Context Info
			//----------------------------------------
			m["facility_id"] = currFacility(user).id; // magellan.id 不要
			m["physician_id"] = user.id;
			//----------------------------------------
			pArr.push(margaret.getApi("labTest").saveLabTest(m));
		});
		Promise.all(pArr)
			.then((results) => {
				const created = [];
				results.forEach((r) => {
					if (r.error) {
						created.push(r.error.message);
					} else {
						created.push("成功");
					}
				});
				setCreateResult(created);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const createdResult = (row) => {
		if (createResult.length === 0) {
			return "";
		}
		if (row < createResult.length) {
			const val = createResult[row];
			return val === "成功" ? val : <span className="w3-text-red">{val}</span>;
		}
		return "";
	};

	return (
		<Layout>
			<div className="w3-panel">
				<span>{`患者IDの桁数は${patientIdDigits}に設定されています。`}</span>
				<CommandBar>
					<button className="w3-button w3-round" onClick={handleClick}>
						+検査結果ファイルを選択
						<DisplayNoneInput
							ref={inputRef}
							className="w3-input"
							type="file"
							onChange={handleChange}
							multiple={true}
						/>
					</button>
					<button
						className="w3-button w3-round z3-primary"
						disabled={testArray.length === 0 || createResult.length > 0}
						onClick={handleSave}
					>
						登録
					</button>
				</CommandBar>
			</div>
			<div>
				<div className="w3-panel">
					<span>{`ファイル: ${fileNames()} サマリー`}</span>
					<table className="w3-table w3-bordered">
						<tbody>
							<tr>
								{moduleHeader.map((name) => {
									return <th key={v4()}>{name}</th>;
								})}
							</tr>
							{modules.map((entry, row) => {
								return (
									<tr key={v4()}>
										{moduleAttributes.map((attr) => {
											if (attr === "test_date") {
												const sd = labDateString(entry[attr], SAMPLING_DF);
												return <td key={v4()}>{sd}</td>;
											} else if (attr === "count") {
												return <td key={v4()}>{entry["test_items"].length}</td>;
											} else if (attr === "createResult") {
												return <td key={v4()}>{createdResult(row)}</td>;
											} else {
												return <td key={v4()}>{entry[attr]}</td>;
											}
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<div className="w3-panel">
					<span>検査項目・結果値</span>
					<table className="w3-table w3-striped w3-hoverable">
						<tbody>
							<tr>
								{testHeader.map((name) => {
									return <th key={v4()}>{name}</th>;
								})}
							</tr>
							{testArray.map((test, index) => {
								return (
									<tr key={v4()}>
										{testAttributes.map((attr) => {
											if (attr === "index") {
												return <td key={v4()}>{index + 1}</td>;
											} else if (
												attr === "order_date" ||
												attr === "test_date"
											) {
												const sd = labDateString(test[attr], SAMPLING_DF);
												return <td key={v4()}>{sd}</td>;
											} else if (attr === "result_value") {
												const val = test["result_value"]
													? `${test["result_value"]}${test["value_type"]}`
													: "";
												return <td key={v4()}>{val}</td>;
											} else {
												return <td key={v4()}>{test[attr]}</td>;
											}
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</Layout>
	);
};

const Layout = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	overflow-y: auto;
`;

const DisplayNoneInput = styled.input`
	display: none;
`;

const WrappedHome = withDisplayNull(RoomLab);
export default WrappedHome;
