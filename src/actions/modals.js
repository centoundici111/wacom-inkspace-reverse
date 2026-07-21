import modalSettings from "../components/settings/modals";
import wizardSettings from "../components/settings/wizards";
import * as ActionTypes from "../constants/ActionTypes";
import * as Modals from "../constants/Modals";
import * as WizardSteps from "../constants/WizardSteps";
import AuthenticationManager from "../globals/AuthenticationManager";
import LocalesManager from "../globals/LocalesManager";
import { addNotification } from "./app";
import { closeNote as editCloseNote, saveNote as editSaveNote } from "./edit";
import { deleteNotes, filterByGroup, refreshGroups } from "./library";
import { closeNote as liveCloseNote, saveNote as liveSaveNote } from "./live";

// selectedDevice, selectedDeviceType
function updateSelected(type, item) {
	return (dispatch, getState) => {
		global.updateState(
			Object.defineProperty({}, type, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: item,
			})
		);
	};
}

function confirm(obj) {
	switch (obj.type) {
		case "REMOVE_TAG":
			return tagsDeleteConfirm(obj.tag);
		case "REMOVE_NOTE":
			return notesDeleteConfirm(obj.noteIDs);
		case "LOG_OUT":
			return confirmLogout();
		default:
			throw new Error("Unknown confirm type:", obj.type);
	}
}

function confirmLogout() {
	return (dispatch, getState) => {
		AuthenticationManager.logout();
		dispatch(addNotification("notification.cloud.disconnected"));
		dispatch(closeDialog());
	};
}

function triggerLogin() {
	return (dispatch, getState) => {
		let { online } = getState().AppReducer;

		if (online) {
			let { email, password } = getState().AuthReducer;

			dispatch({
				type: ActionTypes.AUTH_SIGN_IN,
				body: { loginButtonDisabled: true },
			});

			AuthenticationManager.login(email, password).then(
				(responseStatus) => {
					if (responseStatus === 200) {
						dispatch(closeDialog());
					} else if (responseStatus === 401) {
						dispatch({
							type: ActionTypes.AUTH_SIGN_IN,
							body: { hasError: true },
						});
					}

					dispatch({
						type: ActionTypes.AUTH_SIGN_IN,
						body: {
							loginButtonDisabled: false,
						},
					});
				}
			);
		} else {
			dispatch(closeDialog());
			dispatch(openDialog(Modals.NO_INTERNET_CONNECTION_SIGN_IN));
		}
	};
}

function triggerRegister() {
	return (dispatch, getState) => {
		let { online } = getState().AppReducer;

		if (online) {
			let {
				email,
				country,
				firstName,
				lastName,
				password,
				marketingConsent,
			} = getState().AuthReducer;

			let language = LocalesManager.getLang(LocalesManager.locale);

			dispatch({
				type: ActionTypes.AUTH_SIGN_UP_PROFILE,
				body: { continueButtonDisabled: true },
			});

			AuthenticationManager.register(
				email,
				country,
				language,
				firstName,
				lastName,
				password,
				marketingConsent
			).then((responseStatus) => {
				dispatch(closeDialog());
				if (responseStatus === 200) {
					dispatch(triggerLogin());
				} else {
					dispatch({
						type: ActionTypes.AUTH_SIGN_UP_PROFILE,
						body: { continueButtonDisabled: false },
					});
				}
			});
		} else {
			dispatch(closeDialog());
			dispatch(openDialog(Modals.NO_INTERNET_CONNECTION_SIGN_UP));
		}
	};
}

function handleFirstNameChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: { firstName: value },
		});
	};
}

function handleLastNameChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: { lastName: value },
		});
	};
}

function handleCountryChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: { country: value },
		});
	};
}

function initCountries(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: { countries: value },
		});
	};
}

function handleEmailChange(value, type) {
	return (dispatch, getState) => {
		dispatch({ type: type, body: { email: value } });
	};
}

function handlePasswordChange(value, type) {
	return (dispatch, getState) => {
		dispatch({ type: type, body: { password: value } });
	};
}

function handleRepeatPasswordChange(value, type) {
	return (dispatch, getState) => {
		dispatch({ type: type, body: { repeatPassword: value } });
	};
}

