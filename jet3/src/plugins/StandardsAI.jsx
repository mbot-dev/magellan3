import PluginInterface from "./PluginInterface";
import StandardsUI from "./StandardsUI";

class StandardsAI extends PluginInterface {
	constructor() {
		super();
	}

	get name() {
		return "facilityStandards";
	}

	get plugPoint() {
		return "facilityStandards";
	}

	init() {
		console.log("Plugin Facility Standards initialized");
	}

	render(props) {
		return <StandardsUI {...props} />;
	}
}

export default StandardsAI;
