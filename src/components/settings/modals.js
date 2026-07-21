import images from "../../images";
import BTInstructions from "../helpers/BTInstructions";
import DeviceNameForm from "../helpers/DeviceNameForm";
import EntityForm from "../helpers/EntityForm";
import IFrame from "../helpers/IFrame";
import SelectItem from "../helpers/SelectItem";
import SelectOrientation from "../helpers/SelectOrientation";
import TagsManager from "../helpers/TagsManager";
import VideoProgressBar from "../helpers/VideoProgressBar";
import WacomIDBenefits from "../helpers/WacomIDBenefits";
import CancelIcon from "../icons/CancelIcon.svg";
import BLEImage from "../images/live-mode/ble.svg";
import BTCImage from "../images/live-mode/btc.svg";
import USBImage from "../images/live-mode/usb.svg";
import SignIn from "../modals/auth/SignIn";
import SignUp from "../modals/auth/SignUp";
import SignUpProfile from "../modals/auth/SignUpProfile";
import SignUpSettings from "../modals/auth/SignUpSettings";
import SignUpVerifyEmail from "../modals/auth/SignUpVerifyEmail";
import ColorPaletteModal from "../modals/edit/ColorPaletteModal";
import NoInternetConnection from "../modals/NoInternetConnection";

const authConfig = require("../../../project.config.js")["authentication"];
const RESET_PASSWORD_URL = authConfig.resetPasswordUrl;

