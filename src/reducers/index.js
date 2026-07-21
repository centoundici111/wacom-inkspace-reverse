import { intlReducer } from "react-intl-redux";
import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import AppReducer from "./AppReducer";
import AuthReducer from "./AuthReducer";
import EditReducer from "./EditReducer";
import LibraryReducer from "./LibraryReducer";
import LiveReducer from "./LiveReducer";
import NotificationsReducer from "./NotificationsReducer";

export const rootReducer = combineReducers({
  AppReducer,
  LibraryReducer,
  EditReducer,
  LiveReducer,
  NotificationsReducer,
  AuthReducer,
  intl: intlReducer,
  router: routerReducer,
});
