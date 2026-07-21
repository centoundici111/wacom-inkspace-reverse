import { push } from "react-router-redux";
import { Note } from "../../scripts/Note";
import PromiseQueue from "../../scripts/PromiseQueue";
import * as ActionTypes from "../constants/ActionTypes";
import * as Modals from "../constants/Modals";
import { addNotification } from "./app";
import { closeDialog, openDialog } from "./modals";

const EMPTY_LANDSCAPE_THUMB =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHUAAABQCAYAAAAnZTo5AAAAO0lEQVR4Ae3BMQEAAADCIPunXgsvYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwFkpAAAcCmfVcAAAAASUVORK5CYII=";
const EMPTY_PORTRAIT_THUMB =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAB1CAYAAADZcGYoAAAAO0lEQVR4Ae3BMQEAAADCIPunXg0PYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwJkrUAARgK5x4AAAAASUVORK5CYII=";

let queue = new PromiseQueue();

function initLiveMode(callback) {
	return (dispatch, getState) => {
		let { newNote } = getState().LiveReducer;
		const deviceModel = DeviceManager.getDeviceModel();

		if (newNote) {
			let note = new Note({
				size: deviceModel.size,
				transform: deviceModel.transform,
				locale: LocalesManager.defaultNoteLocale,
			});

			note.addLayer();

			dispatch({ type: ActionTypes.LIVE_MODE_INIT, body: note });

			if (typeof callback == "function") {
				callback();
			}
		} else {
			let originalNote = ContentManager.getNote(
				ContentManager.selected.first
			);

			if (
				originalNote.size.width !== deviceModel.size.width ||
				originalNote.size.height !== deviceModel.size.height
			) {
				dispatch(push("/library"));
				dispatch(closeDialog());
				dispatch(openDialog(Modals.NOT_SUPPORTED_LIVE_MODE));
			} else if (originalNote) {
				let note = originalNote.clone(false);

				DBManager.getPageLayers(note.pageId)
					.then((layers) => (note.layers = layers))
					.then(() => {
						dispatch({
							type: ActionTypes.LIVE_MODE_INIT,
							body: note,
						});

						UAManager.edit("Edit Content", "Open Canvas");

						if (typeof callback == "function") {
							callback();
						}
					});

				dispatch(closeDialog());
			} else {
				dispatch(push("/library"));
				dispatch(closeDialog());
			}
		}
	};
}

function updatePreview(...indexes) {
	return (dispatch, getState) => {
		let { note, previews } = getState().LiveReducer;
		let emptyThumb = note.isLandscape()
			? EMPTY_LANDSCAPE_THUMB
			: EMPTY_PORTRAIT_THUMB;

		let exportLayerPreview = (index) => {
			let preview = new Note({
				size: note.size,
				transform: note.transform,
				locale: note.locale,
				layers: [note.layers[index]],
			});

			queue
				.then(() => {
					if (note.layers[index].strokes.length == 0) {
						let base64Image = emptyThumb.substring(
							"data:image/png;base64,".length
						);
						return base64Image;
					} else return DBManager.exportLayerPreview(preview);
				})
				.then((base64Image) => {
					let image = "data:image/png;base64," + base64Image;
					let previews = getState().EditReducer.previews;

					previews[index] = image;
				})
				.catch(console.error);
		};

		indexes.forEach((index) => exportLayerPreview(index));
	};
}

function addLayer() {
	return (dispatch, getState) => {
		let { note } = getState().LiveReducer;

		if (
			note.layers.length > 0 &&
			!note.layers[note.layers.length - 1].isEmpty()
		) {
			note.addLayer();

			dispatch({ type: ActionTypes.LIVE_MODE_ADD_LAYER });
			dispatch(addNotification("notification.livemode.newLayer"));
		}
	};
}

function addStroke(stroke) {
	return (dispatch, getState) => {
		let { note } = getState().LiveReducer;
		note.layers[note.layers.length - 1].strokes.push(stroke);

		dispatch({ type: ActionTypes.LIVE_MODE_ADD_STROKE, body: note });
	};
}

function triggerSaveNote() {
	return (dispatch, getState) => {
		let { note, lastModifiedDate } = getState().LiveReducer;

		if (lastModifiedDate && note.lastModifiedDate != lastModifiedDate) {
			dispatch(saveNote(true));
		} else {
			dispatch(closeNote());
		}
	};
}

function transferToLibrary() {
	return (dispatch, getState) => {
		let { note, lastModifiedDate } = getState().LiveReducer;

		if (lastModifiedDate && note.lastModifiedDate != lastModifiedDate) {
			dispatch(saveNote(true));
		} else {
			dispatch(closeNote());
		}
	};
}

function closeNote() {
	return (dispatch, getState) => {
		if (AppManager.closing) AppManager.confirmSaveNote();
		else {
			queue.cancel();
			dispatch(push("/library"));
		}
	};
}

function saveNote(shouldCloseNote = true) {
	return (dispatch, getState) => {
		let { note, lastModifiedDate } = getState().LiveReducer;
		note.layers = note.layers.filter((layer) => layer.strokes.length > 0);
		note.lastModifiedDate = lastModifiedDate;

		if (note && note.layers.length) {
			UAManager.edit("Edit Content", "Save Canvas");

			DBManager.editNotes([note])
				.then(() => ContentManager.updateSections())
				.then(() => {
					dispatch(addNotification("notification.edit.noteSaved"));
					if (shouldCloseNote) {
						dispatch(closeNote());
					}
				})
				.catch((e) => {
					console.error(e);
				});
		}
	};
}

function finalizeLiveMode() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.LIVE_MODE_FINALIZE });
	};
}

export {
	addNotification,
	initLiveMode,
	addLayer,
	addStroke,
	saveNote,
	finalizeLiveMode,
	updatePreview,
	transferToLibrary,
	triggerSaveNote,
	closeNote,
};
