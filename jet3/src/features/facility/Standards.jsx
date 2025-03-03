import { useEffect, useState, useReducer, useTransition } from "react";
import { produce } from "immer";
import hash from "object-hash";
import styled from "styled-components";
import { StickyBody, StickyColumn } from "../../aux/commonStyles";
import { LIST_SPEC_NOTIFICATION } from "./userSpec";
import { useStateValue } from "../../reducers/state";
import UserFunc from "./userFunc";
import withDisplayNull from "../../aux/withDisplayNull";
import { useMargaret } from "../../io/MargaretProvider";
import {
	CANCEL_SHORT_TEXT,
	EDIT_TEXT,
	SAVE_TEXT,
	DELETE_TEXT
} from "../../aux/FormUtil";
import { currFacility } from "../../models/karteCtx";
import { getSelectedRow } from "../../aux/FormUtil";
import CustomSelect2 from "../../cmp/CustomSelect2";
import { ENTITY_STANDARD_KBN } from "../../models/claim";

const initilaState = {
	state: "view",
	askToEdit: false,
	facilityNotifications: [],
	notifications: [],
	selectedNotification: null,
	oldHash: null,
	oldModel: null
};

const useOwner = (user) => {
	const [isOwner, setOwner] = useState(false);
	useEffect(() => {
		if (!user) {
			return;
		}
		const fc = currFacility(user);
		setOwner(fc.owner === user.id);
	}, [user]);

	return isOwner;
};

const reducer = (state, action) => {
	return produce(state, (draft) => {
		switch (action.type) {
			case "setNotifications":
				draft.facilityNotifications = action.payload;
				draft.oldModel = draft.facilityNotifications;
				draft.oldHash = hash(draft.facilityNotifications);
				draft.state = "view";
				break;
			case "setFindNotifications":
				draft.notifications = action.payload;
				break;
			case "add":
				if (draft.state === "view") {
					draft.askToEdit = true;
					return;
				}
				if (!draft.facilityNotifications.includes(action.payload.item.code)) {
					draft.facilityNotifications.push(action.payload.item);
					draft.state =
						hash(draft.facilityNotifications) === draft.oldHash
							? "view"
							: "dirty";
				}
				break;
			case "select":
				if (draft.state === "view") {
					return;
				}
				if (
					draft.selectedNotification &&
					draft.selectedNotification.code === action.payload.item.code
				) {
					// unselect
					draft.selectedNotification = null;
				} else {
					draft.selectedNotification = action.payload.item;
				}
				break;
			case "delete":
				if (draft.state === "view" || !draft.selectedNotification) {
					return;
				}
				draft.facilityNotifications = draft.facilityNotifications.filter(
					(it) => it.code !== draft.selectedNotification.code
				);
				draft.selectedNotification = null;
				draft.state =
					hash(draft.facilityNotifications) === draft.oldHash
						? "edit"
						: "dirty";
				break;
			case "cancel":
				draft.facilityNotifications = draft.oldModel;
				draft.state = "view";
				break;
			case "edit":
				draft.state = "edit";
				break;
			default:
				break;
		}
	});
};

