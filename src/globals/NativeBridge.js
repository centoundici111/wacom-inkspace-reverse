import { ipcRenderer, shell, webFrame } from "electron";
import fs from "fs";
import ua from "universal-analytics";

const project = require("../../project.config.js");
const StrokesCodec = require("../../scripts/StrokesCodec");
const async = require("async");

function getPreloadAPI() {
	if (!window.__INKSPACE_PRELOAD__)
		throw new Error("Inkspace preload API is unavailable");

	return window.__INKSPACE_PRELOAD__;
}

let nextMenuID = 1;
let nextMenuCallbackID = 1;
const menuCallbacks = new Map();
let currentApplicationMenuID = null;

function cloneMenuTemplate(template) {
	if (template instanceof MenuItem) return cloneMenuTemplate(template.origin);
	if (Array.isArray(template)) return template.map((item) => cloneMenuTemplate(item));
	if (!template || typeof template != "object") return template;

	let clone = { ...template };

	if (clone.submenu) clone.submenu = cloneMenuTemplate(clone.submenu);

	return clone;
}

function serializeMenuTemplate(template, callbackStore, menuID) {
	if (template instanceof MenuItem)
		return serializeMenuTemplate(template.origin, callbackStore, menuID);
	if (Array.isArray(template))
		return template.map((item) =>
			serializeMenuTemplate(item, callbackStore, menuID)
		);
	if (!template || typeof template != "object") return template;

	let serialized = { ...template };

	if (typeof serialized.click == "function") {
		let callbackID = `${menuID}:${nextMenuCallbackID++}`;
		callbackStore.set(callbackID, serialized.click);
		serialized.clickID = callbackID;
		delete serialized.click;
	}

	if (serialized.submenu)
		serialized.submenu = serializeMenuTemplate(
			serialized.submenu,
			callbackStore,
			menuID
		);

	return serialized;
}

function serializeMenu(menu, once) {
	let callbacks = new Map();
	let payload = {
		id: menu.id,
		items: serializeMenuTemplate(menu.items, callbacks, menu.id),
	};

	menuCallbacks.set(menu.id, { callbacks, once });

	return payload;
}

getPreloadAPI().onMenuClick((message) => {
	let menu = menuCallbacks.get(message.menuID);
	if (!menu) return;

	let callback = menu.callbacks.get(message.callbackID);
	if (!callback) return;

	callback();
});

getPreloadAPI().onMenuClosed((message) => {
	let menu = menuCallbacks.get(message.menuID);
	if (menu && menu.once) menuCallbacks.delete(message.menuID);
});

// AuthenticationManager.DEBUG
let pcIsAwake = true;

getPreloadAPI().onPowerEvent((message) => {
	if (message.type == "suspend") {
		if (debug) console.info("The system is going to sleep");
		pcIsAwake = false;
	} else if (message.type == "resume") {
		if (debug) console.info("The system resume");
		pcIsAwake = true;
	} else if (message.type == "lock-screen" || message.type == "unlock-screen") {
		if (debug) {
			let d = new Date();
			console.info(
				message.type == "lock-screen"
					? "The system lock screen in"
					: "The system unlock screen in",
				d.getHours().pad(2) +
					":" +
					d.getMinutes().pad(2) +
					":" +
					d.getSeconds().pad(2)
			);
		}
	}
});

// crashReporter.start({
// 	productName: "InkspaceDesktop",
// 	companyName: "Wacom Co LTD",
// 	submitURL: project.crashReportURL,
// 	extra: {
// 		product: "InkspaceDesktop",
// 		version: process.versions.electron
// 	}
// });

let UIManager = {
	editWindow: function (props) {
		getPreloadAPI().editWindow(props);
	},

	setVisualZoomLevelLimits: function (min, max) {
		webFrame.setVisualZoomLevelLimits(min, max);
	},

	maximize: function () {
		getPreloadAPI().maximizeWindow().catch(console.error);
	},

	reload: function () {
		getPreloadAPI().reloadWindow().catch(console.error);
	},

	updateAppContext(context) {},
	setCloudLocale(locale) {},

	quit: function () {
		getPreloadAPI().quitApp().catch(console.error);
	},

	showSaveDialog: function (title, fileName, callback) {
		const preload = getPreloadAPI();
		let options = {};

		options.title = title ?? "";
		options.defaultPath = preload.getDownloadsPath() + "/" + fileName;

		preload.showSaveDialog(options).then(callback).catch(console.error);
	},

	showOpenDialog: function (
		title,
		callback,
		buttonLabel,
		properties,
		filters
	) {
		const preload = getPreloadAPI();
		let options = {};

		options.title = title ?? "";
		options.defaultPath = preload.getDownloadsPath();
		options.properties = properties;
		options.buttonLabel = buttonLabel ?? "";
		options.filters = filters;

		preload.showOpenDialog(options).then(callback).catch(console.error);
	},

	openExternal: function (url) {
		shell.openExternal(url);
	},

	openDialog: function (url) {
		getPreloadAPI().openDialogWindow(url);
	},
};

