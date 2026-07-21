import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/modals";
import Button from "../generic/Button";

class NoInternetConnection extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<>
				<Button
					key={this.props.config.type + 2}
					{...this.props.config.buttons[2]}
				></Button>
				<div className="no-internet-connection-container">
					<label className="no-internet-connection-title">
						<FormattedMessage id="no.internet.connection.title" />
					</label>
					<label className="no-internet-connection-content">
						<FormattedMessage id="no.internet.connection.content" />
					</label>
					<div className="flex-row no-internet-connection-buttons-container">
						<Button
							key={this.props.config.type + 0}
							{...this.props.config.buttons[0]}
						/>
						<Button
							key={this.props.config.type + 1}
							{...this.props.config.buttons[1]}
						/>
					</div>
				</div>
			</>
		);
	}
}

function mapStateToProps(state) {
	return {};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
	forwardRef: true,
})(injectIntl(NoInternetConnection, { forwardRef: true }));
