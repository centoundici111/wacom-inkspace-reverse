const os = require("os");
const fs = require("fs");
const path = require("path");
const process = require("process");

const electron = require("electron");
const {
	app,
	ipcMain,
	BrowserWindow,
	Menu,
	powerMonitor,
	powerSaveBlocker,
	Tray,
	nativeImage,
	crashReporter,
} = require("electron");

const { v4: uuid } = require("uuid");

const autoUpdater = require("./auto-updater");
const fsUtils = require("./scripts/FSUtils");
const DBBridge = require("./scripts/DBBridgeMain");
const DataMigration = require("./scripts/DataMigration");

const project = require("./project.config.js");
const pkg = require("./package.json");
const pkgVersion = pkg.version.split("-")[0];

global.THREAD = "MAIN";
global.ROOT = path.resolve(__dirname);
global.debug =
	process.env.NODE_ENV === "development" ||
	project.debug ||
	pkg.version.indexOf("beta") != -1;

global.mainWindow = null;

let powerSaverID = null;
let mainWindowSize = null;
let devReloadWatcher = null;
let devReloadTimer = null;
const rendererPowerBlockers = new Map();

function sendToMainWindow(channel, message) {
	if (!mainWindow || mainWindow.isDestroyed()) return;

	mainWindow.webContents.send(channel, message);
}

ipcMain.on("preload:get-app-path", (event, pathName) => {
	event.returnValue = app.getPath(pathName);
});

ipcMain.on("preload:get-main-value", (event, name) => {
	switch (name) {
		case "ROOT":
			event.returnValue = global.ROOT;
			return;
		case "previousVersion":
			event.returnValue = global.previousVersion;
			return;
		case "updateFound":
			event.returnValue = global.updateFound;
			return;
		case "updateInstalled":
			event.returnValue = global.updateInstalled;
			return;
		default:
			throw new Error("Unknown preload main value request: " + name);
	}
});

ipcMain.handle("preload:show-save-dialog", async (event, options) => {
	const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;
	const result = await electron.dialog.showSaveDialog(window, options || {});

	return result.filePath;
});

ipcMain.handle("preload:show-open-dialog", async (event, options) => {
	const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;
	const result = await electron.dialog.showOpenDialog(window, options || {});

	return result.filePaths;
});

ipcMain.on("preload:update-window", (event, props) => {
	const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;

	if (window && props) {
		if ("resizable" in props) window.setResizable(props.resizable);
		if ("maximizable" in props) window.setMaximizable(props.maximizable);
		if ("size" in props) window.setSize(props.size.width, props.size.height);
	}

	event.returnValue = true;
});

ipcMain.handle("preload:maximize-window", (event) => {
	const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;
	if (window) window.maximize();
});

ipcMain.handle("preload:reload-window", (event) => {
	const window = BrowserWindow.fromWebContents(event.sender) || mainWindow;
	if (window) window.reload();
});

ipcMain.handle("preload:quit-app", () => {
	app.quit();
});

ipcMain.on("preload:block-sleep", (event) => {
	const senderID = event.sender.id;
	let blockerID = rendererPowerBlockers.get(senderID);

	if (!blockerID) {
		blockerID = powerSaveBlocker.start("prevent-display-sleep");
		rendererPowerBlockers.set(senderID, blockerID);
	}

	event.returnValue = blockerID;
});

ipcMain.on("preload:unblock-sleep", (event, blockerID) => {
	const senderID = event.sender.id;
	const activeBlockerID = blockerID || rendererPowerBlockers.get(senderID);

	if (activeBlockerID && powerSaveBlocker.isStarted(activeBlockerID))
		powerSaveBlocker.stop(activeBlockerID);

	rendererPowerBlockers.delete(senderID);
	event.returnValue = true;
});

powerMonitor.on("suspend", () => sendToMainWindow("preload:power-event", { type: "suspend" }));
powerMonitor.on("resume", () => sendToMainWindow("preload:power-event", { type: "resume" }));
powerMonitor.on("lock-screen", () =>
	sendToMainWindow("preload:power-event", { type: "lock-screen" })
);
powerMonitor.on("unlock-screen", () =>
	sendToMainWindow("preload:power-event", { type: "unlock-screen" })
);

crashReporter.start({
	productName: "InkspaceDesktop",
	companyName: "Wacom Co LTD",
	submitURL: project.crashReportURL,
	compress: true,
	extra: {
		product: app.getName(),
		version:
			app.getVersion() +
			", based on Electron " +
			process.versions.electron,
	},
});

function initialize() {
	let shouldQuit = makeSingleInstance();
	if (shouldQuit) return app.quit();

	app.on("ready", function () {
		mainWindowSize = { width: 1040, height: 749 };

		connectDB()
			.then(() => {
				installExtensions();

				// createWindow()
				autoUpdater.onCheckComplete = createWindow;
				autoUpdater.init();
				// initTray()

				powerSaverID = powerSaveBlocker.start("prevent-app-suspension");
				if (debug)
					console.info("[START] power-saver-id:", powerSaverID);
			})
			.catch(console.error);
	});

	app.on("activate", function () {
		if (mainWindow === null) createWindow();
	});

	autoUpdater.updateMenu();
}

