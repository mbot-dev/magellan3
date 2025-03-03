import PluginInterface from "./PluginInterface";


const MyUI = () => {
	return <div style={{padding: '32px'}}>My Plugin Content</div>;
};

class MyPlugin extends PluginInterface {
	constructor() {
		super();
		this.name = "MyFirstPlugin";
	}

	getName() {
		return this.name;
	}

	init() {
		console.log("MyFirstPlugin initialized");
	}

	render() {
		return <MyUI />;
	}
}

export default MyPlugin;
