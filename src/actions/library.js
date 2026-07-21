import { push } from "react-router-redux";
import { v4 as uuidv4 } from "uuid";
import DeviceModel from "../../scripts/DeviceModel";
import { Note } from "../../scripts/Note";
import { comparator } from "../../scripts/utils";
import * as ActionTypes from "../constants/ActionTypes";
import * as Modals from "../constants/Modals";
import ContentManager from "../globals/ContentManager";
import { addNotification } from "./app";
import { closeDialog, openDialog } from "./modals";

let lastRefresh = Date.now();

function updateContext(context) {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.LIBRARY_UPDATE_CONTEXT, body: context });
	};
}

function refreshLibrary() {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.LIBRARY_REFRESH,
			body: Date.now() - lastRefresh,
		});
		lastRefresh = Date.now();
	};
}

function refreshGroups() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.GROUPS_REFRESH });
	};
}

function editGroupRelations(group, cache) {
	return (dispatch, getState) => {
		ContentManager.editEntityRelation(group, cache);

		DBManager.setEntity(group.entity).then(() => {
			if (
				cache &&
				(cache[group.id].length == ContentManager.selected.length ||
					ContentManager.selected.length == 0)
			)
				dispatch(
					addNotification("notification.note.from.group.removed", {
						group: group.name,
					})
				);
			else
				dispatch(
					addNotification("notification.note.to.group.added", {
						group: group.name,
					})
				);
		});
	};
}

function deleteNotes(noteIDs) {
	return (dispatch, getState) => {
		if (!noteIDs.length) return;
		DBManager.deleteNotes(noteIDs).catch(console.error);
	};
}

function rotateNotes(noteIds) {
	return (dispatch, getState) => {
		let { rotateInProgress, rotateTransformDelta } =
			getState().LibraryReducer;
		if (rotateInProgress) return;

		let rotateTransform = (rotateTransformDelta * 90) % 360;

		dispatch({ type: ActionTypes.ROTATE_TRANSFORM_START });

		if (noteIds.length > 0) {
			if (rotateTransform == 0)
				dispatch({
					type: ActionTypes.ROTATE_TRANSFORM_COMPLETE,
					body: rotateTransform,
				});
			else {
				let currentNotes = noteIds.map(
					(id) => ContentManager.notes[id]
				);

				currentNotes.forEach((note) => {
					let deviceModel = new DeviceModel(
						note.size,
						(note.orientation + rotateTransformDelta) % 4
					);
					note.transform = deviceModel.transform;
					note.touch();
				});

				let promises = currentNotes.map((note) => {
					return DBManager.getPageLayers(note.pageId).then(
						(layers) => {
							note.layers = layers;
						}
					);
				});

				Promise.all(promises)
					.then(() => DBManager.editNotes(currentNotes))
					.then(() => {
						dispatch({
							type: ActionTypes.ROTATE_TRANSFORM_COMPLETE,
							body: rotateTransform,
						});
						dispatch(
							addNotification(
								"notification.note.rotate.succesfully"
							)
						);
					})
					.catch(console.error);
			}
		}
	};
}

function rotateTransformAdd90deg() {
	return (dispatch, getState) => {
		let { rotateInProgress, rotateTransform, rotateTransformDelta } =
			getState().LibraryReducer;

		if (!rotateInProgress) {
			dispatch({
				type: ActionTypes.ROTATE_TRANSFORM,
				body: {
					rotateTransform: (rotateTransform + 90) % 360,
					rotateTransformDelta: (rotateTransformDelta + 1) % 4,
				},
			});
		}
	};
}

