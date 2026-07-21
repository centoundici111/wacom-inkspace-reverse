import React, { Component } from "react";
import { FormattedMessage } from "react-intl";

class Button extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked: false,
      click: null,
    };
  }

  editClick(click) {
    if (this.props.autoDisable)
      this.setState({ click: (e) => this.setState({ clicked: true }, click) });
    else this.setState({ click: click });
  }

  editClicked(clicked) {
    this.setState({ clicked: clicked });
  }

  componentDidMount() {
    this.editClick(this.props.click);
    this.editClicked(this.props.clicked ?? false);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.click != prevProps.click) {
      this.editClick(this.props.click);
    }

    if (this.props.clicked != prevProps.clicked) {
      this.editClicked(this.props.clicked);
    }
  }

  render() {
    let classes = this.props.skipDefaultStyle ? [""] : ["btn"];
    const Icon = this.props.icon;

    if (this.props.className)
      classes = classes.concat(this.props.className.split(/\s+/g));

    if (this.state.clicked) classes.push("disabled");

    if (this.props.classNameSource) {
      let condClasses = this.props.classNameSource(this.props.name);
      if (condClasses && typeof condClasses == "string")
        condClasses = [condClasses];
      if (condClasses) classes = classes.concat(condClasses);
    }

    return (
      <a onClick={this.state.click} className={classes.join(" ")}>
        {this.props.text ? <FormattedMessage id={this.props.text} /> : <></>}
        {this.props.icon ? <Icon></Icon> : <></>}
      </a>
    );
  }
}

export default Button;
