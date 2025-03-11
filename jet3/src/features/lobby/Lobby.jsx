import { useEffect, useRef } from "react";
import styled from "styled-components";
import Splitter, { SplitDirection } from "@devbookhq/splitter";
import { useLocalStorage } from "@react-hooks-library/core";
import { useMargaret } from "../../io/MargaretProvider";
import { useStateValue } from "../../reducers/state";
import StampBox from "../stamp/StampBox";
import connectionManager from "../../io/connectionManager";
import { usePrevious } from "../../hook/usePrevious";
import { currFacility } from "../../models/karteCtx";
import APIAlert from "../../cmp/APIAlert";
import { StampProvider } from "../../reducers/stampState";
import { initialStampState, stampReducer } from "../../reducers/stampReducer";
import RoomAccounting from "../accounting/RoomAccounting";
import RoomPatient from "../pvt/RoomPatient";
import RoomTestAlert from "../notification/RoomTestAlert";
import RoomFacility from "../facility/RoomFacility";
import SignUp from "../auth/SignUp";
import Login from "../auth/Login";
import Home from "../home/home";
import RoomSettings from "../setting/RoomSettings";
import StampMaker from "../stamp/StampMaker";
import RoomKarte from "../karte/RoomKarte";
import RoomReceipt from "../receipt/RoomReceipt";
// import pluginContainer from "../../plugins/PluginContainer";

const PVT_EVENT = "magellan:pvt-update";

