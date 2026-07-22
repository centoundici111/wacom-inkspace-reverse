const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const nodeModulesDir = path.join(rootDir, "node_modules");
const electronDir = path.join(nodeModulesDir, "electron");
const rebuildScript = path.join(__dirname, "electron-rebuild.js");

const nativeDependencies = ["gl", "leveldown", "serialport", "usb"];

function exists(targetPath) {
	return fs.existsSync(targetPath);
}

function hasNativeDependenciesInstalled() {
	return nativeDependencies.some((dependency) =>
		exists(path.join(nodeModulesDir, dependency))
	);
}

function shouldSkip() {
	if (process.env.SKIP_ELECTRON_REBUILD === "1") {
		console.info("[postinstall] skipping electron rebuild: SKIP_ELECTRON_REBUILD=1");
		return true;
	}

	if (!exists(nodeModulesDir)) {
		console.info("[postinstall] skipping electron rebuild: node_modules missing");
		return true;
	}

	if (!exists(electronDir)) {
		console.info("[postinstall] skipping electron rebuild: electron not installed");
		return true;
	}

	if (!hasNativeDependenciesInstalled()) {
		console.info("[postinstall] skipping electron rebuild: no native dependencies installed");
		return true;
	}

	if (!exists(rebuildScript)) {
		console.info("[postinstall] skipping electron rebuild: rebuild script missing");
		return true;
	}

	return false;
}

if (!shouldSkip()) {
	console.info("[postinstall] running electron rebuild for native dependencies");

	const result = spawnSync(process.execPath, [rebuildScript], {
		cwd: rootDir,
		stdio: "inherit",
		env: process.env,
	});

	if (result.error) {
		console.error(result.error);
		process.exit(1);
	}

	process.exit(result.status || 0);
}