function validateSignInForm() {
	return (dispatch, getState) => {
		let { email, password } = getState().AuthReducer;

		let isEmailValid = email.length === 0 || validateEmail(email);
		let isPasswordValid =
			password.length === 0 || validatePassword(password);

		let loginButtonDisabled = !(
			validateEmail(email) === true && validatePassword(password) === true
		);

		dispatch({
			type: ActionTypes.AUTH_SIGN_IN,
			body: {
				loginButtonDisabled: loginButtonDisabled,
				hasError: !isEmailValid || !isPasswordValid,
			},
		});
	};
}

function validateSignUpForm() {
	return (dispatch, getState) => {
		let {
			hasEmptyEmail,
			hasValidEmail,
			hasAvailableEmail,
			hasEmptyPassword,
			hasValidPassword,
			hasEmptyRepeatPassword,
			hasValidRepeatPassword,
			hasEqualPasswords,
		} = getState().AuthReducer;

		let continueButtonDisabled =
			hasEmptyEmail ||
			!hasValidEmail ||
			!hasAvailableEmail ||
			hasEmptyPassword ||
			!hasValidPassword ||
			hasEmptyRepeatPassword ||
			!hasValidRepeatPassword ||
			!hasEqualPasswords;

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				continueButtonDisabled: continueButtonDisabled,
			},
		});
	};
}

function validateSignUpFormSettings() {
	return (dispatch, getState) => {
		let { privacyPolicy, termsOfUse } = getState().AuthReducer;

		let continueButtonDisabled = privacyPolicy && termsOfUse ? false : true;

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
			body: {
				continueButtonDisabled: continueButtonDisabled,
			},
		});
	};
}

function validateSignUpFormProfile() {
	return (dispatch, getState) => {
		let { firstName, lastName, country } = getState().AuthReducer;

		let continueButtonDisabled =
			validateString(firstName) &&
			validateString(lastName) &&
			country !== ""
				? false
				: true;

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: {
				continueButtonDisabled: continueButtonDisabled,
			},
		});
	};
}

function isPasswordEmpty() {
	return (dispatch, getState) => {
		let { password } = getState().AuthReducer;
		let hasEmptyPassword = password === "";

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasEmptyPassword: hasEmptyPassword,
			},
		});
	};
}

function checkForInternet(context, authContext) {
	return (dispatch, getState) => {
		let { online } = getState().AppReducer;

		if (online === false) {
			if (context === "fte") {
				if (authContext === "SignIn") {
					dispatch(
						moveWizardTo(WizardSteps.NO_INTERNET_CONNECTION_SIGN_IN)
					);
				} else if (authContext == "SignUp") {
					dispatch(
						moveWizardTo(WizardSteps.NO_INTERNET_CONNECTION_SIGN_UP)
					);
				}
			} else if (context === "modal") {
				if (authContext === "SignIn") {
					dispatch(closeDialog());
					dispatch(openDialog(Modals.NO_INTERNET_CONNECTION_SIGN_IN));
				} else if (authContext == "SignUp") {
					dispatch(closeDialog());
					dispatch(openDialog(Modals.NO_INTERNET_CONNECTION_SIGN_UP));
				}
			}
		}
	};
}

function handlePrivacyPolicyChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
			body: {
				privacyPolicy: value,
			},
		});
	};
}

function handleTermsOfUseChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
			body: {
				termsOfUse: value,
			},
		});
	};
}

function handleMarketingConsentChange(value) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
			body: {
				marketingConsent: value,
			},
		});
	};
}

function isPasswordValid() {
	return (dispatch, getState) => {
		let { password } = getState().AuthReducer;
		let hasValidPassword = validatePassword(password);

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasValidPassword: hasValidPassword,
			},
		});
	};
}

function arePasswordsEqual() {
	return (dispatch, getState) => {
		let { password, repeatPassword } = getState().AuthReducer;

		let hasEqualPasswords = password === repeatPassword;

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasEqualPasswords: hasEqualPasswords,
			},
		});
	};
}

