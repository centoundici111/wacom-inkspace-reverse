const { ipcRenderer } = require("electron");

function sendPathRequest(pathName) {
	return ipcRenderer.sendSync("preload:get-app-path", pathName);
}

window.__INKSPACE_PRELOAD__ = Object.freeze({
	getDownloadsPath() {
		return sendPathRequest("downloads");
	},

	getUserDataPath() {
		return sendPathRequest("userData");
	},

	showSaveDialog(options) {
		return ipcRenderer.invoke("preload:show-save-dialog", options || {});
	},

	showOpenDialog(options) {
		return ipcRenderer.invoke("preload:show-open-dialog", options || {});
	},
});