const Standards = () => {
	const margaret = useMargaret();
	const [{ user }, dispatch] = useStateValue();
	const [
		{ state, facilityNotifications, notifications, selectedNotification },
		localDispatch
	] = useReducer(reducer, initilaState);
	const [isPending, startTransition] = useTransition();
	const isOwner = useOwner(user);

	useEffect(() => {
		if (!user) {
			return;
		}
		const asyncGet = async (fc_id) => {
			try {
				const results = await margaret
					.getApi("facility")
					.listNotifications(fc_id);
				localDispatch({ type: "setNotifications", payload: results });
			} catch (err) {
				dispatch({ type: "setError", error: err });
			}
		};
		const fc = currFacility(user);
		asyncGet(fc.id);
	}, [user]);

	const handleSelectStandard = async (item) => {
		try {
			const results = await margaret
				.getApi("master")
				.findNotifications(item.entity);
			localDispatch({ type: "setFindNotifications", payload: results });
		} catch (err) {
			dispatch({ type: "setError", error: err });
		}
	};

	const handleFacilitySelect = (e) => {
		e.preventDefault();
		const row = getSelectedRow(e);
		const item = facilityNotifications[row];
		localDispatch({ type: "select", payload: { item: item } });
	};

	const handleNotificationSelect = (e) => {
		e.preventDefault();
		const row = getSelectedRow(e);
		const item = notifications[row];
		const cp = { ...item };
		cp.facilityId = currFacility(user).id; // Add facilityId to the item
		localDispatch({ type: "add", payload: { item: cp } });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const fc = currFacility(user);
		const asyncUpdate = async () => {
			try {
				startTransition(() => {
					margaret
						.getApi("facility")
						.updateNotifications(fc.id, facilityNotifications);
				});
			} catch (err) {
				dispatch({ type: "setError", error: err });
			}
		};
		asyncUpdate();
	};

	const handleCancel = () => {
		localDispatch({ type: "cancel" });
	};

	const handleChangeMode = () => {
		localDispatch({ type: "edit" });
	};

	const handleDelete = () => {
		localDispatch({ type: "delete" });
	};

	const getRowStyle = (row) => {
		if (!selectedNotification) {
			return null;
		}
		return facilityNotifications[row].code === selectedNotification.code
			? "w3-light-gray"
			: null;
	};

	return (
		notifications && (
			<form onSubmit={handleSubmit}>
				<Layout>
					<Left>
						<Top>
							<table className="w3-table w3-bordered w3-hoverable">
								<StickyColumn className="z3-karte">
									<tr>
										{LIST_SPEC_NOTIFICATION.columnGetters.map((it, i) => (
											<th key={i}>{it.label}</th>
										))}
									</tr>
								</StickyColumn>
								<StickyBody>
									{facilityNotifications.map((u, row) => {
										return (
											<tr
												key={row}
												data-item={row}
												onClick={handleFacilitySelect}
												className={getRowStyle(row)}
											>
												{LIST_SPEC_NOTIFICATION.columnGetters.map((col) => {
													const { key, func, arg } = col;
													const args = arg ? arg.map((a) => u[a]) : [];
													if (func) {
														return <td key={key}>{UserFunc[func](...args)}</td>;
													} else {
														return <td key={key}>{u[key]}</td>;
													}
												})}
											</tr>
										);
									})}
								</StickyBody>
							</table>
						</Top>
						<div>
							<Bar>
								<span>{TEXT_NOTIF_KBN}</span>
								<CustomSelect2
									please={true}
									options={ENTITY_STANDARD_KBN}
									labelGetter="name"
									valueGetter="entity"
									onSelect={handleSelectStandard}
								/>
							</Bar>
							<Bottom>
								<table className="w3-table w3-bordered w3-hoverable">
									<StickyColumn className="z3-karte">
										<tr>
											{LIST_SPEC_NOTIFICATION.columnGetters.map((it, i) => (
												<th key={i}>{it.label}</th>
											))}
										</tr>
									</StickyColumn>
									<StickyBody>
										{notifications.map((u, row) => {
											return (
												<tr
													key={row}
													data-item={row}
													onClick={handleNotificationSelect}
												>
													{LIST_SPEC_NOTIFICATION.columnGetters.map((col) => {
														const { key, func, arg } = col;
														const args = arg ? arg.map((a) => u[a]) : [];
														if (func) {
															return (
																<td key={key}>{UserFunc[func](...args)}</td>
															);
														} else {
															return <td key={key}>{u[key]}</td>;
														}
													})}
												</tr>
											);
										})}
									</StickyBody>
								</table>
							</Bottom>
						</div>
					</Left>
					<Right>
						<div className="z3-flex-column" style={{ "--gap": "4px" }}>
							<button
								type="button"
								className="w3-button w3-border w3-round w3-padding-small"
								disabled={!(isOwner && state === "view")}
								onClick={handleChangeMode}
							>
								{EDIT_TEXT}
							</button>
							<button
								type="button"
								className="w3-button w3-border w3-round w3-padding-small"
								disabled={
									!(
										isOwner &&
										state !== "view" &&
										selectedNotification !== null
									)
								}
								onClick={handleDelete}
							>
								{DELETE_TEXT}
							</button>
							<button
								type="button"
								className="w3-button w3-border w3-round w3-padding-small"
								disabled={!(state !== "view")}
								onClick={handleCancel}
							>
								{CANCEL_SHORT_TEXT}
							</button>
							<button
								className="w3-button w3-border w3-round w3-padding-small"
								disabled={state !== "dirty" || isPending}
								onClick={handleSubmit}
							>
								{SAVE_TEXT}
							</button>
						</div>
					</Right>
				</Layout>
			</form>
		)
	);
};

const Layout = styled.div`
	width: 1024px;
	padding: 0 0 0 32px;
	display: grid;
	grid-template-columns: 11fr 1fr;
	grid-template-rows: auto;
	column-gap: 16px;
	grid-template-areas: "left right";
`;

const Left = styled.div`
	grid-area: left;
	height: 100%;
	overflow: hidden;
`;

const Top = styled.div`
	width: 100%;
	height: 256px;
	max-height: 256px;
	overflow-y: auto;
`;

const Bottom = styled.div`
	width: 100%;
	max-height: calc(100vh - 256px - 44px - 32px);
	overflow-y: auto;
`;

const Bar = styled.div`
	display: flex;
	align-items: center;
	column-gap: 8px;
	padding: 0 16px;
	height: 44px;
	background-color: var(--surface);
	overflow-y: visible;
	border-bottom: 1px solid var(--border-color);
`;

const Right = styled.div`
	grid-area: right;
`;

const TEXT_NOTIF_KBN = "届け出区分";

const NamedStandards = withDisplayNull(Standards);
export default NamedStandards;
