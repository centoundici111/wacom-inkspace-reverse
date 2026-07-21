import React, { Component } from "react";
import { connect } from "react-redux";
import { routerActions } from "react-router-redux";
import { bindActionCreators } from "redux";
import { selectTool } from "../../../actions/edit";
import { closeDialog } from "../../../actions/modals";

const Colors = [
	"#D80000",
	"#F5D328",
	"#84BD00",
	"#BB3E9A",
	"#51A7F9",
	"#FF6E03",
	"#EEEEEE",
	"#6B6B6B",
	"#000000",
];

class ColorPaletteModal extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedColor: this.props.config.settings.selectedColor,
		};
	}

	onColorClick(color) {
		DBManager.edit(DBManager.entities.SETTINGS, {
			selectedColor: color,
		}).then(() => {
			WILL.setColorFromHex(color);

			if (this.props.config.settings.context === "editMode") {
				this.props.selectTool("pen");
			}

			this.props.closeDialog(this.props.config.onclose);
		});
	}

	render() {
		return (
			<div className="color-pallet-container">
				{Colors.map((color) => (
					<a className="color-pallet-dot-wrapper" key={Math.random()}>
						<span
							className={`color-palette-dot${
								this.state.selectedColor === color
									? " selected"
									: ""
							}`}
							key={Math.random()}
							style={{ backgroundColor: color }}
							onClick={() => this.onColorClick(color)}
						></span>
					</a>
				))}
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(
		{ ...routerActions, closeDialog, selectTool },
		dispatch
	);
}

export default connect(mapStateToProps, mapDispatchToProps, undefined, {
	forwardRef: true,
})(ColorPaletteModal);
