import React, { Component } from "react";
import { FormattedMessage, injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/modals";
import AuthenticationManager from "../../globals/AuthenticationManager";

class SignUpProfileForm extends Component {
  constructor(props) {
    super(props);
  }

  handleFirstNameChange(args) {
    this.props.handleFirstNameChange(args.target.value);
    this.props.validateSignUpFormProfile();
  }

  handleLastNameChange(args) {
    this.props.handleLastNameChange(args.target.value);
    this.props.validateSignUpFormProfile();
  }

  handleCountryChange(args) {
    let selectedIndex = args.target.options.selectedIndex;
    let value = args.target.options[selectedIndex].getAttribute("data-key");

    this.props.handleCountryChange(value);
    this.props.validateSignUpFormProfile();
  }

  componentDidMount() {
    AuthenticationManager.getCountries().then((result) => {
      let resultObj = JSON.parse(result);

      this.props.initCountries(resultObj.countries);
    });
  }

  render() {
    let values = [];

    Object.keys(this.props.countries).forEach((key) => {
      values.push({ key: key, value: this.props.countries[key] });
    });

    let optionTemplate = values.map((country) => (
      <option key={country.key} data-key={country.key} value={country.value}>
        {country.value}
      </option>
    ));

    return (
      <form className="remove-margin">
        <div className="flex-column">
          <label
            className="sign-up-profile-text remove-margin"
            htmlFor="firstName"
          >
            <FormattedMessage id="auth.sign.up.first.name" />
            <sup>*</sup>
          </label>
          <input
            id="firstName"
            className="sign-up-profile-input"
            type="text"
            spellCheck="false"
            value={this.props.firstName}
            onChange={this.handleFirstNameChange.bind(this)}
          ></input>
        </div>
        <div className="flex-column">
          <label
            className="sign-up-profile-text remove-margin"
            htmlFor="lastName"
          >
            <FormattedMessage id="auth.sign.up.last.name" />
            <sup>*</sup>
          </label>
          <input
            id="lastName"
            className="sign-up-profile-input"
            type="text"
            spellCheck="false"
            value={this.props.lastName}
            onChange={this.handleLastNameChange.bind(this)}
          ></input>
        </div>
        <div className="flex-column">
          <label
            className="sign-up-profile-text remove-margin"
            htmlFor="countries"
          >
            <FormattedMessage id="auth.sign.up.country" />
            <sup>*</sup>
          </label>
          <div className="top-bottom-padding-5"></div>
          <select
            className="sign-up-profile-select-input"
            id="countries"
            defaultValue={this.props.country}
            onChange={this.handleCountryChange.bind(this)}
          >
            <option disabled value="">
              {this.props.intl.formatMessage({
                id: "auth.sign.up.select.country",
              })}
            </option>
            {optionTemplate}
          </select>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    firstName: state.AuthReducer.firstName,
    lastName: state.AuthReducer.lastName,
    country: state.AuthReducer.country,
    countries: state.AuthReducer.countries,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
  forwardRef: true,
})(injectIntl(SignUpProfileForm, { forwardRef: true }));
