import Tooltip from "rc-tooltip";
import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { bindActionCreators } from "redux";
import * as actions from "../../actions/edit";
import { dispatch } from "../../actions/generic";
import { closeDialog, openDialog } from "../../actions/modals";
import * as Modals from "../../constants/Modals";
import BlackColorIcon from "../icons/edit/BlackColorIcon.svg";
import WhiteColorIcon from "../icons/edit/WhiteColorIcon.svg";

class ColorPalette extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedColor: "",
		};

		this.onCloseDialog = this.onCloseDialog.bind(this);

		DBManager.get(DBManager.entities.SETTINGS).then((settings) => {
			let color = settings.selectedColor ?? "#000000";

			this.setState({
				selectedColor: color,
			});

			WILL.setColorFromHex(color);
		});
	}

	onCloseDialog() {
		DBManager.get(DBManager.entities.SETTINGS).then((settings) => {
			this.setState({ selectedColor: settings.selectedColor });
		});
	}

	onButtonClicked() {
		dispatch(
			this.props.openDialog(Modals.COLOR_PALETTE, {
				onclose: this.onCloseDialog,
				selectedColor: this.state.selectedColor,
				context: this.props.context,
			})
		);
	}

	render() {
		return (
			<Tooltip
				placement={"bottom"}
				destroyTooltipOnHide={true}
				overlay={
					<div>
						<FormattedMessage id={"tooltip.color"} />
					</div>
				}
				align={{ offset: [0, 10] }}
			>
				<a className="icon" onClick={this.onButtonClicked.bind(this)}>
					<span
						className="color-palette-dot"
						style={{ backgroundColor: this.state.selectedColor }}
					>
						{this.state.selectedColor === "#EEEEEE" ||
						this.state.selectedColor === "#F5D328" ? (
							<BlackColorIcon />
						) : (
							<WhiteColorIcon />
						)}
					</span>
				</a>
			</Tooltip>
		);
	}
}

function mapStateToProps(state) {
	return {};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(
		{ ...actions, openDialog, closeDialog },
		dispatch
	);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withRouter(ColorPalette));
