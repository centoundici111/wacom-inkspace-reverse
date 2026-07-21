import * as ActionTypes from "../constants/ActionTypes";

let defaultState = {
	email: "",
	password: "",
	repeatPassword: "",
	loginButtonDisabled: true,
	continueButtonDisabled: true,
	hasError: false,
	hasValidEmail: false,
	hasAvailableEmail: true,
	hasEmptyEmail: true,
	hasEmptyPassword: true,
	hasValidPassword: false,
	hasEmptyRepeatPassword: true,
	hasValidRepeatPassword: false,
	hasEqualPasswords: true,
	privacyPolicy: false,
	termsOfUse: false,
	marketingConsent: false,
	firstName: "",
	lastName: "",
	country: "",
	countries: {},
};

export default function AuthReducer(state = defaultState, action) {
	// if (global.debug) console.reducer(action.type, action.body);

	switch (action.type) {
		case ActionTypes.AUTH_SIGN_IN: {
			return { ...state, ...action.body };
		}

		case ActionTypes.AUTH_SIGN_UP: {
			return { ...state, ...action.body };
		}

		case ActionTypes.AUTH_SIGN_UP_SETTINGS: {
			return { ...state, ...action.body };
		}

		case ActionTypes.AUTH_SIGN_UP_PROFILE: {
			return { ...state, ...action.body };
		}

		case ActionTypes.AUTH_SIGN_UP_VERIFY_EMAIL: {
			return { ...state, ...action.body };
		}

		case ActionTypes.AUTH_INIT: {
			return {
				...state,
				email: "",
				password: "",
				repeatPassword: "",
				loginButtonDisabled: true,
				continueButtonDisabled: true,
				hasError: false,
				hasValidEmail: false,
				hasAvailableEmail: true,
				hasEmptyEmail: true,
				hasEmptyPassword: true,
				hasValidPassword: false,
				hasEmptyRepeatPassword: true,
				hasValidRepeatPassword: false,
				hasEqualPasswords: true,
				privacyPolicy: false,
				termsOfUse: false,
				marketingConsent: false,
				firstName: "",
				lastName: "",
				country: "",
				countries: {},
			};
		}

		default:
			return state;
	}
}