let IOManager = {
	existsSync: function (filePath) {
		return fs.existsSync(filePath);
	},

	writeFile: function (filePath, data, callback) {
		fs.writeFile(filePath, data, callback);
	},

	writeFiles: function (filePath, data, extension, callback) {
		let results = data.map((item) => {
			let itemPath = `${filePath}/Inkspace_${item.id.substring(
				item.id.length - 12
			)}${extension}`;
			fs.writeFile(itemPath, JSON.stringify(item.json), (err) => {});
		});

		Promise.all(results)
			.then(function () {
				callback();
			})
			.catch(function (err) {
				callback(err);
			});
	},

	readFile: function (filePath, encoding, callback) {
		fs.readFile(filePath, encoding, callback);
	},
};

let PowerManager = {
	blockSleep: function () {
		if (!this.blockerID) this.blockerID = getPreloadAPI().blockSleep();

		return this.blockerID;
	},

	unblockSleep: function () {
		if (this.blockerID) {
			getPreloadAPI().unblockSleep(this.blockerID);
			delete this.blockerID;
		}
	},

	onSuspend: function (callback) {
		getPreloadAPI().onPowerEvent((message) => {
			if (message.type == "suspend") callback();
		});
	},
};

// callback args: event, message
let NativeLinker = {
	linkBrowserWindow: function () {
		ipcRenderer.send("browser-window");
		ipcRenderer.on("browser-window", (event, message) => {
			if (message.type == "minimize")
				console.log("========= window is minimized");
			else if (message.type == "restore")
				console.log("========= window is restored");

			window.minimized = message.type == "minimize";
		});
	},

	linkDataMigration: function (callback) {
		ipcRenderer.send("data-migration");
		ipcRenderer.on("data-migration", callback);
	},

	linkStoreUpdate: function (callback) {
		ipcRenderer.send("store-update");
		ipcRenderer.on("store-update", (event, message) => callback(message));
	},

	syncWithCloud: function (message) {
		ipcRenderer.send("cloud-sync", message || {});
	},

	disconnectCloud: function (message) {
		ipcRenderer.send("cloud-disconnect", message || {});
	},

	send: function (event) {
		ipcRenderer.send(event);
	},

	getRoot: function () {
		return getPreloadAPI().getRoot();
	},

	getPreviousVersion: function () {
		return getPreloadAPI().getPreviousVersion();
	},

	getUpdateFound: function () {
		return getPreloadAPI().getUpdateFound();
	},

	getUpdateInstalled: function () {
		return getPreloadAPI().getUpdateInstalled();
	},
};

class Menu {
	constructor() {
		this.id = `menu-${nextMenuID++}`;
		this.items = [];
	}

	append(menuItem) {
		this.items.push(menuItem);
	}

	popup() {
		getPreloadAPI().popupMenu(serializeMenu(this, true));
	}

	static setApplicationMenu(menu) {
		if (currentApplicationMenuID)
			menuCallbacks.delete(currentApplicationMenuID);

		currentApplicationMenuID = menu.id;
		getPreloadAPI().setApplicationMenu(serializeMenu(menu, false));
	}
}

let UATracker = {
	createInstance(trackingID, userID) {
		return ua(trackingID, userID, {
			requestOptions: {
				headers: {
					"User-Agent": navigator.userAgent,
				},
			}, // , debug: true
		});
	},
};

class MenuItem {
	constructor(props) {
		this.origin = cloneMenuTemplate(props);

		Object.defineProperty(this, "label", {
			get: () => this.origin.label,
			set: (value) => (this.origin.label = value),
		});

		Object.defineProperty(this, "enabled", {
			get: () => this.origin.enabled,
			set: (value) => (this.origin.enabled = value),
		});
	}
}

global.nativeRequire =
	typeof __non_webpack_require__ == "function"
		? __non_webpack_require__
		: eval("require");

global.UIManager = UIManager;
global.IOManager = IOManager;
global.PowerManager = PowerManager;
global.NativeLinker = NativeLinker;
global.Menu = Menu;
global.MenuItem = MenuItem;
// global.MainMenuManager = MainMenuManager;
global.UATracker = UATracker;

global.StrokesCodec = StrokesCodec;

// MainMenuManager,
export {
	UIManager,
	IOManager,
	PowerManager,
	NativeLinker,
	Menu,
	MenuItem,
	UATracker,
	StrokesCodec,
};
