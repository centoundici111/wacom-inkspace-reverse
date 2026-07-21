import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/modals";

class SignUpSettingsForm extends Component {
  constructor(props) {
    super(props);
  }

  handlePrivacyPolicyChange(args) {
    this.props.handlePrivacyPolicyChange(args.target.checked);
    this.props.validateSignUpFormSettings();
  }

  handleTermsOfUseChange(args) {
    this.props.handleTermsOfUseChange(args.target.checked);
    this.props.validateSignUpFormSettings();
  }

  handleMarketingConsentChange(args) {
    this.props.handleMarketingConsentChange(args.target.checked);
  }

  render() {
    return (
      <form className="remove-margin">
        <div className="flex-column">
          <div className="flex-row">
            <input
              className="blue"
              id="privacy"
              type="checkbox"
              defaultChecked={this.props.privacyPolicy}
              onChange={this.handlePrivacyPolicyChange.bind(this)}
            />
            <label htmlFor="privacy">
              <span className="indicator"></span>
              <span className="sign-in-label">
                <FormattedMessage id="auth.sign.up.privacy.policy" />
              </span>
            </label>
          </div>
          <div className="top-bottom-padding-20"></div>
          <div className="flex-row">
            <input
              className="blue"
              id="termsOfUse"
              type="checkbox"
              defaultChecked={this.props.termsOfUse}
              onChange={this.handleTermsOfUseChange.bind(this)}
            />
            <label htmlFor="termsOfUse">
              <span className="indicator"></span>
              <span className="sign-in-label">
                <FormattedMessage id="auth.sign.up.terms.of.use" />
              </span>
            </label>
          </div>
          <div className="top-bottom-padding-20"></div>
          <div className="flex-row">
            <input
              className="blue"
              id="marketingConsent"
              type="checkbox"
              defaultChecked={this.props.marketingConsent}
              onChange={this.handleMarketingConsentChange.bind(this)}
            />
            <label htmlFor="marketingConsent">
              <span className="indicator"></span>
              <span className="sign-in-label">
                <FormattedMessage id="auth.sign.up.marketing.consent" />
              </span>
            </label>
          </div>
        </div>
        <div className="top-bottom-padding-20"></div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    privacyPolicy: state.AuthReducer.privacyPolicy,
    termsOfUse: state.AuthReducer.termsOfUse,
    marketingConsent: state.AuthReducer.marketingConsent,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
  forwardRef: true,
})(injectIntl(SignUpSettingsForm, { forwardRef: true }));