function isRepeatPasswordEmpty() {
	return (dispatch, getState) => {
		let { repeatPassword } = getState().AuthReducer;
		let hasEmptyRepeatPassword = repeatPassword === "";

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasEmptyRepeatPassword: hasEmptyRepeatPassword,
			},
		});
	};
}

function isRepeatPasswordValid() {
	return (dispatch, getState) => {
		let { repeatPassword } = getState().AuthReducer;
		let hasValidRepeatPassword = validatePassword(repeatPassword);

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasValidRepeatPassword: hasValidRepeatPassword,
			},
		});
	};
}

function isEmailValid() {
	return (dispatch, getState) => {
		let { email } = getState().AuthReducer;
		let hasValidEmail = validateEmail(email);

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasValidEmail: hasValidEmail,
			},
		});
	};
}

function isEmailEmpty() {
	return (dispatch, getState) => {
		let { email } = getState().AuthReducer;
		let hasEmptyEmail = email === "";

		dispatch({
			type: ActionTypes.AUTH_SIGN_UP,
			body: {
				hasEmptyEmail: hasEmptyEmail,
			},
		});
	};
}

let timeout;

function isEmailAvailable() {
	return (dispatch, getState) => {
		clearTimeout(timeout);
		let { email, hasValidEmail } = getState().AuthReducer;

		if (hasValidEmail) {
			timeout = setTimeout(() => {
				AuthenticationManager.checkEmail(email).then((response) => {
					if (JSON.parse(response).isAvailable) {
						dispatch({
							type: ActionTypes.AUTH_SIGN_UP,
							body: {
								hasAvailableEmail: true,
							},
						});
					} else {
						dispatch({
							type: ActionTypes.AUTH_SIGN_UP,
							body: {
								hasAvailableEmail: false,
							},
						});
					}

					this.validateSignUpForm();
				});
			}, 100);
		}
	};
}

function openDialog(name, settings, props = {}) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.MODAL_SHOW,
			body: { name, settings, props },
		});
	};
}

function closeDialog(onclose) {
	return (dispatch, getState) => {
		let { modal } = getState().AppReducer;

		if (modal) {
			dispatch({ type: ActionTypes.MODAL_HIDE });

			if (!onclose) {
				onclose = modalSettings[modal].onclose;
				if (onclose)
					console.warn(
						"******** closing dialog " +
							modal +
							" - onclose found ********"
					);
			}

			if (onclose) onclose();
		}
	};
}

function openWizard(type, step) {
	return (dispatch, getState) => {
		dispatch({
			type: ActionTypes.WIZARD_SHOW,
			body: { wizardType: type, wizardStep: step },
		});
	};
}

function moveWizardTo(nextStep) {
	return (dispatch, getState) => {
		switch (nextStep) {
			case WizardSteps.SIGN_IN:
			case WizardSteps.SIGN_UP:
				dispatch({ type: ActionTypes.AUTH_INIT });
				break;
			case WizardSteps.SIGN_UP_SETTINGS:
				dispatch({
					type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
					body: { continueButtonDisabled: true },
				});
				break;
			case WizardSteps.SIGN_UP_PROFILE:
				dispatch({
					type: ActionTypes.AUTH_SIGN_UP_PROFILE,
					body: { continueButtonDisabled: true },
				});
				break;
			case WizardSteps.SIGN_UP_VERIFY_EMAIL:
				dispatch({
					type: ActionTypes.AUTH_SIGN_UP_VERIFY_EMAIL,
					body: { loginButtonDisabled: false },
				});
				break;
			default:
				break;
		}

		dispatch({ type: ActionTypes.WIZARD_SET_STEP, body: nextStep });
	};
}

function closeWizard() {
	return (dispatch, getState) => {
		let { wizardType } = getState().AppReducer;

		if (wizardType) {
			let onclose = wizardSettings[wizardType].onclose;

			dispatch({ type: ActionTypes.WIZARD_HIDE });
			if (onclose) onclose();
		}
	};
}

function openSettings(tab) {
	return (dispatch, getState) => {
		dispatch(selectSettingsTab(tab));
		dispatch(openDialog(Modals.SETTINGS));
	};
}

function selectSettingsTab(tab) {
	return (dispatch, getState) => {
		dispatch({ type: ActionTypes.SET_SETTINGS_TAB_INDEX, body: tab });
	};
}