function combineNotes(noteIDs) {
	return (dispatch, getState) => {
		let libraryState = getState().LibraryReducer;
		let combining = libraryState.combining;

		if (!combining && noteIDs.length > 1) {
			let notes = noteIDs.map((noteID) => ContentManager.getNote(noteID));

			if (
				!notes.every(
					(note) =>
						note.orientation == notes[0].orientation &&
						note.size.width == notes[0].size.width &&
						note.size.height == notes[0].size.height
				)
			)
				dispatch(
					addNotification(
						"notification.note.differentSizes.notCombined"
					)
				);
			else {
				dispatch({ type: ActionTypes.COMBINE_NOTES_START });

				notes.sort(
					comparator({ sortBy: "creationDate", sortOrder: "asc" })
				);

				const seen = {};
				const tags = []
					.concat(...notes.map((note) => note.tags))
					.filter((tag) => {
						if (!seen[tag.toLowerCase()]) {
							seen[tag.toLowerCase()] = true;
							return true;
						}

						return false;
					});

				let targetNote = notes.first.clone(true);
				targetNote.tags = tags;
				targetNote.touch();

				let promises = notes.map((note) => {
					return DBManager.getPageLayers(note.pageId).then(
						(layers) => {
							note.layers = layers;
						}
					);
				});

				let notesGroups = [].concat(
					...notes.map((note) =>
						ContentManager.getEntityRelations("groups", note.id)
					)
				);

				return Promise.all(promises)
					.then(() => {
						let newLayers = [].concat.apply(
							[],
							notes.map((note) => note.layers)
						);
						newLayers.forEach((layer) => {
							layer.id = uuidv4();
						});
						targetNote.layers = targetNote.layers.concat(newLayers);

						targetNote.renew();

						DBManager.editNotes([targetNote])
							.then(() => {
								if (notesGroups.length > 0) {
									notesGroups.forEach((group) =>
										group.addRelation(targetNote.id)
									);
									return DBManager.setEntity(
										ContentManager.getEntity("groups")
									);
								} else return Promise.resolve();
							})
							.then(() => {
								ContentManager.replace(notes, targetNote);
								ContentManager.select([targetNote.id]);
								ContentManager.updateSections();

								dispatch({
									type: ActionTypes.COMBINE_NOTES_COMPLETE,
								});
								dispatch(
									addNotification(
										"preview.items.combined.succesfully"
									)
								);

								return DBManager.deleteNotes(
									notes.map((note) => note.id)
								);
							})
							.catch(console.error);
					})
					.catch(console.error);
			}
		}
	};
}

function exportNote(message) {
	return (dispatch, getState) => {
		let note = ContentManager.getNote(ContentManager.selected.first);

		if (message.extension == ".mp4") {
			HWRClient.export("mp4", note)
				.then((taskURL) => {
					UIManager.openExternal(taskURL);
				})
				.catch((e) => {
					dispatch(closeDialog());

					if (e instanceof TypeError)
						dispatch(addNotification("server.cannotConnect"));
					else if (e.message == "NOT_AUTHORIZED")
						dispatch(addNotification("server.notAuthorized"));
					else dispatch(addNotification("server.error"));
				});

			return;
		}

		UIManager.showSaveDialog(
			message.title,
			"InkspaceFile" + message.extension,
			function (filePath) {
				if (filePath === undefined || filePath === "") return;
				if (filePath.indexOf(message.extension) == -1)
					filePath += message.extension;

				UAManager.export(message.extension.substring(1).toUpperCase());

				dispatch(
					openDialog(Modals.EXPORTING_NOTE, {
						title: message.title,
						video: message.extension == ".mp4",
					})
				);

				if (message.extension == ".docx") {
					HWRClient.export("doc", note)
						.then((buffer) => {
							IOManager.writeFile(
								filePath,
								Buffer.from(buffer),
								(err) => {
									dispatch(closeDialog());

									if (err) {
										if (err.type == "IGNORE") return;

										dispatch(
											addNotification(
												"notification.note.exported.not.succesfully"
											)
										);
										dispatch(addNotification(err.message));
									} else
										dispatch(
											addNotification(
												"notification.note.exported.succesfully"
											)
										);
								}
							);
						})
						.catch((e) => {
							dispatch(closeDialog());

							if (e instanceof TypeError)
								dispatch(
									addNotification("server.cannotConnect")
								);
							else if (e.message == "NOT_AUTHORIZED")
								dispatch(
									addNotification("server.notAuthorized")
								);
							else dispatch(addNotification("server.error"));
						});
				} else if (message.extension == ".mp4") {
					// console.log("...... video")
				} else {
					DBManager.exportNote(
						note.id,
						message.extension.toUpperCase().substring(1)
					).then((input) => {
						let buffer = Buffer.from(input);

						IOManager.writeFile(filePath, buffer, (err) => {
							dispatch(closeDialog());

							if (err) {
								if (err.type == "IGNORE") return;

								dispatch(
									addNotification(
										"notification.note.exported.not.succesfully"
									)
								);
								dispatch(addNotification(err.message));
							} else
								dispatch(
									addNotification(
										"notification.note.exported.succesfully"
									)
								);
						});
					});
				}
			}
		);
	};
}

function selectNotes(noteIDs) {
	if (typeof noteIDs == "string") noteIDs = [noteIDs];

	return (dispatch, getState) => {
		ContentManager.select(noteIDs);
	};
}

