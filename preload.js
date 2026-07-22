const { ipcRenderer } = require("electron");

function sendPathRequest(pathName) {
	return ipcRenderer.sendSync("preload:get-app-path", pathName);
}

function sendMainValueRequest(name) {
	return ipcRenderer.sendSync("preload:get-main-value", name);
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
});