function setupLater() {
	return (dispatch, getState) => {
		dispatch(moveWizardTo(WizardSteps.LOGIN));
		dispatch(closeDialog());
	};
}

function setupDevice() {
	return (dispatch, getState) => {
		dispatch(moveWizardTo(WizardSteps.SETUP_DEVICE));
		dispatch(closeDialog());
	};
}

function setupBTDevice() {
	return (dispatch, getState) => {
		if (DeviceManager.context == DeviceManager.Context.SETUP)
			dispatch(moveWizardTo(WizardSteps.SWITCH_ON));

		dispatch(closeDialog());
	};
}

function selectUSBConn(onclose) {
	return (dispatch, getState) => {
		dispatch(closeDialog(onclose));
		DeviceManager.open("USB", null, "VIPER");
	};
}

function selectBTCConn(onclose) {
	return (dispatch, getState) => {
		dispatch(moveWizardTo(WizardSteps.SWITCH_ON));
		dispatch(closeDialog(onclose));
	};
}

function getConnClassName(type) {
	return (dispatch, getState) => {
		let { usbConnected } = getState().AppReducer;

		if (type == "USB") return usbConnected ? null : "disabled";
		// BTC
		else return usbConnected ? "disabled" : null;
	};
}

function selectDeviceType() {
	return (dispatch, getState) => {
		let { selectedDeviceType } = getState().AppReducer;

		DeviceManager.type = selectedDeviceType.value;

		dispatch(closeDialog());

		if (selectedDeviceType.value == "VIPER")
			DeviceManager.open("USB", null, selectedDeviceType.value);
		else {
			DeviceManager.clearDeviceConnectedCheck();
			dispatch(moveWizardTo(WizardSteps.SWITCH_ON));
		}
	};
}

function pair() {
	return (dispatch, getState) => {
		let { selectedDevice } = getState().AppReducer;

		DeviceManager.open("BT", selectedDevice, DeviceManager.type);

		dispatch(closeDialog());

		if (DeviceManager.type == "VIPER") {
			if (DeviceManager.smartPad.protocol == "BTC")
				dispatch(moveWizardTo(WizardSteps.BT_CONNECTION_WAITING));
			else dispatch(openDialog(Modals.BT_INSTRUCTIONS_WAITING));
		} else {
			if (
				process.platform == "win32" &&
				DeviceManager.smartPad.transportProtocol ==
					SmartPadNS.TransportProtocol.BLE
			)
				dispatch(moveWizardTo(WizardSteps.BT_CONNECTION_WAITING));
		}
	};
}

function getBTInstructionsClassName() {
	return (dispatch, getState) => {
		let { sppConnected } = getState().AppReducer;
		return sppConnected ? null : "disabled";
	};
}

function createLiveMode() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({ type: ActionTypes.LIVE_MODE_NEW_NOTE });
		DeviceManager.triggerLiveMode();
	};
}

function editLiveMode() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({ type: ActionTypes.LIVE_MODE_EDIT_NOTE });
		DeviceManager.triggerLiveMode();
	};
}

function confirmBTInstructions(onclose) {
	return (dispatch, getState) => {
		dispatch(closeDialog(onclose));

		DeviceManager.open("SPP", {}, "VIPER");
	};
}

function restartPairProcess() {
	return (dispatch, getState) => {
		dispatch(moveWizardTo(WizardSteps.SWITCH_ON));
		dispatch(closeDialog());
	};
}

function unlockFeaturesLater() {
	return (dispatch, getState) => {
		dispatch(moveWizardTo(WizardSteps.COMPLETE));
		dispatch(closeDialog());
	};
}

function wacomIdBenefits() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch(openDialog(Modals.WACOM_ID_BENEFITS));
	};
}

function signIn() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({ type: ActionTypes.AUTH_INIT });
		dispatch(openDialog(Modals.SIGN_IN));
	};
}

function signUp() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({ type: ActionTypes.AUTH_INIT });
		dispatch(openDialog(Modals.SIGN_UP));
	};
}

function signUpSettings() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_SETTINGS,
			body: { continueButtonDisabled: true },
		});
		dispatch(openDialog(Modals.SIGN_UP_SETTINGS));
	};
}