const Lobby = () => {
	const margaret = useMargaret();
	const [
		{
			isOnline,
			appStatus,
			path,
			loginName,
			loginChannel,
			user,
			startAccessTokenTimer,
			showStampBox,
			showStampMaker,
			error
		},
		dispatch
	] = useStateValue();
	const prevName = usePrevious(loginChannel);
	const timerRef = useRef(null);
	const [splitSizes, setSplitSizes] = useLocalStorage("split_lobby", [79, 19]);

	// Check network status
	useEffect(() => {
		const updateNetwork = () => {
			const online = window.navigator.onLine;
			dispatch({ type: "setOnline", isOnline: online });
		};
		window.addEventListener("offline", updateNetwork);
		window.addEventListener("online", updateNetwork);
		return () => {
			window.removeEventListener("offline", updateNetwork);
			window.removeEventListener("online", updateNetwork);
		};
	}, [dispatch]);

	// Subscribe pusher channel to receive access token
	useEffect(() => {
		if (!dispatch || !loginName || !loginChannel) {
			return;
		}
		if (prevName) {
			const prevChannel = `${prevName}`;
			console.log(`Unsubscribe previous channel ${prevChannel}`);
			margaret.getApi("pusher").unsubscribe(prevChannel);
		}
		// loginChannel -> auth server returned
		const bearerChannelName = `${loginChannel}`;
		margaret
			.getApi("pusher")
			.subscribe(bearerChannelName, "iss:magic", (token) => {
				console.log(`Received bearer token`);
				console.log(`Unsubscribed pusher channel ${bearerChannelName}`);
				margaret.getApi("pusher").unsubscribe(bearerChannelName);
				dispatch({ type: "setBearerToken", token: token }); // dispatch
			});

		// Clean up
		return () => {
			margaret.getApi("pusher").unsubscribe(bearerChannelName);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, loginName, loginChannel]);

	useEffect(() => {
		if (!startAccessTokenTimer) {
			return;
		}
		let isCancel = false;
		const getToken = async () => {
			if (timerRef && timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			const timeout = Math.ceil(connectionManager.getExpiresIn() * 0.8); // 0.8 * expiresIn
			try {
				const newToken = await margaret
					.getApi("iss")
					.requestRefreshAndAccessToken({ sub: loginName });
				connectionManager.setToken(newToken);
				if (window?.electron) {
					await window.electron.storeAccessToken(newToken);
				}
				timerRef.current = setTimeout(getToken, timeout * 1000);
			} catch (err) {
				console.log(err);
				if (timerRef && timerRef.current) {
					clearTimeout(timerRef.current);
					timerRef.current = null;
					isCancel = true;
				}
			}
		};
		if (!isCancel) {
			getToken();
		}
		return () => {
			if (timerRef && timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startAccessTokenTimer]);

	// Logout
	useEffect(() => {
		if (appStatus !== "logout") {
			return;
		}
		if (timerRef && timerRef.current) {
			clearTimeout(timerRef.current); // Invalidate refresh token timer
			timerRef.current = null;
		}
		connectionManager.setToken(null);
		window.localStorage.removeItem("username");
		dispatch({ type: "setPending" });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appStatus]);

	// PVT Notification
	useEffect(() => {
		if (!dispatch || appStatus !== "login" || !user) {
			return;
		}
		const facilityId = currFacility(user).id;
		const pvtChannel = `pvt-${facilityId}`;
		margaret.getApi("pusher").subscribe(pvtChannel, PVT_EVENT, (data) => {
			console.log(`received push event ${JSON.stringify(data, null)}`); // pvtId
			const { type } = data;
			if (type === "pvt") {
				dispatch({ type: "updateVisit" }); // cause PVT fetch visits
				return;
			}
			if (type === "receipt") {
				dispatch({ type: "updateVisit" });
				return;
			}
		});
		//---------------------------------------------
		// Is here best place to load plugins?
		// pluginContainer.registerPlugins();
		// pluginContainer.loadPlugins();
		//---------------------------------------------
		const loadPlugins = async () => {
			const plugins = await margaret.getApi("plugin").getPlugin("karte");
			// console.log(JSON.stringify(plugins, null, 2));
			console.log(plugins);
		};
		loadPlugins();

		return () => {
			margaret.getApi("pusher").unsubscribe(pvtChannel);
		};
	}, [dispatch, appStatus, user]);

	const handleResize = (gutterIdx, allSizes) => {
		setSplitSizes(allSizes);
	};

	const handleError = () => {
		dispatch({ type: "setError", error: null });
	};

	return (
		<StampProvider reducer={stampReducer} initialState={initialStampState}>
			<Layout>
				{!isOnline && (
					<div className="w3-center w3-padding-64">
						<p className="w3-text-red w3-large">{TEXT_CONNECT_TO_INTERNET}</p>
					</div>
				)}
				<Splitter
					direction={SplitDirection.Horizontal}
					initialSizes={showStampBox ? splitSizes : [100, 0]}
					onResizeFinished={handleResize}
					gutterClassName={"custom-gutter-horizontal"}
					draggerClassName={"custom-dragger-horizontal"}
					style={{ overflow: "hidden" }}
				>
					<LeftPane>
						{
							<MakerWrapper
								show={(path === "/karte" && showStampMaker).toString()}
							>
								<StampMaker
									origin="karte"
									show={(path === "/karte" && showStampMaker).toString()}
								/>
							</MakerWrapper>
						}
						<Login show={(path === "/login").toString()} />
						<SignUp show={(path === "/signup").toString()} />
						<Home show={(path === "/home").toString()} />
						<RoomKarte show={(path === "/karte").toString()} />
						<RoomPatient show={(path === "/patient").toString()} />
						<RoomAccounting show={(path === "/accounting").toString()} />
						<RoomReceipt show={(path === "/receipt").toString()} />
						<RoomTestAlert show={(path === "/notify").toString()} />
						<StampMaker origin="tool" show={(path === "/tool").toString()} />
						<RoomFacility show={(path === "/facility").toString()} />
						<RoomSettings show={(path === "/settings").toString()} />
					</LeftPane>
					<RightPane>
						<StampBox show={showStampBox.toString()} />
					</RightPane>
				</Splitter>
				{error && <APIAlert status={error?.status ?? 500} onOk={handleError} />}
			</Layout>
		</StampProvider>
	);
};

// In app main grid
const Layout = styled.div`
	width: 100%;
	height: 100%;
	overflow: hidden;
	background-color: var(--background);
`;

const LeftPane = styled.div`
	position: relative; /* for MakerWrapper as parent */
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

const RightPane = styled.div`
	width: 100%;
	height: 100%;
	overflow: hidden;
`;

// Absolute parent is Layout above
const MakerWrapper = styled.div.attrs({
	className: "w3-animate-bottom"
})`
	display: ${({ show }) => (show && show === "true" ? "block" : "none")};
	position: absolute;
	top: 40px;
	bottom: 0;
	left: 25%;
	right: 0;
	border-top: 1px solid var(--border-color);
	border-bottom: 1px solid var(--border-color);
	border-left: 1px solid var(--border-color);
	z-index: 30;
`;

const TEXT_CONNECT_TO_INTERNET = "インターネットに接続してください";

export default Lobby;
