import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../../actions/modals";
import images from "../../../images";
import Button from "../../generic/Button";
import SignUpProfileForm from "../../helpers/SignUpProfileForm";

class SignUpProfile extends Component {
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
					key={this.props.config.type + 1}
					{...this.props.config.buttons[1]}
				></Button>
				<div className="flex-column sign-up-main-container">
					<img
						className="sign-in-logo"
						src={images.wacomLogo}
						alt=""
					/>
					<label className="sign-in-header">
						<FormattedMessage id="auth.sign.up.create.your.profile" />
					</label>
					<div className="top-bottom-padding-20"></div>
					<div className="top-bottom-padding-15"></div>
					<SignUpProfileForm />
					<div className="top-bottom-padding-10"></div>
					<Button
						key={this.props.config.type + 0}
						{...this.props.config.buttons[0]}
						clicked={this.props.continueButtonDisabled}
					></Button>
				</div>
			</>
		);
	}
}

function mapStateToProps(state) {
	return {
		continueButtonDisabled: state.AuthReducer.continueButtonDisabled,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
	forwardRef: true,
})(injectIntl(SignUpProfile, { forwardRef: true }));