function signUpProfile() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch({
			type: ActionTypes.AUTH_SIGN_UP_PROFILE,
			body: { continueButtonDisabled: true },
		});
		dispatch(openDialog(Modals.SIGN_UP_PROFILE));
	};
}

function forgetDevice(onclose) {
	return (dispatch, getState) => {
		dispatch(closeDialog(() => onclose(true)));
	};
}

function editEntity(type, fromValue, toValue) {
	return (dispatch, getState) => {
		switch (type) {
			case "tags":
				return dispatch(tagsAddConfirm(toValue));
			case "groups":
				let entity = ContentManager.getEntity(type);

				if (fromValue) entity.rename(fromValue.id, toValue);
				else entity.add(toValue, true);

				DBManager.setEntity(entity).then(() => {
					dispatch(closeDialog());
					dispatch(refreshGroups());
				});

				return dispatch(closeDialog());
			default:
				throw new Error("Unknown entity:", type);
		}
	};
}

function removeGroup() {
	return (dispatch, getState) => {
		let groups = ContentManager.getEntity("groups");
		let filterGroup = groups.get(getState().LibraryReducer.filterGroup);

		groups.remove(filterGroup.id);
		dispatch(filterByGroup());

		DBManager.setEntity(groups).then(() => dispatch(closeDialog()));
	};
}

function deleteGroup() {
	return (dispatch, getState) => {
		let filterGroup = ContentManager.getEntity("groups").get(
			getState().LibraryReducer.filterGroup
		);

		dispatch(notesDeleteConfirm(filterGroup.notes));
		dispatch(removeGroup());
	};
}

function saveEditChanges() {
	return (dispatch, getState) => {
		dispatch(editSaveNote());
		dispatch(closeDialog());
		dispatch(editCloseNote());
	};
}

function saveLiveChanges() {
	return (dispatch, getState) => {
		dispatch(liveSaveNote());
		dispatch(closeDialog());
	};
}

function closeEditNote() {
	return (dispatch, getState) => {
		dispatch(editCloseNote());
	};
}

function closeLiveNote() {
	return (dispatch, getState) => {
		dispatch(liveCloseNote());
	};
}

function notesDeleteConfirm(noteIDs) {
	return (dispatch, getState) => {
		dispatch(deleteNotes(noteIDs));
		dispatch(addNotification("notification.file.deleted"));
		dispatch(closeDialog());
	};
}

function openTagAdd() {
	return (dispatch, getState) => {
		let { tags } = getState().LibraryReducer;

		dispatch(
			openDialog(Modals.ENTITY, {
				type: "tags",
				list: tags,
				buttons: { ok: { text: "btn.add" } },
			})
		);
	};
}

function getTagAddClassName(type) {
	return (dispatch, getState) => {
		let { profile } = getState().AppReducer;
		return profile.linkedWithCloud ? null : "disabled";
	};
}

function tagsCancel() {
	return (dispatch, getState) => {
		dispatch(closeDialog());
		dispatch(openDialog(Modals.TAGS_EDITOR));
	};
}

function tagsAddConfirm(tag) {
	return (dispatch, getState) => {
		let { tags } = getState().LibraryReducer;

		tags = tags.slice(0);
		tags.push(tag);

		DBManager.setTags(tags).then(() => {
			dispatch(closeDialog());
			dispatch({ type: ActionTypes.TAGS_UPDATE, body: tags });
		});
	};
}

function tagsEditConfirm(oldValue, newValue) {
	return (dispatch, getState) => {
		let notes = Object.values(ContentManager.notes).filter((note) =>
			note.tags.includes(oldValue)
		);
		let tags = getState().LibraryReducer.tags.slice();
		if (tags.includes(newValue)) return;

		tags.replace(oldValue, newValue);
		notes.forEach((note) => note.tags.replace(oldValue, newValue));

		DBManager.editPages(notes)
			.then(() => DBManager.setTags(tags))
			.then(() => {
				dispatch({ type: ActionTypes.LIBRARY_SET_TAG, body: null });
				dispatch({ type: ActionTypes.TAGS_UPDATE, body: tags });

				ContentManager.filter(ContentManager.FilterType.TAG, null);
			})
			.catch(console.error);
	};
}

