import { useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import dateFormat from "dateformat";
import { MargaretProvider, useMargaret } from "./io/MargaretProvider";
import { GlobalStyle } from "./assets/globalStyles";
import { useStateValue } from "./reducers/state";
import Lobby from "./features/lobby/Lobby";
import { AppIcon, getIcon } from "./AppIcon";
import { APP_MENU_SPEC } from "./appSpec";

const BottomBar = () => {
	const margaret = useMargaret();
	const { user, loginDate } = useStateValue()[0];

	return (
		<Footer>
			<div
				className="z3-padding-box"
				style={{ "--pdd": "3px 16px 3px var(--side-bar-width)" }}
			>
				<div className="z3-flex" style={{ "--gap": "8px" }}>
					<span>{margaret.getProductName()}</span>
					<span>{margaret.getVersion()}</span>
					<div className="z3-flex-grow" />
					<span>
						{loginDate ? dateFormat(loginDate, "yyyy-m-d HH:MM") : ""}
					</span>
					<span>{user?.fullName ?? ""}</span>
				</div>
			</div>
		</Footer>
	);
};

const SideBar = () => {
	const [{ appStatus, path }, dispatch] = useStateValue();

	const handleClick = (p) => {
		dispatch({ type: "setPath", path: p });
	};

	return (
		<Side>
			{APP_MENU_SPEC.entries.map((m, i) => {
				const selected = path === m.path;
				return m.path === "--grow--" ? (
					<div className="z3-flex-grow" key={i} />
				) : (
					<AppIcon
						key={i}
						className={selected ? "z3-margaret" : "w3-hover-text-black"}
						style={{ "--txt": `'${m.label}'` }}
						onClick={() => handleClick(m.path)}
						disabled={appStatus !== "login"}
					>
						{getIcon(m.icon, selected)}
					</AppIcon>
				);
			})}
		</Side>
	);
};

const App = () => {
	const [{ appStatus, settings }, dispatch] = useStateValue();

	useEffect(() => {
		if (appStatus === "pending") {
			dispatch({ type: "setPath", path: "/login" });
		}
	}, [appStatus, dispatch]);

	return (
		<ThemeProvider theme={settings.appTheme}>
			<MargaretProvider>
				<GlobalStyle />
				<Layout>
					<Header />
					<Side>
						<SideBar />
					</Side>
					<Main>
						<Lobby />
					</Main>
					<Footer>
						<BottomBar />
					</Footer>
				</Layout>
			</MargaretProvider>
		</ThemeProvider>
	);
};

const Layout = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	overflow: hidden;
	display: grid;
	grid-template-columns: minmax(var(--side-bar-width), 0) 1fr;
	grid-template-rows: minmax(2px, 0) 1fr minmax(var(--status-height), 0);
	grid-template-areas:
		"t t"
		"s m"
		"f f";
`;

const Header = styled.div`
	grid-area: t;
	width: 100%;
	height: 100%;
	background-color: var(--primary);
	color: var(--on-primary);
	z-index: 5;
	font-size: 0.8rem;
`;

const Side = styled.div`
	grid-area: s;
	padding-top: 0px;
	side: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 16px;
	background-color: var(--primary);
	color: var(--on-primary);
	overflow: hidden;
`;

const Main = styled.div`
	grid-area: m;
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

const Footer = styled.div`
	grid-area: f;
	width: 100%;
	height: 100%;
	background-color: var(--primary);
	color: var(--on-primary);
	z-index: 5;
	font-size: 0.8rem;
`;

export default App;
