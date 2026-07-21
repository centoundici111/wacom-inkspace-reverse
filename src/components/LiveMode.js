import Tooltip from "rc-tooltip";
import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import * as actions from "../actions/live";
import AppManager from "../globals/AppManager";
import ReactUtils from "../globals/ReactUtils";
import ColorPalette from "./edit/ColorPalette";
import LiveNote from "./edit/LiveNote";
import HomeIcon from "./icons/HomeIcon.svg";

class LiveMode extends Component {
	constructor(props) {
		super(props);

		this.state = {
			rotation: 0,
			percent: -1,
			progress: true,
		};

		this.transferToLibrary = this.transferToLibrary.bind(this);
	}

	transferToLibrary() {
		this.props.transferToLibrary();
	}

	componentDidMount() {
		PowerManager.blockSleep();

		this.props.initLiveMode(() => {
			this.props.addNotification("notification.livemode.info");
		});

		DeviceManager.liveDeviceClosed = () => {
			if (!AppManager.closing) {
				this.props.addNotification(
					"notification.livemode.disconnected"
				);

				this.props.transferToLibrary();
			}
		};
	}

	componentWillUnmount() {
		PowerManager.unblockSleep();

		this.props.finalizeLiveMode();
		delete DeviceManager.liveDeviceClosed;
	}

	render() {
		if (!this.props.note) return null;

		return (
			<div className="edit container">
				<header>
					<div className="menu left pull-left">
						<ul>
							<li>
								<Tooltip
									placement={"bottom"}
									destroyTooltipOnHide={true}
									overlay={
										<div>
											<FormattedMessage
												id={"tooltip.backToLibrary"}
											/>
										</div>
									}
									align={{ offset: [0, 10] }}
								>
									<a
										className="icon"
										onClick={this.transferToLibrary}
									>
										<HomeIcon />
									</a>
								</Tooltip>
							</li>
						</ul>
					</div>
					<div className="menu center live-mode">
						<ul>
							<li>
								<ColorPalette context="liveMode" />
							</li>
						</ul>
					</div>
				</header>

				<LiveNote />
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		note: state.LiveReducer.note,
		noteProgress: state.LiveReducer.noteProgress,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(actions, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withRouter(ReactUtils.createParentTracker(LiveMode)));
