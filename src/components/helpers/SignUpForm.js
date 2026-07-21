import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/modals";
import * as ActionTypes from "../../constants/ActionTypes";

class SignUpForm extends Component {
  constructor(props) {
    super(props);
  }

  handleEmailChange(args) {
    this.props.handleEmailChange(args.target.value, ActionTypes.AUTH_SIGN_UP);
    this.props.isEmailEmpty();
    this.props.isEmailValid();
    this.props.validateSignUpForm();
  }

  handleEmailKeyUp() {
    this.props.isEmailAvailable();
  }

  handlePasswordChange(args) {
    this.props.handlePasswordChange(
      args.target.value,
      ActionTypes.AUTH_SIGN_UP
    );
    this.props.isPasswordEmpty();
    this.props.isPasswordValid();
    this.props.arePasswordsEqual();
    this.props.validateSignUpForm();
  }

  handleRepeatPasswordChange(args) {
    this.props.handleRepeatPasswordChange(
      args.target.value,
      ActionTypes.AUTH_SIGN_UP
    );
    this.props.isRepeatPasswordEmpty();
    this.props.isRepeatPasswordValid();
    this.props.arePasswordsEqual();
    this.props.validateSignUpForm();
  }

  render() {
    return (
      <form className="remove-margin">
        <div className="flex-column">
          <label
            className={`sign-in-email-text remove-margin${
              this.props.hasEmptyEmail || this.props.hasValidEmail
                ? ""
                : " auth-label-error"
            }`}
            htmlFor="email"
          >
            <FormattedMessage id="auth.sign.email" />
          </label>
          <input
            className={`sign-up-input-email${
              this.props.hasEmptyEmail || this.props.hasValidEmail
                ? ""
                : " auth-input-error"
            }`}
            type="email"
            spellCheck="false"
            value={this.props.email}
            onChange={this.handleEmailChange.bind(this)}
            onKeyUp={this.handleEmailKeyUp.bind(this)}
          ></input>
          <label
            className={`auth-error-text${
              this.props.hasEmptyEmail ||
              !this.props.hasValidEmail ||
              this.props.hasAvailableEmail
                ? ""
                : " visible"
            }`}
          >
            <FormattedMessage id="auth.sign.up.email.not.available" />
          </label>
        </div>
        <div className="flex-column">
          <label
            className={`sign-in-password-text remove-margin${
              this.props.hasEmptyPassword || this.props.hasValidPassword
                ? ""
                : " auth-label-error"
            }`}
            htmlFor="password"
          >
            <FormattedMessage id="auth.sign.password" />
          </label>
          <input
            className={`sign-up-input-password${
              this.props.hasEmptyPassword || this.props.hasValidPassword
                ? ""
                : " auth-input-error"
            }`}
            type="password"
            spellCheck="false"
            value={this.props.password}
            onChange={this.handlePasswordChange.bind(this)}
          ></input>
        </div>
        <div className="flex-column">
          <label
            className={`sign-in-password-text remove-margin${
              this.props.hasEmptyRepeatPassword ||
              this.props.hasValidRepeatPassword
                ? ""
                : " auth-label-error"
            }`}
            htmlFor="password"
          >
            <FormattedMessage id="auth.sign.up.reenter.password" />
          </label>
          <input
            className={`sign-up-input-repeat-password${
              this.props.hasEmptyRepeatPassword ||
              this.props.hasValidRepeatPassword
                ? ""
                : " auth-input-error"
            }`}
            type="password"
            spellCheck="false"
            value={this.props.repeatPassword}
            onChange={this.handleRepeatPasswordChange.bind(this)}
          ></input>
          <label
            className={`auth-error-text${
              this.props.hasEmptyRepeatPassword || this.props.hasEqualPasswords
                ? ""
                : " visible"
            }`}
          >
            <FormattedMessage id="auth.sign.up.password.does.not.match" />
          </label>
        </div>
        <div className="flex-row sign-in-login-container"></div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    email: state.AuthReducer.email,
    password: state.AuthReducer.password,
    hasValidEmail: state.AuthReducer.hasValidEmail,
    hasAvailableEmail: state.AuthReducer.hasAvailableEmail,
    hasEmptyEmail: state.AuthReducer.hasEmptyEmail,
    hasEmptyPassword: state.AuthReducer.hasEmptyPassword,
    hasEmptyRepeatPassword: state.AuthReducer.hasEmptyRepeatPassword,
    hasValidPassword: state.AuthReducer.hasValidPassword,
    hasValidRepeatPassword: state.AuthReducer.hasValidRepeatPassword,
    hasEqualPasswords: state.AuthReducer.hasEqualPasswords,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
  forwardRef: true,
})(injectIntl(SignUpForm, { forwardRef: true }));
