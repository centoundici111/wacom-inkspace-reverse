import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/modals";
import * as ActionTypes from "../../constants/ActionTypes";

class SignInForm extends Component {
  constructor(props) {
    super(props);
  }

  handleEmailChange(args) {
    this.props.handleEmailChange(args.target.value, ActionTypes.AUTH_SIGN_IN);
    this.props.validateSignInForm();
  }

  handlePasswordChange(args) {
    this.props.handlePasswordChange(
      args.target.value,
      ActionTypes.AUTH_SIGN_IN
    );
    this.props.validateSignInForm();
  }

  render() {
    return (
      <form className="remove-margin">
        <div className="flex-column">
          <label
            className={`auth-error-text${
              this.props.hasError ? " visible" : ""
            }`}
          >
            <FormattedMessage id="auth.sign.email.or.password.invalid" />
          </label>
          <label
            className={`sign-in-email-text remove-margin${
              this.props.hasError ? " auth-label-error" : ""
            }`}
            htmlFor="email"
          >
            <FormattedMessage id="auth.sign.email" />
          </label>
          <input
            className={`sign-in-input${
              this.props.hasError ? " auth-input-error" : ""
            }`}
            type="email"
            spellCheck="false"
            value={this.props.email}
            onChange={this.handleEmailChange.bind(this)}
          ></input>
        </div>
        <div className="flex-column">
          <label
            className={`sign-in-password-text remove-margin${
              this.props.hasError ? " auth-label-error" : ""
            }`}
            htmlFor="password"
          >
            <FormattedMessage id="auth.sign.password" />
          </label>
          <input
            className={`sign-in-input${
              this.props.hasError ? " auth-input-error" : ""
            }`}
            type="password"
            spellCheck="false"
            value={this.props.password}
            onChange={this.handlePasswordChange.bind(this)}
          ></input>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    email: state.AuthReducer.email,
    password: state.AuthReducer.password,
    hasError: state.AuthReducer.hasError,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
  forwardRef: true,
})(injectIntl(SignInForm, { forwardRef: true }));
