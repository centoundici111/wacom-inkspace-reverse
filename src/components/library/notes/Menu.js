import className from "classnames";
import Tooltip from "rc-tooltip";
import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import * as actions from "../../../actions/library";
import {
	createLiveMode,
	openDialog,
	openSettings,
	openWizard,
} from "../../../actions/modals";
import * as DeviceStatus from "../../../constants/DeviceStatus";
import * as Modals from "../../../constants/Modals";
import * as WizardSteps from "../../../constants/WizardSteps";
import * as WizardTypes from "../../../constants/WizardTypes";
import CloudDisconnectedIcon from "../../icons/library/cloud/CloudDisconnectedIcon.svg";
import CloudNotSyncedIcon from "../../icons/library/cloud/CloudNotSyncedIcon.svg";
import CloudSyncedIcon from "../../icons/library/cloud/CloudSyncedIcon.svg";
import CloudSyncingIcon from "../../icons/library/cloud/CloudSyncingIcon.svg";
import ConnectedChargingIcon from "../../icons/library/device-status/DeviceChargingIcon.svg";
import DisconnectedIcon from "../../icons/library/device-status/DeviceDisconnectedIcon.svg";
import ConnectedNotChargingIcon from "../../icons/library/device-status/DeviceNotChargingIcon";
import NotPairedIcon from "../../icons/library/device-status/DeviceNotPairedIcon.svg";
import ImportIcon from "../../icons/library/ImportIcon.svg";
import LiveModeIcon from "../../icons/library/LiveModeIcon.svg";
import SettingsIcon from "../../icons/library/SettingsIcon.svg";
import TagIcon from "../../icons/library/tags-manager/TagIcon.svg";
import LoadingIcon from "../../icons/LoadingIcon";

class Menu extends Component {
	constructor(props) {
		super(props);
	}

	isLibraryEmpty() {
		return !ContentManager.sections.length;
	}

	triggerLiveMode() {
		let selectedNotesCount = ContentManager.getSelectedNotes().length;

		if (selectedNotesCount !== 1 || this.props.context === "GROUPS") {
			this.props.createLiveMode();
		} else {
			this.props.openDialog(Modals.LIVE_MODE, {
				disableEditMode: selectedNotesCount !== 1,
			});
		}
	}

	openSettings() {
		if (this.props.deviceStatus == DeviceStatus.NOT_PAIRED)
			this.props.openWizard(
				WizardTypes.SETUP_DEVICE,
				WizardSteps.SETUP_DEVICE
			);
		else this.props.openSettings(SettingsTab.DEVICE);
	}

	login() {
		if (!AuthenticationManager.hasAccess()) {
			this.props.openDialog(Modals.WACOM_ID_BENEFITS);
		} else {
			this.props.openSettings(SettingsTab.CLOUD);
		}
	}

	openTagsEditor() {
		if (AuthenticationManager.hasAccess()) {
			this.props.openDialog(Modals.TAGS_EDITOR);
		} else {
			this.props.openDialog(Modals.WACOM_ID_BENEFITS);
		}
	}

	showSearch() {
		if (AuthenticationManager.hasAccess()) {
			this.props.showSearch();
		} else {
			this.props.openDialog(Modals.WACOM_ID_BENEFITS);
		}
	}

	resolveDeviceSetting() {
		let status = { className: "", icon: null, tooltip: null };

		switch (this.props.deviceStatus) {
			case DeviceStatus.NOT_PAIRED:
				status.className = "not-paired";
				status.icon = <NotPairedIcon />;
				status.tooltip = (
					<div>
						<FormattedMessage id={"device.status.notpaired"} />
					</div>
				);

				break;
			case DeviceStatus.DISCONNECTED:
				status.className = "disconnected";
				status.icon = <DisconnectedIcon />;
				status.tooltip = (
					<div>
						<FormattedMessage id={"device.status.disconnected"} />
					</div>
				);

				break;
			case DeviceStatus.CONNECTED_NOT_CHARGING:
				let batteryCharge = this.props.batteryCharge || {
					charging: false,
					percent: 100,
				};

				if (batteryCharge.charging) {
					status.className = "connected charging";
					status.icon = <ConnectedChargingIcon />;
					status.tooltip = (
						<div>
							<FormattedMessage
								id={"device.status.charging"}
								values={{
									percent:
										batteryCharge.percent == 0
											? 1
											: batteryCharge.percent,
								}}
							/>
						</div>
					);
				} else {
					status.className = "connected notcharging";

					// status.icon = <ConnectedNotChargingIcon />;
					// status.css = `.icon.device-status.connected.notcharging rect {width: ${batteryCharge.percent / 100 * 14}px}`;

					status.icon = (
						<ConnectedNotChargingIcon
							width={(batteryCharge.percent / 100) * 14}
						/>
					);
					status.tooltip = (
						<div>
							<span>
								{batteryCharge.percent == 0
									? 1
									: batteryCharge.percent}
								%
							</span>
						</div>
					);
				}

				break;
			case DeviceStatus.SEARCHING_LOADING:
				status.className = "searching-loading";
				status.icon = <LoadingIcon color="#ffffff" />;
				status.tooltip = (
					<div>
						<FormattedMessage id={"device.status.loading"} />
					</div>
				);

				break;
		}

		return status;
	}