/**
 *  Make this app a single instance app.
 *
 * The main window will be restored and focused instead of a second window
 * opened when a person attempts to launch a second instance.
 *
 * Returns true if the current version of the app should quit instead of
 * launching.
 */
function makeSingleInstance() {
	if (process.mas) return false;

	const lock = app.requestSingleInstanceLock();

	if (lock) {
		app.on("second-instance", (event, commandLine, workingDirectory) => {
			// Someone tried to run a second instance, we should focus our window.
			if (mainWindow) {
				if (mainWindow.isMinimized()) mainWindow.restore();
				mainWindow.focus();
			}
		});
	}

	return !lock;
}

function connectDB() {
	let DBManager = new DBBridge();

	return DBManager.openDB()
		.then(() => DBManager.get(DBManager.entities.SETTINGS))
		.then((settings) => {
			if (settings) {
				let update = false;

				if (!settings.appID) {
					settings.appID = createAppID();
					update = true;
				}

				if (!settings.appUserID) {
					settings.appUserID = uuid();
					update = true;
				}

				if (!settings.window) {
					settings.window = mainWindowSize;
					update = true;
				}

				mainWindowSize = settings.window;

				if (update)
					return DBManager.edit(
						DBManager.entities.SETTINGS,
						settings
					).then(() => settings);
				else return settings;
			} else {
				settings = {
					appID: createAppID(),
					appUserID: uuid(),
					version: pkgVersion,
					window: mainWindowSize,
				};

				return DBManager.edit(
					DBManager.entities.SETTINGS,
					settings
				).then(() => settings);
			}
		})
		.then((settings) => {
			global.previousVersion = DataMigration.getPreviousVersion(settings);

			return DBManager.connectDataMigration();
		});
}

function createAppID() {
	let appID = [];

	for (let i = 0; i < 6; i++) appID.push(Math.randomInt(0, 255));

	return appID;
}

function initTray() {
	let tray;
	let imagePath;
	let image;

	if (process.platform == "darwin") imagePath = "png/16.png";
	else if (process.platform == "win32") imagePath = "win/app.ico";
	else imagePath = "win/app.ico";

	image = nativeImage.createFromPath(
		path.resolve(__dirname) + "/app-icon/" + imagePath
	);
	image.setTemplateImage(true);

	tray = new Tray(image);
	tray.setToolTip("Wacom Inkspace App");

	tray.on("click", () => {
		mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
	});

	mainWindow.on("show", () => {
		tray.setHighlightMode("always");
	});

	mainWindow.on("hide", () => {
		tray.setHighlightMode("never");
	});

	mainWindow.on("closed", () => {
		tray.destroy();
	});
}

function installExtensions() {
	if (process.env.NODE_ENV === "development") {
		const installer = require("electron-devtools-installer");
		const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];
		const forceDownload = !!process.env.UPGRADE_EXTENSIONS;

		for (const name of extensions) {
			try {
				installer.default(installer[name], forceDownload);
			} catch (e) {}
		}
	}
}

function watchDevRenderer() {
	if (process.env.NODE_ENV !== "development" || devReloadWatcher) return;

	const reloadWindow = () => {
		if (!mainWindow || mainWindow.isDestroyed()) return;

		clearTimeout(devReloadTimer);
		devReloadTimer = setTimeout(() => {
			if (mainWindow && !mainWindow.isDestroyed())
				mainWindow.webContents.reloadIgnoringCache();
		}, 150);
	};

	try {
		devReloadWatcher = fs.watch(
			__dirname,
			{ recursive: true },
			(eventType, filename) => {
				if (!filename) return;

				const normalizedFilename = filename.replace(/\\/g, "/");
				const isRendererAsset = normalizedFilename.startsWith("dist/");
				const isIndexFile = normalizedFilename === "index.html";

				if (isRendererAsset || isIndexFile) reloadWindow();
			}
		);
	} catch (error) {
		console.warn("[DEV] renderer reload watcher unavailable", error);
	}
}

