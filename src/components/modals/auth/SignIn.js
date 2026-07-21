import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../../actions/modals";
import images from "../../../images";
import Button from "../../generic/Button";
import SignInForm from "../../helpers/SignInForm";

class SignIn extends Component {
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
					key={this.props.config.type + 3}
					{...this.props.config.buttons[3]}
				></Button>
				<img className="sign-in-logo" src={images.wacomLogo} alt="" />
				<label className="sign-in-header">
					<FormattedMessage id="auth.sign.wacom.id" />
				</label>
				<label className="sign-in-account-label">
					<FormattedMessage id="auth.sign.wacom.account" />
				</label>
				<SignInForm config={this.props.config}></SignInForm>
				<div className="flex-row sign-in-login-container">
					<Button
						key={this.props.config.type + 0}
						{...this.props.config.buttons[0]}
						clicked={this.props.loginButtonDisabled}
					/>
					<Button
						key={this.props.config.type + 1}
						{...this.props.config.buttons[1]}
					/>
				</div>
				<div className="flex-row">
					<label className="sign-in-account-label">
						<FormattedMessage id="auth.sign.have.account" />
					</label>
					<Button
						key={this.props.config.type + 2}
						{...this.props.config.buttons[2]}
					/>
				</div>
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
})(injectIntl(SignIn, { forwardRef: true }));