	render() {
		let authorized = AuthenticationManager.hasAccess();
		let searchInsufficientPermissions =
			AuthenticationManager.profile &&
			AuthenticationManager.profile.access &&
			!AuthenticationManager.profile.access.rights.includes(
				"SEARCH-TEXT"
			);

		let liveModeIconClass = className({
			icon: true,
			disabled: !this.props.device,
		});

		let tagsEditorIconClass = className({
			icon: true,
			disabled: !this.props.online || this.props.context == "GROUPS",
		});

		let searchIconClass = className({
			icon: true,
			disabled: true,
		});

		let syncing =
			authorized && this.props.online && this.props.cloudSyncing;

		let cloudIconClass = className({
			icon: true,
			syncing: syncing,
			disabled: !this.props.online && !AuthenticationManager.hasAccess(),
		});

		let cloudIcon = <CloudNotSyncedIcon />;
		if (authorized)
			cloudIcon = this.props.cloudSyncing ? (
				<CloudSyncingIcon />
			) : (
				<CloudSyncedIcon />
			);
		if (!this.props.online) cloudIcon = <CloudDisconnectedIcon />;

		let deviceStatusConfig = this.resolveDeviceSetting();

		let deviceSettingsIconClass = className({
			icon: true,
			button: true,
			[deviceStatusConfig.className]: true,
			"device-status": true,
		});

		return (
			<>
				<ul>
					<li>
						{/*<style>{deviceStatusConfig.css}</style>*/}

						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={deviceStatusConfig.tooltip}
							align={{ offset: [0, 10] }}
						>
							<a
								className={deviceSettingsIconClass}
								onClick={this.openSettings.bind(this)}
							>
								{deviceStatusConfig.icon}
							</a>
						</Tooltip>
					</li>
					<li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage id={"tooltip.liveMode"} />
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className={liveModeIconClass}
								onClick={this.triggerLiveMode.bind(this)}
							>
								<LiveModeIcon />
							</a>
						</Tooltip>
					</li>
					<li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage
										id={"tooltip.tags.editor"}
									/>
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className={tagsEditorIconClass}
								onClick={this.openTagsEditor.bind(this)}
							>
								<TagIcon />
							</a>
						</Tooltip>
					</li>
					{/* <li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage id={"tooltip.search"} />
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className={searchIconClass}
								onClick={this.showSearch.bind(this)}
							>
								<SearchIcon />
							</a>
						</Tooltip>
					</li> */}
					{/* <li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage id={"tooltip.cloud"} />
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className={cloudIconClass}
								onClick={this.login.bind(this)}
							>
								{cloudIcon}
								{syncing ? <CloudSyncingArrowUp /> : null}
								{syncing ? <CloudSyncingArrowDown /> : null}
							</a>
						</Tooltip>
					</li> */}
					<li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage id={"tooltip.import"} />
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className="icon"
								onClick={() => this.props.loadNotes()}
							>
								<ImportIcon />
							</a>
						</Tooltip>
					</li>
					<li>
						<Tooltip
							placement={"bottom"}
							destroyTooltipOnHide={true}
							overlay={
								<div>
									<FormattedMessage id={"tooltip.settings"} />
								</div>
							}
							align={{ offset: [0, 10] }}
						>
							<a
								className="icon"
								onClick={() =>
									this.props.openSettings(SettingsTab.DEVICE)
								}
							>
								<SettingsIcon />
							</a>
						</Tooltip>
					</li>
				</ul>
			</>
		);
	}
}

function mapStateToProps(state) {
	return {
		online: state.AppReducer.online,
		profile: state.AppReducer.profile,
		device: state.AppReducer.device,

		context: state.LibraryReducer.context,
		lastModified: state.LibraryReducer.lastModified,
		deviceStatus: state.LibraryReducer.deviceStatus,
		batteryCharge: state.LibraryReducer.batteryCharge,
		cloudSyncing: state.LibraryReducer.cloudSyncing,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(
		{ ...actions, openDialog, openSettings, openWizard, createLiveMode },
		dispatch
	);
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Menu));
