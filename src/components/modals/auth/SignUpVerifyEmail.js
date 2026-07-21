import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../../actions/modals";
import images from "../../../images";
import Button from "../../generic/Button";
import SignInForm from "../../helpers/SignInForm";

class SignUpVerifyEmail extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.props.checkForInternet(
			this.props.config.context,
			this.props.config.authContext
		);
	}

	render() {
		return (
			<>
				<Button
					key={this.props.config.type + 2}
					{...this.props.config.buttons[2]}
				></Button>
				<img className="sign-in-logo" src={images.wacomLogo} alt="" />
				<div className="top-bottom-padding-5"></div>
				<label className="sign-in-header">
					<FormattedMessage id="auth.sign.up.verify.email" />
				</label>
				<div className="top-bottom-padding-20"></div>
				<label className="sign-up-profile-verify-email-label">
					<FormattedMessage id="auth.sign.up.complete.sign.up" />
				</label>
				<div className="flex-row">
					<label className="sign-up-profile-receive-email-label">
						<FormattedMessage id="auth.sign.up.no.email.received" />
					</label>
					<Button
						key={this.props.config.type + 1}
						{...this.props.config.buttons[1]}
					/>
				</div>
				<div className="top-bottom-padding-15"></div>
				<div className="sign-in-semi-bold">
					<FormattedMessage id="auth.sign.wacom.id" />
				</div>
				<div className="top-bottom-padding-15"></div>
				<SignInForm config={this.props.config}></SignInForm>
				<div className="top-bottom-padding-5"></div>
				<Button
					key={this.props.config.type + 0}
					{...this.props.config.buttons[0]}
					clicked={this.props.loginButtonDisabled}
				/>
			</>
		);
	}
}

function mapStateToProps(state) {
	return {
		loginButtonDisabled: state.AuthReducer.loginButtonDisabled,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
	forwardRef: true,
})(injectIntl(SignUpVerifyEmail, { forwardRef: true }));
