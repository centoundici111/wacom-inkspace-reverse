import { push } from "react-router-redux";
import * as ActionTypes from "../constants/ActionTypes";
import * as Modals from "../constants/Modals";
import * as WizardSteps from "../constants/WizardSteps";
import AuthenticationManager from "../globals/AuthenticationManager";
import { closeWizard, moveWizardTo, openDialog } from "./modals";

function redirect(nextStep) {
	return (dispatch, getState) => {
		let { wizardStep } = getState().AppReducer;

		if (nextStep.startsWith("/")) {
			if (wizardStep == WizardSteps.COMPLETE) {
				UIManager.editWindow({ resizable: true, maximizable: true });
				DBManager.edit(DBManager.entities.SETTINGS, { fte: true });
			}

			dispatch(push(nextStep));
		} else {
			if (nextStep == WizardSteps.DISCOVERY) {
				if (
					DeviceManager.type == "VIPER" &&
					DeviceManager.serialPortSupport
				) {
					global.updateState({ sppConnected: false });
					dispatch(openDialog(Modals.BT_INSTRUCTIONS));

					DeviceManager.open("SPP", null, "VIPER");
				} else {
					DeviceManager.open("BT", null, DeviceManager.type);

					if (process.platform == "win32" && global.MANUAL_PAIRING)
						dispatch(openDialog(Modals.BT_INSTRUCTIONS_WAITING));
					else dispatch(moveWizardTo(nextStep));
				}
			} else dispatch(moveWizardTo(nextStep));
		}
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
						dispatch(moveWizardTo(WizardSteps.COMPLETE));
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
			dispatch(moveWizardTo(WizardSteps.NO_INTERNET_CONNECTION_SIGN_IN));
		}
	};
}

function dismissSetupDevice() {
	return (dispatch, getState) => {
		DBManager.get(DBManager.entities.SETTINGS).then((settings) => {
			if (settings.fte) {
				dispatch(closeWizard());
			} else {
				dispatch(moveWizardTo(WizardSteps.WACOM_ID_BENEFITS));
			}
		});
	};
}

function confirmOrientation() {
	return (dispatch, getState) => {
		DBManager.get(DBManager.entities.SETTINGS).then((settings) => {
			if (settings.fte) {
				dispatch(closeWizard());
			} else {
				dispatch(moveWizardTo(WizardSteps.WACOM_ID_BENEFITS));
			}
		});
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
			dispatch(moveWizardTo(WizardSteps.NO_INTERNET_CONNECTION_SIGN_UP));
		}
	};
}

function connect() {
	return (dispatch, getState) => {
		DeviceManager.open();
	};
}

function getSetNameClassName() {
	return (dispatch, getState) => {
		let { device } = getState().AppReducer;
		return device && device.name ? null : "disabled";
	};
}

function exit() {
	return (dispatch, getState) => {
		let { wizardStep } = getState().AppReducer;

		if (wizardStep == WizardSteps.COMPLETE)
			dispatch(moveWizardTo(undefined));
	};
}

export {
	redirect,
	connect,
	getSetNameClassName,
	exit,
	triggerLogin,
	triggerRegister,
	dismissSetupDevice,
	confirmOrientation,
};
