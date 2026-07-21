import { Circle, Line } from "rc-progress";
import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import DeviceModel from "../../../scripts/DeviceModel";
import DrawingTool from "../../../scripts/DrawingTool";
import * as actions from "../../actions/live";
import ReactUtils from "../../globals/ReactUtils";
import CanvasContainer from "./CanvasContainer";

class LiveNote extends Component {
	constructor(props) {
		super(props);

		this.state = {
			deviceModel: new DeviceModel(
				this.props.note.size,
				this.props.note.orientation
			),
			progress: false,
			percent: 0,
		};
	}

	componentDidMount() {
		let { note } = this.props;

		WILL.init(new DeviceModel(note.size, note.orientation), {
			liveMode: true,
			addStroke: this.props.addStroke,
			updatePreview: this.props.updatePreview,
			startProgress: () => {
				this.setState({ progress: true, percent: 0 });
				global.updateState({ noteProgress: true });
				if (this.props.parent.state.progress)
					this.props.parent.setState({ percent: 0 });
			},
			updateProgress: (percent) => {
				this.setState({ percent });

				if (this.props.parent.state.progress)
					this.props.parent.setState({ percent });
			},
			completeProgress: () => {
				if (!this.state.progress) {
					if (this.props.parent.state.progress)
						this.props.parent.setState({ progress: false }, () =>
							WILL.context2D.fitToScreen()
						);

					return;
				}

				this.setState({ percent: 100 });

				if (this.props.parent.state.progress)
					this.props.parent.setState({ percent: 100 });

				setTimeout(() => {
					this.setState({ progress: false });
					global.updateState({ noteProgress: false, pasting: false });

					if (this.props.parent.state.progress)
						this.props.parent.setState({ progress: false }, () =>
							WILL.context2D.fitToScreen()
						);
				}, 200);
			},
		});

		let lastPoint;

		DeviceManager.liveNewPage = () => {
			if (lastPoint) {
				WILL.endStroke(lastPoint);
				lastPoint = undefined;
			}

			this.props.saveNote(false);
			this.props.finalizeLiveMode();
			this.props.initLiveMode();
		};

		DeviceManager.liveNewLayer = () => {
			if (lastPoint) {
				WILL.endStroke(lastPoint);
				lastPoint = undefined;
			}

			this.props.addLayer();
		};

		DeviceManager.liveStrokeStart = (timestamp, penType, penID) => {
			let tool = WILL.tools.getPen(DeviceManager.type, penType);
			tool.activatePathBuilder(DrawingTool.PathBuilderType.PRESSURE);

			WILL.setTool(tool);
		};

		DeviceManager.livePointReceived = (phase, point, path) => {
			if (!WILL.tool) {
				if (phase == 0) console.warn("Points received, tool not found");
				return;
			}

			switch (phase) {
				case 0:
					lastPoint = point;
					WILL.beginStroke(point);
					break;
				case 1:
					lastPoint = point;
					WILL.moveStroke(point);
					break;
				case 2:
					if (path) WILL.path = path;

					lastPoint = undefined;
					WILL.endStroke(point);
					break;
			}
		};

		WILL.clear();
		WILL.setCurrentLayer(this.props.note.layers.length - 1);

		this.setState({ progress: this.props.noteProgress }, () => {
			WILL.setLayers(this.props.note.layers);
		});
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.layerAdded != this.props.layerAdded) {
			WILL.setCurrentLayer(this.props.note.layers.length - 1);
			WILL.setLayers(this.props.note.layers);
		}

		if (prevProps.note != this.props.note) {
			WILL.setCurrentLayer(this.props.note.layers.length - 1);
			WILL.setLayers(this.props.note.layers);
		}
	}

	componentWillUnmount() {
		WILL.finalize();

		delete DeviceManager.livePointReceived;
		delete DeviceManager.liveStrokeStart;
		delete DeviceManager.liveNewLayer;
		delete DeviceManager.liveNewPage;
	}

	render() {
		let classes = "edit";
		if (this.state.progress) {
			classes += " flex-wrapper";
		}

		return (
			<div className="content">
				<div className={classes}>
					{(() =>
						this.state.progress ? this.renderLoader() : null)()}
				</div>
				<CanvasContainer />
			</div>
		);
	}

	renderLoader() {
		let style =
			this.state.percent == -1
				? { transform: `rotate(${this.state.rotation}deg)` }
				: null;
		let percent = this.state.percent == -1 ? 25 : this.state.percent;
		let percentStyle =
			this.state.percent == -1 ? { visibility: "hidden" } : null;

		if (this.state.percent == -1) setTimeout(this.rotate, 30);

		return (
			<div className="loading">
				<div className="progress-bar">
					<Circle
						percent={percent}
						strokeWidth="2"
						strokeColor="#00AEEF"
						style={style}
					/>
				</div>
				<div className="details">
					<FormattedMessage id={"edit.loading.content"} />
				</div>
				<div className="subdetails" style={percentStyle}>
					{Math.ceil(this.state.percent)}%
				</div>
			</div>
		);
	}

	renderProgressBar() {
		let surfaceSize = this.state.deviceModel.getSurfaceSize(
			WILL.context2D.transformScaleFactor
		);
		let surfaceStyle = {
			width: surfaceSize.width,
			height: surfaceSize.height,
		};

		return (
			<div className="progress-bar-protector flex-wrapper">
				<div
					className="progress-bar-surface flex-wrapper"
					style={surfaceStyle}
				>
					<div className="edit-progress-bar">
						<Line
							percent={this.state.percent}
							strokeWidth="2"
							strokeColor="#00AEEF"
						/>
					</div>
				</div>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		note: state.LiveReducer.note,
		layerAdded: state.LiveReducer.layerAdded,
		noteProgress: state.LiveReducer.noteProgress,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(actions, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ReactUtils.createParentTracker(LiveNote));