let settings = {
	SetupLater: {
		title: "setupLater.title",
		content: "setupLater.description",

		buttons: [
			{
				text: "setupLater.title",
				click: "setupLater",
			},
			{
				type: "CANCEL",
			},
		],
	},

	UnlockFeaturesLater: {
		title: "unlockFeaturesLater.title",
		content: "unlockFeaturesLater.description",

		buttons: [
			{
				text: "unlockFeaturesLater.unlockFeaturesLater",
				click: "unlockFeaturesLater",
			},
			{
				type: "CANCEL",
				text: "btn.back",
			},
		],
	},

	NotSupportedLiveMode: {
		title: "not.supported.live.mode.title",
		content: "not.supported.live.mode.content",
		discardOverlayClick: true,

		buttons: [
			{
				text: "btn.OK",
				type: "CONFIRM",
				click: "closeDialog",
			},
		],
	},

	NoSupportedDevice: {
		title: "noSupportedDevice.title",
		// content: "noSupportedDevice.description",
		discardOverlayClick: true,

		onopen: function () {
			if (DeviceManager.type == "VIPER")
				this.config.content = "noSupportedDevice.viper.description";
			else this.config.content = "noSupportedDevice.description";
		},

		buttons: [
			{
				text: "btn.tryAgain",
				click: "setupDevice",
			},
		],
	},

	ConnectionLost: {
		title: "connectionLost.title",
		content: "connectionLost.description",
		discardOverlayClick: true,

		buttons: [
			{
				text: "btn.tryAgain",
				click: "setupBTDevice",
			},
		],
	},

	SelectConnection: {
		title: "selectConnection.title",
		content: "selectConnection.description",

		onclose: function () {
			DeviceManager.clearDeviceConnectedCheck();
		},

		buttons: [
			{
				name: "BTC",
				text: "selectConnection.Bluetooth",
				click: "selectBTCConn",
				classNameSource: "getConnClassName",
			},
			{
				name: "USB",
				text: "selectConnection.USB",
				click: "selectUSBConn",
				classNameSource: "getConnClassName",
			},
		],
	},

	SelectDeviceType: {
		title: "selectDeviceType.title",
		className: "SelectItem",
		extraContent: SelectItem,
		discardOverlayClick: true,

		selectable: {
			prop: "selectedDeviceType",

			items: [
				{ name: "Wacom Intuos Pro", value: "VIPER" },
				{ name: "Wacom Smartpad", value: "COLUMBIA" },
				// {name: "Wacom Sketchpad Pro", value: "COLUMBIA_CREATIVE"},
				// {name: "Bamboo Folio / Bamboo Slate", value: "COLUMBIA_CONSUMER"}
			],
		},

		buttons: [
			{
				text: "btn.proceed",
				click: "selectDeviceType",
			},
		],
	},

	SelectDevice: {
		title: "selectDevice.title",
		content: "selectDevice.description",
		discardOverlayClick: true,
		className: "SelectItem",
		extraContent: SelectItem,

		selectable: {
			prop: "selectedDevice",
			items: "devices",

			item: {
				value: "id",
			},
		},

		buttons: [
			{
				text: "selectDevice.pair",
				click: "pair",
			},
			{
				text: "btn.tryAgain",
				className: "cancel",
				click: "restartPairProcess",
			},
		],
	},

	BTInstructions: {
		title: "btInstructions.title",
		extraContent: BTInstructions,
		discardOverlayClick: true,

		onclose: function () {
			DeviceManager.clearDeviceConnectedCheck();
		},

		buttons: [
			{
				text: "btn.next",
				click: "confirmBTInstructions",
				classNameSource: "getBTInstructionsClassName",
			},
			{
				type: "CANCEL",
			},
		],
	},

	BTInstructionsWaiting: {
		title: "btInstructions.title",
		extraContent: BTInstructions,
		discardOverlayClick: true,

		onclose: function () {
			DeviceManager.clearDeviceConnectedCheck();
		},

		waiting: {
			text: "btInstructions.waiting",
		},
	},

	ForgetDevice: {
		title: "forgetDevice.title",
		content: "forgetDevice.description",
		discardOverlayClick: true,

		onopen: function () {
			DeviceManager.forgetDevice = true;
		},

		onclose: function (forget) {
			DeviceManager.forgetDevice = false;

			// on CANCEL press
			DeviceManager.onCloseForgetDevice(forget);
		},

		buttons: [
			{
				text: "forgetDevice.OK",
				click: "forgetDevice",
			},
			{
				type: "CANCEL",
			},
		],
	},

	WacomIDBenefits: {
		extraContent: WacomIDBenefits,
		actionBar: "center",

		buttons: [
			{
				text: "auth.sign.in",
				className: "blue",
				click: "signIn",
			},
			{
				text: "auth.sign.up",
				className: "white",
				click: "signUp",
			},
		],
	},

	SignIn: {
		extraContent: SignIn,
		isAuthContent: true,
		discardOverlayClick: true,
		context: "modal",
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
				click: "signUp",
			},
			{
				className: "button cancel sign-in-close",
				click: "closeDialog",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUp: {
		extraContent: SignUp,
		isAuthContent: true,
		discardOverlayClick: true,
		context: "modal",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.btn.continue",
				className: "btn sign-in-continue-button",
				click: "signUpSettings",
			},
			{
				text: "auth.sign.in",
				className: "btn sign-in-white-button",
				click: "signIn",
			},
			{
				className: "button cancel sign-in-close",
				click: "closeDialog",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpSettings: {
		extraContent: SignUpSettings,
		isAuthContent: true,
		discardOverlayClick: true,
		context: "modal",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.btn.continue",
				className: "btn sign-in-continue-button",
				click: "signUpProfile",
			},
			{
				className: "button cancel sign-in-close",
				click: "closeDialog",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpProfile: {
		extraContent: SignUpProfile,
		isAuthContent: true,
		discardOverlayClick: true,
		context: "modal",
		authContext: "SignUp",

		buttons: [
			{
				text: "auth.sign.up.create.profile",
				className: "btn sign-in-continue-button",
				click: "triggerRegister",
			},
			{
				className: "button cancel sign-in-close",
				click: "closeDialog",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	SignUpVerifyEmail: {
		extraContent: SignUpVerifyEmail,
		isAuthContent: true,
		discardOverlayClick: true,
		context: "modal",
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
				click: "closeDialog",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	Account: {
		extraContent: IFrame,
	},

	SessionExpired: {
		title: "session.expired.title",
		content: "session.expired.description",

		buttons: [
			{
				text: "auth.btn.login",
				click: "signIn",
			},
			{
				type: "CANCEL",
				text: "btn.use.offline",
			},
		],
	},

	RemoveGroup: {
		title: "remove.group.title",
		content: "remove.group.description",

		buttons: [
			{
				type: "CANCEL",
			},
			{
				text: "remove.group.title",
				click: "removeGroup",
			},
			{
				text: "btn.delete.all",
				click: "deleteGroup",
			},
		],
	},

	SaveEditChanges: {
		title: "saveChanges.title",
		content: "saveChanges.description",
		discardOverlayClick: true,

		buttons: [
			{
				text: "saveChanges.save",
				click: "saveEditChanges",
			},
			{
				type: "CANCEL",
				text: "saveChanges.dontSave",
				onclose: function () {
					this.props.closeEditNote();
				},
			},
		],
	},

	SaveLiveChanges: {
		title: "saveChanges.title",
		content: "saveChanges.description",
		discardOverlayClick: true,

		buttons: [
			{
				text: "saveChanges.save",
				click: "saveLiveChanges",
			},
			{
				type: "CANCEL",
				text: "saveChanges.dontSave",
				onclose: function () {
					this.props.closeEditNote();
				},
			},
		],
	},

	Confirm: {
		title: "confirm.title",
		content: "confirm.description",

		buttons: [
			{
				type: "CANCEL",
			},
			{
				id: "confirm",
				text: "menu.delete",
				autoDisable: true,
				click: function () {
					this.props.confirm(this.config.settings);
				},
			},
		],
	},

	ExportingNote: {
		title: "exportingNote.title",
		image: images.genaratingDoc,
		extraContent: VideoProgressBar,
	},

	SavingNotes: {
		title: "savingNotes.title",
		image: images.genaratingDoc,
		discardOverlayClick: true,
	},

	LoadingNotes: {
		title: "loadingNotes.title",
		image: images.genaratingDoc,
		discardOverlayClick: true,
	},

	SetName: {
		title: "addCustomName.title",
		content: "addCustomName.description",
		className: "center",
		actionBar: "center",
		extraContent: DeviceNameForm,
		extraContentType: "IMAGE",

		buttons: [
			{
				text: "btn.done",
				click: function () {
					let form = this.refs["ExtraContent"].getWrappedInstance();

					if (form.state.value) {
						DeviceManager.setName(form.state.value.trim());
						this.props.closeDialog();
					} else form.setState({ error: "required" });
				},
			},
		],
	},

	SelectOrientation: {
		title: "orientation.title",
		content: "orientation.description",
		className: "center",
		actionBar: "center",
		image: SelectOrientation,
		discardOverlayClick: true,

		buttons: [
			{
				text: "btn.done",
				click: "closeDialog",
			},
		],
	},

	LiveModeUSBWaiting: {
		title: "live.mode.waiting.usb.title",
		content: "live.mode.waiting.usb.description",
		className: "center",
		image: USBImage,

		onclose: function () {
			DeviceManager.execLiveMode = false;
		},

		waiting: {},
	},

	LiveModeBTCWaiting: {
		title: "live.mode.waiting.btc.title",
		content: "live.mode.waiting.btc.description",
		className: "center",
		image: BTCImage,

		onclose: function () {
			DeviceManager.execLiveMode = false;
		},

		waiting: {},
	},

	LiveModeBLEWaiting: {
		title: "live.mode.waiting.ble.title",
		content: "live.mode.waiting.ble.description",
		className: "center",
		image: BLEImage,

		onclose: function () {
			DeviceManager.execLiveMode = false;
		},

		waiting: {},
	},

	ColorPalette: {
		className: "color-palette",
		discardOverlayClick: false,
		extraContent: ColorPaletteModal,
	},

	LiveMode: {
		title: "live.mode.title",
		content: "live.mode.content",
		className: "live-mode",
		actionBar: "left",
		discardOverlayClick: false,
		disableEditMode: false,
		buttons: [
			{
				text: "live.mode.create",
				click: "createLiveMode",
				className: "live-mode-button",
			},
			{
				text: "live.mode.edit",
				click: "editLiveMode",
				className: "live-mode-button",
			},
		],
	},

	Entity: {
		extraContent: EntityForm,
		actionBar: "center",

		buttons: [
			{
				id: "cancel",
				type: "CANCEL",
			},
			{
				id: "ok",
				type: "CONFIRM",
				text: "btn.OK",
				click: function () {
					let form = this.refs["ExtraContent"].getWrappedInstance();

					// TODO: refactor after TAGS refactoring
					let list = this.config.settings.list;

					if (!list)
						list = ContentManager.getEntity(
							this.config.settings.type
						).textValues;

					if (form.state.value) {
						if (
							form.state.validators["UNIQUE"] &&
							list.includes(form.state.value.trim())
						)
							form.setState({
								error: "error.value.already.exists",
							});
						else
							this.props.editEntity(
								this.config.settings.type,
								this.config.settings.value,
								form.state.value.trim()
							);
					} else form.setState({ error: "error.required" });
				},
			},
		],
	},

	TagsManager: {
		extraContent: TagsManager,
	},

	TagsEditor: {
		extraContent: TagsManager,
		actionBar: "center",

		buttons: [
			{
				text: "btn.new.tag",
				click: "openTagAdd",
				classNameSource: "getTagAddClassName",
			},
		],
	},

	TagDelete: {
		buttons: [
			{
				text: "btn.cancel",
				click: "tagsDeleteConfirm",
			},
		],
	},

	ExportLimitReached: {
		title: "export.limit.reached.title",
		content: "export.limit.reached.description",

		buttons: [
			{
				text: "btn.OK",
				click: "closeDialog",
			},
		],
	},

	NoInternetConnectionSignIn: {
		extraContent: NoInternetConnection,
		isAuthContent: true,

		buttons: [
			{
				text: "no.internet.connection.retry.button.text",
				className: "blue no-internet-connection-button-retry",
				click: "signIn",
			},
			{
				text: "btn.cancel",
				className: "white no-internet-connection-button-cancel",
				click: "wacomIdBenefits",
			},
			{
				className: "button cancel sign-in-close",
				click: "wacomIdBenefits",
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
				click: "signUp",
			},
			{
				text: "btn.cancel",
				className: "white no-internet-connection-button-cancel",
				click: "wacomIdBenefits",
			},
			{
				className: "button cancel sign-in-close",
				click: "wacomIdBenefits",
				skipDefaultStyle: true,
				icon: CancelIcon,
			},
		],
	},

	Settings: { custom: true },
	ExportAsText: { custom: true },
};

export default settings;