function executeSearch(searchTerm) {
	return (dispatch, getState) => {
		const appState = getState().AppReducer;

		HWRClient.searchText(searchTerm)
			.then((results) => {
				ContentManager.setSearchData(results, () =>
					dispatch({
						type: ActionTypes.LIBRARY_SEARCH_FETCH,
						body: searchTerm,
					})
				);

				UAManager.cloud("Search", "Search Successful", results.length);
			})
			.catch((e) => {
				if (e instanceof TypeError)
					dispatch(addNotification("server.cannotConnect"));
				else if (e.message == "NOT_AUTHORIZED") {
					dispatch(hideSearch());
					dispatch(addNotification("server.notAuthorized"));
				} else dispatch(addNotification("server.error"));
			});
	};
}

function closeSearchResultSet() {
	return (dispatch, getState) => {
		ContentManager.setSearchData(null);

		dispatch({ type: ActionTypes.LIBRARY_SEARCH_RESULT_CLOSE });
	};
}

function showSearch() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.LIBRARY_SEARCH_SHOW });
	};
}

function hideSearch() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.LIBRARY_SEARCH_HIDE });
	};
}

function filterByTag(tag) {
	return (dispatch, getState) => {
		if (tag) dispatch(closeDialog());

		let onUpdate = ContentManager.onUpdate;

		ContentManager.onUpdate = () =>
			dispatch({ type: ActionTypes.LIBRARY_SET_TAG, body: tag });
		ContentManager.filter(ContentManager.FilterType.TAG, tag);
		ContentManager.onUpdate = onUpdate;
	};
}

function filterByGroup(group) {
	return (dispatch, getState) => {
		let groupID = group ? group.id : null;

		let onUpdate = ContentManager.onUpdate;

		ContentManager.onUpdate = () =>
			dispatch({ type: ActionTypes.LIBRARY_SET_GROUP, body: groupID });
		ContentManager.filter(ContentManager.FilterType.GROUP, group);
		ContentManager.onUpdate = onUpdate;
	};
}

function setExportLanguage(language) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.MODALS_SET_EXPORT_LANGUAGE,
			body: language,
		});
	};
}

function exportAsText(exportLocale) {
	return (dispatch, getState) => {
		let note = ContentManager.getNote(ContentManager.selected.first);

		if (!exportLocale) {
			exportLocale = note.locale;
		}

		dispatch({
			type: ActionTypes.MODALS_SET_EXPORT_LANGUAGE,
			body: exportLocale,
		});

		HWRClient.export("txt", note, exportLocale)
			.then((recognizedText) => {
				dispatch({
					type: ActionTypes.MODALS_SET_RECOGNIZED_TEXT,
					body: recognizedText,
				});
			})
			.catch((e) => {
				dispatch(closeDialog());

				if (e instanceof TypeError)
					dispatch(addNotification("server.cannotConnect"));
				else if (e.message == "NOT_AUTHORIZED")
					dispatch(addNotification("server.notAuthorized"));
				else dispatch(addNotification("server.error"));
			});
	};
}

function closeExportAsTextModal() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.MODALS_SET_RECOGNIZED_TEXT, body: "" });
		dispatch({ type: ActionTypes.MODAL_HIDE });
	};
}

function saveRecognizedText() {
	return (dispatch, getState) => {
		let libraryState = getState().LibraryReducer;
		let note = ContentManager.getNote(ContentManager.selected.first);
		let recognizedText = libraryState.recognizedText;
		let extension = ".txt";

		UIManager.showSaveDialog(null, "InkspaceFile.txt", function (filePath) {
			if (filePath === undefined || filePath === "") return;
			if (filePath.indexOf(extension) == -1) filePath += extension;

			IOManager.writeFile(
				filePath,
				Buffer.from(recognizedText),
				(err) => {
					if (err) {
						if (err.type == "IGNORE") return;

						dispatch(
							addNotification(
								"notification.note.exported.not.succesfully"
							)
						);
						dispatch(addNotification(err.message));
					} else
						dispatch(
							addNotification(
								"notification.note.exported.succesfully"
							)
						);
				}
			);
		});
	};
}

function setLastSync() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.SET_LAST_SYNC, body: new Date() });
	};
}

function setDeviceStatus(status) {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.SET_DEVICE_STATUS, body: status });
	};
}

function setBatteryCharge(batteryCharge) {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.SET_BATTERY_CHARGE, body: batteryCharge });
	};
}

function createNote() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.EDIT_CREATE_NOTE });
		dispatch(push("/creation"));
	};
}

