import DeviceNameForm from "../helpers/DeviceNameForm";
import SelectOrientation from "../helpers/SelectOrientation";
import WacomIDBenefits from "../helpers/WacomIDBenefits";
import CancelIcon from "../icons/CancelIcon.svg";
import TickIcon from "../icons/TickIcon.svg";
import AcceptBluetooth from "../images/fte/AcceptBluetooth.svg";
import CreateWacomId from "../images/fte/CreateWacomId.svg";
import PressAndHold from "../images/fte/FtePress.svg";
import TapToConfirm from "../images/fte/FteTap.svg";
import SelectDevice from "../images/fte/SelectDevice.svg";
import SwitchOn from "../images/fte/SwitchOn.svg";
import ViperUsersFinished from "../images/fte/ViperUsersFinished.svg";
import Logo from "../images/logo.svg";
import SignIn from "../modals/auth/SignIn";
import SignUp from "../modals/auth/SignUp";
import SignUpProfile from "../modals/auth/SignUpProfile";
import SignUpSettings from "../modals/auth/SignUpSettings";
import SignUpVerifyEmail from "../modals/auth/SignUpVerifyEmail";
import NoInternetConnection from "../modals/NoInternetConnection";
import ColumbiaSettings from "./wizards/tutorial/columbia/settings";
import ViperSettings from "./wizards/tutorial/viper/settings";
import WhatsNewSettings from "./wizards/whatsNew/settings";

const authConfig = require("../../../project.config.js")["authentication"];
const RESET_PASSWORD_URL = authConfig.resetPasswordUrl;

