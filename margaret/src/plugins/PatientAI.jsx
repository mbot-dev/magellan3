import React, { useState, useEffect } from "react";
import PluginInterface from "./PluginInterface";


const MyUI = () => {
	const [aiData, setAIData] = useState(null);

	useEffect(() => {
		//--------------------------------------------------------------
		const data = { diagnosis: "influenza", assessment: "getting better" };
		setAIData(data);
		//-------------------------------------------------
		return () => {
			console.log("PatientUI unmounted");
		};
	}, []);

	return (
		<div style={{padding: '32px'}}>
			<p>{aiData.disease}</p>
			<p>{aiData.asessment}</p>
		</div>
	);
};

class PatientAI extends PluginInterface {
	constructor() {
		super();
		this.name = "patientPlugin";
	}

	getName() {
		return this.name;
	}

	init() {
		console.log("patientPlugin initialized");
	}

	render() {
		return <MyUI />;
	}
}

export default PatientAI;