function editNote() {
	return (dispatch, getState) => {
		dispatch(push("/creation"));
	};
}

function saveNotes() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.SAVE_NOTES_START });
		global.mainMenuManager.assignMenu("library");

		let extension = ".widd";
		let notes = ContentManager.getSelectedNotes();

		if (notes.length > 100) {
			dispatch({
				type: ActionTypes.SAVE_NOTES_COMPLETE,
			});
			dispatch(closeDialog());
			dispatch(openDialog(Modals.EXPORT_LIMIT_REACHED));
			return;
		}

		dispatch(closeDialog());
		dispatch(openDialog(Modals.SAVING_NOTES));

		let notesArray = [];
		let promises = [];

		notes.map((note) => {
			let result = DBManager.getPageLayers(note.pageId).then((layers) => {
				note.layers = layers;
				notesArray.push({ id: note.id, json: note.toWiddJSON() });
			});

			promises.push(result);
		});

		Promise.all(promises).then(() => {
			dispatch(closeDialog());

			if (notes.length === 1) {
				UIManager.showSaveDialog(
					null,
					`Inkspace_${notesArray.first.id.substring(
						notesArray.first.id.length - 12
					)}${extension}`,
					function (filePath) {
						if (filePath === undefined || filePath === "") {
							dispatch({
								type: ActionTypes.SAVE_NOTES_COMPLETE,
							});
							global.mainMenuManager.assignMenu("library");

							return;
						}

						IOManager.writeFile(
							filePath,
							JSON.stringify(notesArray.first.json),
							(err) => {
								if (err) {
									if (err.type == "IGNORE") return;

									dispatch(
										addNotification(
											"notification.note.exported.not.succesfully"
										)
									);
									dispatch(addNotification(err.message));
								} else {
									dispatch(
										addNotification(
											"notification.note.exported.succesfully"
										)
									);
								}

								dispatch({
									type: ActionTypes.SAVE_NOTES_COMPLETE,
								});
								global.mainMenuManager.assignMenu("library");
							}
						);
					}
				);
			} else {
				UIManager.showOpenDialog(
					null,
					function (filePath) {
						if (filePath.length === 0) {
							dispatch({
								type: ActionTypes.SAVE_NOTES_COMPLETE,
							});
							global.mainMenuManager.assignMenu("library");

							return;
						}

						IOManager.writeFiles(
							filePath,
							notesArray,
							extension,
							(err) => {
								if (err) {
									if (err.type == "IGNORE") return;

									dispatch(
										addNotification(
											"notification.note.exported.not.succesfully"
										)
									);
									dispatch(addNotification(err.message));
								} else {
									dispatch(
										addNotification(
											"notification.notes.exported.succesfully"
										)
									);
								}

								dispatch({
									type: ActionTypes.SAVE_NOTES_COMPLETE,
								});
								global.mainMenuManager.assignMenu("library");
							}
						);
					},
					"Save",
					["openDirectory"],
					[]
				);
			}
		});
	};
}

