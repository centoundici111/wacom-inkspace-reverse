const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function hasCommand(command) {
	const result = spawnSync(command, ["--version"], { stdio: "ignore" });
	return !result.error && result.status === 0;
}

function ensurePythonShim(env) {
	if (process.platform === "win32") return null;
	if (hasCommand("python")) return null;
	if (!hasCommand("python3")) return null;

	const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "inkspace-python-"));
	const shimPath = path.join(shimDir, "python");

	fs.writeFileSync(shimPath, "#!/bin/sh\nexec python3 \"$@\"\n");
	fs.chmodSync(shimPath, 0o755);

	env.PATH = `${shimDir}${path.delimiter}${env.PATH || ""}`;
	return shimDir;
}

function cleanupShim(shimDir) {
	if (!shimDir) return;

	try {
		fs.rmSync(shimDir, { recursive: true, force: true });
	} catch (error) {
		console.warn("[electron-rebuild] failed to clean python shim", error.message);
	}
}

const cliPath = path.resolve(__dirname, "../node_modules/electron-rebuild/lib/src/cli.js");

if (!fs.existsSync(cliPath)) {
	console.error("[electron-rebuild] missing dependency: install node_modules first");
	process.exit(1);
}

const env = { ...process.env };
const shimDir = ensurePythonShim(env);

if (shimDir) console.info("[electron-rebuild] using temporary python -> python3 shim");

const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
	stdio: "inherit",
	env,
});

cleanupShim(shimDir);

if (result.error) {
	console.error(result.error);
	process.exit(1);
}

process.exit(result.status || 0);
