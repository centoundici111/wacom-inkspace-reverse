import * as ActionTypes from "../constants/ActionTypes";

let defaultState = {
	note: null,
	newNote: true,
	layerAdded: false,
	noteProgress: false,
	lastModifiedDate: null,
};

export default function LiveReducer(state = defaultState, action) {
	// if (global.debug) console.reducer(action.type, action.body);

	switch (action.type) {
		case ActionTypes.UPDATE_STATE_LIVE:
			return { ...state, ...action.body };
		case ActionTypes.LIVE_MODE_INIT:
			return { ...state, note: action.body };
		case ActionTypes.LIVE_MODE_NEW_NOTE:
			return { ...state, newNote: true, note: action.body };
		case ActionTypes.LIVE_MODE_EDIT_NOTE:
			return { ...state, newNote: false, note: action.body };
		case ActionTypes.LIVE_MODE_ADD_STROKE:
			return {
				...state,
				lastModifiedDate: Date.now(),
				note: action.body,
			};
		case ActionTypes.LIVE_MODE_ADD_LAYER:
			return { ...state, layerAdded: !state.layerAdded };
		case ActionTypes.LIVE_MODE_FINALIZE:
			return {
				...state,
				note: null,
				newNote: true,
				layerAdded: false,
				noteProgress: false,
				lastModifiedDate: null,
			};

		default:
			return state;
	}
}