function loadNotes() {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.LOAD_NOTES_START });
		global.mainMenuManager.assignMenu("library");

		UIManager.showOpenDialog(
			null,
			function (filePaths) {
				if (filePaths.length === 0) {
					dispatch({
						type: ActionTypes.LOAD_NOTES_COMPLETE,
					});
					global.mainMenuManager.assignMenu("library");

					return;
				}

				Module.InkDecoder.getStrokeBrush = () => WILL.tools.pen.brush;

				let newNotes = [];

				// Do not change this UUID 4e5b3258-ef90-45b1-93eb-02482479fc4f as it used to identify that this function call comes from UWP app
				if (
					JSON.stringify(filePaths).includes(
						"4e5b3258-ef90-45b1-93eb-02482479fc4f"
					)
				) {
					IOManager.readFile(filePaths, "utf8", (err, data) => {
						if (err) {
							console.log(err);
							reject(err);
						} else {
							var notes = JSON.parse(data);

							if (notes.length > 100) {
								dispatch({
									type: ActionTypes.LOAD_NOTES_COMPLETE,
								});
								dispatch(closeDialog());
								dispatch(
									openDialog(Modals.EXPORT_LIMIT_REACHED)
								);
								return;
							}

							dispatch(closeDialog());
							dispatch(openDialog(Modals.LOADING_NOTES));

							let promises = notes.map((note) => {
								return new Promise((resolve, reject) => {
									note = JSON.parse(note);

									let newNote = new Note({
										locale: note.locale,
										title: note.title,
										size: parseBoundingBox(note),
										transform: parseMatrix(note),
										creationDate: note.created,
										modifiedDate: note.modified,
									});

									note.ink.map((layer) => {
										let decodedStrokes =
											Module.InkDecoder.decode(
												new Uint8Array(
													Buffer.from(layer, "base64")
												)
											);

										newNote.addLayer({
											lastModifiedDate:
												note.lastModifiedDate,
											strokes: decodedStrokes,
										});
									});

									newNotes.push(newNote);
									resolve();
								});
							});

							saveLoadedNotesToDB(promises, newNotes, dispatch);
						}
					});
				} else {
					if (filePaths.length > 100) {
						dispatch({
							type: ActionTypes.LOAD_NOTES_COMPLETE,
						});
						dispatch(closeDialog());
						dispatch(openDialog(Modals.EXPORT_LIMIT_REACHED));
						return;
					}

					dispatch(closeDialog());
					dispatch(openDialog(Modals.LOADING_NOTES));

					let promises = filePaths.map(function (filePath) {
						return new Promise((resolve, reject) => {
							IOManager.readFile(
								filePath,
								"utf8",
								(err, data) => {
									if (err) {
										console.log(err);
										reject(err);
									} else {
										let note = JSON.parse(data);

										let newNote = new Note({
											locale: note.locale,
											title: note.title,
											size: parseBoundingBox(note),
											transform: parseMatrix(note),
											creationDate: note.created,
											modifiedDate: note.modified,
										});

										note.ink.map((layer) => {
											let decodedStrokes =
												Module.InkDecoder.decode(
													new Uint8Array(
														Buffer.from(
															layer,
															"base64"
														)
													)
												);

											newNote.addLayer({
												lastModifiedDate:
													note.lastModifiedDate,
												strokes: decodedStrokes,
											});
										});

										newNotes.push(newNote);
										resolve();
									}
								}
							);
						});
					});

					saveLoadedNotesToDB(promises, newNotes, dispatch);
				}
			},
			null,
			["openFile", "multiSelections"],
			[{ name: "Custom File Type", extensions: ["widd"] }]
		);
	};
}

function saveLoadedNotesToDB(promises, newNotes, dispatch) {
	Promise.all(promises).then(() => {
		DBManager.editNotes(newNotes)
			.then(() => ContentManager.updateSections())
			.then(() => {
				dispatch(
					addNotification(
						newNotes.length > 1
							? "notification.notes.imported.succesfully"
							: "notification.note.imported.succesfully"
					)
				);

				dispatch(closeDialog());
				dispatch({
					type: ActionTypes.LOAD_NOTES_COMPLETE,
				});
				global.mainMenuManager.assignMenu("library");
			})
			.catch((e) => {
				console.error(e);
				dispatch(closeDialog());
				dispatch({
					type: ActionTypes.LOAD_NOTES_COMPLETE,
				});
				global.mainMenuManager.assignMenu("library");
			});
	});
}

function parseBoundingBox(note) {
	let boundingBox = note.boundingBox;
	let rectangleValues = boundingBox.substring(
		boundingBox.indexOf("(") + 1,
		boundingBox.lastIndexOf(")")
	);

	let values = rectangleValues.split(" ");
	let height = parseInt(values[2]);
	let width = parseInt(values[3]);

	return {
		width,
		height,
	};
}

function parseMatrix(note) {
	let transform = note.transform;
	let matrixValues = transform.substring(
		transform.indexOf("(") + 1,
		transform.lastIndexOf(")")
	);

	let values = matrixValues.split(" ");
	let a = parseInt(values[0]);
	let b = parseInt(values[1]);
	let c = parseInt(values[2]);
	let d = parseInt(values[3]);
	let tx = parseInt(values[4]);
	let ty = parseInt(values[5]);

	return {
		a,
		b,
		c,
		d,
		tx,
		ty,
	};
}

export {
	setLastSync,
	setDeviceStatus,
	setBatteryCharge,
	updateContext,
	refreshLibrary,
	refreshGroups,
	editGroupRelations,
	combineNotes,
	deleteNotes,
	rotateNotes,
	rotateTransformAdd90deg,
	selectNotes,
	exportNote,
	executeSearch,
	closeSearchResultSet,
	showSearch,
	hideSearch,
	filterByTag,
	filterByGroup,
	setExportLanguage,
	exportAsText,
	saveRecognizedText,
	closeExportAsTextModal,
	createNote,
	editNote,
	saveNotes,
	loadNotes,
};
