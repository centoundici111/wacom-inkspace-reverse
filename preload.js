const { ipcRenderer } = require("electron");

function sendPathRequest(pathName) {
	return ipcRenderer.sendSync("preload:get-app-path", pathName);
}

function sendMainValueRequest(name) {
	return ipcRenderer.sendSync("preload:get-main-value", name);
}

function sendWindowRequest(channel, payload) {
	return ipcRenderer.sendSync(channel, payload);
}

function sendRequest(channel, payload) {
	ipcRenderer.send(channel, payload);
}

window.__INKSPACE_PRELOAD__ = Object.freeze({
	getDownloadsPath() {
		return sendPathRequest("downloads");
	},

	getUserDataPath() {
		return sendPathRequest("userData");
	},

	getRoot() {
		return sendMainValueRequest("ROOT");
	},

	getPreviousVersion() {
		return sendMainValueRequest("previousVersion");
	},

	getUpdateFound() {
		return sendMainValueRequest("updateFound");
	},

	getUpdateInstalled() {
		return sendMainValueRequest("updateInstalled");
	},

	showSaveDialog(options) {
		return ipcRenderer.invoke("preload:show-save-dialog", options || {});
	},

	showOpenDialog(options) {
		return ipcRenderer.invoke("preload:show-open-dialog", options || {});
	},

	editWindow(props) {
		return sendWindowRequest("preload:update-window", props || {});
	},

	maximizeWindow() {
		return ipcRenderer.invoke("preload:maximize-window");
	},

	reloadWindow() {
		return ipcRenderer.invoke("preload:reload-window");
	},

	quitApp() {
		return ipcRenderer.invoke("preload:quit-app");
	},

	openDialogWindow(url) {
		sendRequest("preload:open-dialog-window", url);
	},

	blockSleep() {
		return ipcRenderer.sendSync("preload:block-sleep");
	},

	unblockSleep(blockerID) {
		return ipcRenderer.sendSync("preload:unblock-sleep", blockerID);
	},

	onPowerEvent(callback) {
		ipcRenderer.on("preload:power-event", (event, message) => callback(message));
	},
});