function tagsDeleteConfirm(tag) {
	return (dispatch, getState) => {
		let notes = Object.values(ContentManager.notes).filter((note) =>
			note.tags.includes(tag)
		);
		let { tags } = getState().LibraryReducer;

		tags = tags.slice(0);
		tags.remove(tag);

		notes.forEach((note) => note.tags.remove(tag));

		DBManager.editPages(notes)
			.then(() => DBManager.setTags(tags))
			.then(() => {
				dispatch({ type: ActionTypes.LIBRARY_SET_TAG, body: null });
				dispatch({ type: ActionTypes.TAGS_UPDATE, body: tags });
				dispatch(closeDialog());

				ContentManager.filter(ContentManager.FilterType.TAG, null);
			});
	};
}

function tagsEditNotes(tag, notes, callback) {
	return (dispatch, getState) => {
		let selectedNotes = notes.map((note) => note.clone(true));
		let remove =
			selectedNotes.filter((note) => note.tags.includes(tag)).length ==
			selectedNotes.length;

		selectedNotes.forEach((note) => {
			note.tags.remove(tag);
			if (!remove) note.tags.push(tag);

			note.touch();
		});

		DBManager.editPages(selectedNotes).then(callback).catch(console.error);
	};
}

function validateString(str) {
	// string is not empty and not just whitespace
	if (/\S/.test(str)) {
		return true;
	} else {
		return false;
	}
}

function validateEmail(email) {
	const regEx =
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regEx.test(String(email).toLowerCase());
}

function validatePassword(password) {
	const nineCharacters = /^.{9,}$/;
	const minimumNumberOfValidConditions = 3;

	// special symbol, digit number, lower letter, upper letter
	const conditions = [/(?=.*\W)/, /(?=.*\d)/, /(?=.*[a-z])/, /(?=.*[A-Z])/];
	const validConditions = [];

	let isEightCharacter = nineCharacters.test(String(password));

	if (isEightCharacter === false) {
		return false;
	}

	conditions.forEach((regEx) => {
		let result = regEx.test(String(password));

		if (result === true) {
			validConditions.push(regEx);
		}
	});

	let value =
		isEightCharacter &&
		validConditions.length >= minimumNumberOfValidConditions;

	return value;
}

export {
	openDialog,
	closeDialog,
	openWizard,
	moveWizardTo,
	closeWizard,
	openSettings,
	selectSettingsTab,
	confirm,
	confirmLogout,
	triggerLogin,
	triggerRegister,
	updateSelected,
	setupLater,
	setupDevice,
	setupBTDevice,
	getConnClassName,
	pair,
	getBTInstructionsClassName,
	confirmBTInstructions,
	selectDeviceType,
	restartPairProcess,
	selectUSBConn,
	selectBTCConn,
	unlockFeaturesLater,
	wacomIdBenefits,
	signIn,
	signUp,
	signUpSettings,
	signUpProfile,
	forgetDevice,
	handleEmailChange,
	handlePasswordChange,
	handleRepeatPasswordChange,
	validateSignInForm,
	validateSignUpForm,
	validateSignUpFormSettings,
	validateSignUpFormProfile,
	isEmailValid,
	isEmailEmpty,
	isEmailAvailable,
	isPasswordValid,
	isPasswordEmpty,
	isRepeatPasswordValid,
	isRepeatPasswordEmpty,
	arePasswordsEqual,
	handlePrivacyPolicyChange,
	handleTermsOfUseChange,
	handleMarketingConsentChange,
	handleFirstNameChange,
	handleLastNameChange,
	handleCountryChange,
	initCountries,
	editEntity,
	removeGroup,
	deleteGroup,
	saveEditChanges,
	saveLiveChanges,
	closeEditNote,
	closeLiveNote,
	notesDeleteConfirm,
	openTagAdd,
	getTagAddClassName,
	tagsCancel,
	createLiveMode,
	editLiveMode,
	tagsAddConfirm,
	tagsEditConfirm,
	tagsDeleteConfirm,
	tagsEditNotes,
	checkForInternet,
};
