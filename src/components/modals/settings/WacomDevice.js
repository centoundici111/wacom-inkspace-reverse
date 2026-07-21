import React, { Component } from "react";
import { FormattedDate, FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import * as actions from "../../../actions/modals";
import * as Modals from "../../../constants/Modals";
import * as WizardSteps from "../../../constants/WizardSteps";
import * as WizardTypes from "../../../constants/WizardTypes";

class WacomDevice extends Component {
	constructor(props) {
		super(props);
	}

	setName(e) {
		e.preventDefault();

		if (DeviceManager.downloading) {
			this.props.addNotification(
				"notification.no.device.actions.while.note.transfer"
			);
			return;
		}

		this.props.closeDialog();
		this.props.openDialog(Modals.SET_NAME);
	}

	selectOrientation(e) {
		e.preventDefault();

		if (DeviceManager.downloading) {
			this.props.addNotification(
				"notification.no.device.actions.while.note.transfer"
			);
			return;
		}

		this.props.closeDialog();
		this.props.openDialog(Modals.SELECT_ORIENTATION);
	}

	triggerLiveMode() {
		this.props.createLiveMode();
	}

	setupDevice(e) {
		e.preventDefault();

		if (DeviceManager.downloading) {
			this.props.addNotification(
				"notification.no.device.pairing.while.note.transfer"
			);
			return;
		}

		this.props.closeDialog();
		this.props.openWizard(
			WizardTypes.SETUP_DEVICE,
			WizardSteps.SETUP_DEVICE
		);
	}

	render() {
		return (
			<div className="smartpad-container">
				{this.renderDeviceInfo()}

				<div className="device-orientation">
					{(() =>
						DeviceManager.isOpen(true)
							? this.renderDeviceActions()
							: null)()}
					<a onClick={this.setupDevice.bind(this)}>
						<FormattedMessage id={"settings.device.pair.device"} />
					</a>
				</div>
			</div>
		);
	}

	renderDeviceInfo() {
		if (this.props.device) {
			return (
				<ul>
					<li>
						<span className="spad-left">
							<FormattedMessage id={"settings.device.name"} />
						</span>
						<span className="spad-right">
							{this.props.device.name}
						</span>
					</li>
					<li>
						<span className="spad-left">
							<FormattedMessage
								id={"settings.device.last.synced"}
							/>
						</span>
						<span className="spad-right">
							<FormattedDate
								value={this.props.lastSync}
								year="numeric"
								month="long"
								day="numeric"
								hour="numeric"
								minute="numeric"
							/>
						</span>
					</li>
					<li>
						<span className="spad-left">
							<FormattedMessage
								id={"settings.device.battery.last.sync"}
							/>
						</span>
						<span className="spad-right">
							{this.props.batteryCharge
								? this.props.batteryCharge.percent + "%"
								: null}{" "}
						</span>
					</li>
					<li>
						<span className="spad-left">
							<FormattedMessage
								id={"settings.device.firmware.version"}
							/>
						</span>
						<span className="spad-right">
							{this.props.device.firmwareVersion.version.join(
								" / "
							)}
						</span>
					</li>
				</ul>
			);
		} else {
			return (
				<ul>
					<li>
						<FormattedMessage
							id={"settings.device.not.connected"}
						/>
					</li>
				</ul>
			);
		}
	}

	renderDeviceActions() {
		return (
			<div>
				{/*<a onClick={::this.setName}><FormattedMessage id={ 'settings.device.change.name' }/></a>*/}
				<a onClick={this.selectOrientation.bind(this)}>
					<FormattedMessage
						id={"settings.device.change.orientation"}
					/>
				</a>
				<a onClick={this.triggerLiveMode.bind(this)}>
					<FormattedMessage id={"tooltip.liveMode"} />
				</a>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withRouter(WacomDevice));