let settings = {
	Welcome: {
		title: "welcome.header",
		content: "welcome.p",
		image: Logo,

		buttons: [
			{
				text: "welcome.link",
				click: "redirect",
				location: "/terms",
			},
		],
	},

	SetupDevice: {
		title: "setupDevice.title",
		content: "setupDevice.description",
		image: SelectDevice,

		buttons: [
			{
				text: "btn.connect",
				click: "connect",
			},
			{
				text: "btn.notNow",
				className: "cancelWithPadding",
				click: "dismissSetupDevice",
			},
		],
	},

	SwitchOn: {
		title: "switchOn.title",
		content: "switchOn.description",
		image: SwitchOn,

		buttons: [
			{
				text: "btn.next",
				click: "redirect",
				location: "Discovery",
			},
			{
				text: "btn.startOver",
				className: "cancel",
				click: "redirect",
				location: "SetupDevice",
			},
		],
	},

	Discovery: {
		title: "pressAndHold.title",
		content: "pressAndHold.description",
		discardOverlayClick: true,
		image: PressAndHold,

		waiting: {
			text: "btn.pressAndHold.searching",
		},
	},

	BTConnectionWaiting: {
		title: "acceptBTC.title",
		content: "acceptBTC.description",
		discardOverlayClick: true,
		image: AcceptBluetooth,

		waiting: {
			text: "acceptBTC.waitingAcceptance",
		},
	},

	////////////////////
	BTConnectionAccepted: {
		title: "acceptBTC.title",
		content: "acceptBTC.waitingAcceptance",
		discardOverlayClick: true,
		image: AcceptBluetooth,

		waiting: {
			text: "acceptBTC.accepted",
			icon: TickIcon,
		},
	},

	TapToConfirm: {
		title: "tapToConfirm.title",
		content: "tapToConfirm.description",
		discardOverlayClick: true,
		image: TapToConfirm,
		waiting: {},
	},

	SetName: {
		title: "addCustomName.title",
		content: "addCustomName.description",
		discardOverlayClick: true,
		extraContent: DeviceNameForm,

		buttons: [
			{
				text: "btn.next",
				// click: "redirect",
				classNameSource: "getSetNameClassName",
				// location: "SelectOrientation"
				click: function () {
					let form = this.refs["ExtraContent"].getWrappedInstance();

					if (form.state.value) {
						DeviceManager.setName(form.state.value);
						this.props.redirect("SelectOrientation");
					} else form.setState({ error: "required" });
				},
			},
		],
	},

	SelectOrientation: {
		title: "orientation.title",
		content: "orientation.description",
		discardOverlayClick: true,
		image: SelectOrientation,

		buttons: [
			{
				text: "btn.next",
				click: "confirmOrientation",
			},
		],
	},

	WacomIDBenefits: {
		image: CreateWacomId,
		extraContent: WacomIDBenefits,

		buttons: [
			{
				text: "auth.sign.in",
				className: "blue",
				click: "redirect",
				location: "SignIn",
			},
			{
				text: "auth.sign.up",
				className: "white",
				click: "redirect",
				location: "SignUp",
			},
			{
				text: "btn.notNow",
				className: "cancel",
				click: "redirect",
				location: "Complete",
				row: 2,
			},
		],
	},

	SignIn: {
		extraContent: SignIn,
		isAuthContent: true,
		context: "fte",
		authContext: "SignIn",

		buttons: [
			{
				text: "auth.btn.login",
				className: "btn sign-in-submit-button",
				click: "triggerLogin",
			},
			{
				text: "auth.sign.forgot.password",
				className: "btn sign-in-white-button",
				click: () => {
					UIManager.openExternal(RESET_PASSWORD_URL);
				},
			},
			{
				text: "auth.sign.up",
				className: "btn sign-in-white-button",
				click: "redirect",
				location: "SignUp",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUp: {
		extraContent: SignUp,
		isAuthContent: true,
		context: "fte",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.btn.continue",
				className: "btn sign-in-continue-button",
				click: "redirect",
				location: "SignUpSettings",
			},
			{
				text: "auth.sign.in",
				className: "btn sign-in-white-button",
				click: "redirect",
				location: "SignIn",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpSettings: {
		extraContent: SignUpSettings,
		isAuthContent: true,
		context: "fte",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.btn.continue",
				className: "btn sign-in-continue-button",
				click: "redirect",
				location: "SignUpProfile",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpProfile: {
		extraContent: SignUpProfile,
		isAuthContent: true,
		context: "fte",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.sign.up.create.profile",
				className: "btn sign-in-continue-button",
				click: "triggerRegister",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpVerifyEmail: {
		extraContent: SignUpVerifyEmail,
		isAuthContent: true,
		context: "fte",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.btn.login",
				className: "btn sign-in-submit-button",
				click: "triggerLogin",
			},
			{
				text: "auth.sign.up.resend",
				className: "btn sign-in-white-button",
				click: () => {},
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	Complete: {
		title: "finished.title",
		content: "finished.description",
		image: ViperUsersFinished,

		buttons: [
			{
				text: "btn.done",
				click: "redirect",
				location: "/library",
			},
		],
	},

	Tutorial: {
		prefix: "tutorial",

		viper: ViperSettings.steps,
		columbia: ColumbiaSettings.steps,
	},

	NoInternetConnectionSignIn: {
		extraContent: NoInternetConnection,
		isAuthContent: true,

		buttons: [
			{
				text: "no.internet.connection.retry.button.text",
				className: "blue no-internet-connection-button-retry",
				click: "redirect",
				location: "SignIn",
			},
			{
				text: "btn.cancel",
				className: "white no-internet-connection-button-cancel",
				click: "redirect",
				location: "WacomIDBenefits",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	NoInternetConnectionSignUp: {
		extraContent: NoInternetConnection,
		isAuthContent: true,

		buttons: [
			{
				text: "no.internet.connection.retry.button.text",
				className: "blue no-internet-connection-button-retry",
				click: "redirect",
				location: "SignUp",
			},
			{
				text: "btn.cancel",
				className: "white no-internet-connection-button-cancel",
				click: "redirect",
				location: "WacomIDBenefits",
			},
			{
				className: "button cancel sign-in-close",
				click: "redirect",
				location: "WacomIDBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	WhatsNew: WhatsNewSettings.config,
};

export default settings;