function createWindow() {
	console.info("[START] createWindow");

	let windowOptions = {
		width: mainWindowSize.width,
		minWidth: 1040,
		height: mainWindowSize.height,
		title: app.getName(),
		session: "Main",
		resizable: false,
		maximizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			enableRemoteModule: true,
			nodeIntegration: true,
			contextIsolation: false,
			devTools: debug,
			defaultFontFamily: {
				standard:
					process.platform == "win32" ? "Segoe UI" : "Helvetica Neue",
			},
		},
	};

	mainWindow = new BrowserWindow(windowOptions);
	console.info("[START] BrowserWindow created");

	watchDevRenderer();

	mainWindow.loadURL(path.join("file://", __dirname, "/index.html"));
	console.info("[START] loading index.html");
	if (debug) mainWindow.webContents.openDevTools();

	mainWindow.webContents.on("did-finish-load", () => {
		console.info("[START] main window did-finish-load");
		mainWindow.show();
		mainWindow.focus();
	});

	let browserWindowSender;

	ipcMain.on(
		"browser-window",
		(event, message) => (browserWindowSender = event.sender)
	);
	mainWindow.on("minimize", () =>
		browserWindowSender.send("browser-window", { type: "minimize" })
	);
	mainWindow.on("restore", () =>
		browserWindowSender.send("browser-window", { type: "restore" })
	);

	mainWindow.on("close", function () {
		if (mainWindow.closing) {
			console.info("warn: window already closing");
			return;
		} else {
			console.info("window is closing");

			mainWindow.closing = true;

			setTimeout(() => {
				if (mainWindow) delete mainWindow.closing;
			}, 2000);
		}

		let otherWindows = BrowserWindow.getAllWindows();

		otherWindows.forEach(function (win) {
			if (win !== mainWindow) win.close();
		});
	});

	mainWindow.on("closed", function () {
		if (devReloadWatcher) {
			devReloadWatcher.close();
			devReloadWatcher = null;
		}

		clearTimeout(devReloadTimer);
		devReloadTimer = null;

		if (debug) console.info("[STOP] power-saver-id:", powerSaverID);
		powerSaveBlocker.stop(powerSaverID);

		if (process.platform == "darwin") {
			mainWindow = null;
			app.quit();
		}
	});
}
/*
function confirmRegEdit() {
	if (os.platform() == "win32" && os.release() == "10.0.15063") {
		let runas = require("runas");
		let filePath = app.getPath("temp") + "/wia.reg";

		let buffer = Buffer.from(
			"Windows Registry Editor Version 5.00" +
			"\r\n\r\n" +
			"[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\AppID\\{000138C3-C473-4790-8572-4515AC42DFFF}]" +
			"\r\n" +
			"\"AccessPermission\"=hex:01,00,04,80,9C,00,00,00,AC,00,00,00,00,00,00,00,14,00,00,00,02,00,88,00,06,00,00,00,00,00,14,00,07,00,00,00,01,01,00,00,00,00,00,05,0A,00,00,00,00,00,14,00,03,00,00,00,01,01,00,00,00,00,00,05,12,00,00,00,00,00,18,00,07,00,00,00,01,02,00,00,00,00,00,05,20,00,00,00,20,02,00,00,00,00,18,00,03,00,00,00,01,02,00,00,00,00,00,0F,02,00,00,00,01,00,00,00,00,00,14,00,03,00,00,00,01,01,00,00,00,00,00,05,13,00,00,00,00,00,14,00,03,00,00,00,01,01,00,00,00,00,00,05,14,00,00,00,01,02,00,00,00,00,00,05,20,00,00,00,20,02,00,00,01,02,00,00,00,00,00,05,20,00,00,00,20,02,00,00" +
			"\r\n\r\n" +
			"[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\AppID\\Wacom Inkspace App.exe]" +
			"\r\n" +
			"\"AppID\"=\"{000138C3-C473-4790-8572-4515AC42DFFF}\""
		);

		fs.writeFile(filePath, buffer, (err) => {
			if (err)
				app.quit();
			else {
				runas("REG", ["IMPORT", filePath], {admin: true});
				fs.unlink(filePath, () => {});
				app.quit();
			}
		});
	}
	else
		app.quit();
}
*/ /*
if (process.platform == "win32" && process.argv.length > 1) {
	console.info("process.argv.length", process.argv.length)
	console.info("process.argv[1]", process.argv[1])

	const Logger = require("./scripts/Logger");
	let logger = new Logger(app.getPath("temp"), Logger.Type.FILE);

	if (process.argv.length > 2) logger.fLog("process.argv:", process.argv.join(" :: "))
	logger.fLog("process.argv[1]:", process.argv[1])
}
*/
// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
	case "--squirrel-install":
		autoUpdater.createShortcut(() => {
			// confirmRegEdit()
			app.quit();
		});
		break;
	// case "--squirrel-firstrun":
	// break
	case "--squirrel-updated":
		// confirmRegEdit()
		app.quit();

		break;
	case "--squirrel-obsolete":
		app.quit();
		break;
	case "--squirrel-uninstall":
		autoUpdater.removeShortcut(() => {
			fsUtils.removeSync(app.getPath("userData"));
			app.quit();
		});

		break;
	case "--ignore-certificate-errors":
		// app.commandLine.appendSwitch("ignore-certificate-errors")
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

		initialize();
		break;
	// case "--ignore-gpu-blacklist":
	// 	app.commandLine.appendSwitch("ignore-gpu-blacklist")

	// 	initialize()
	// 	break
	default:
		initialize();
}
