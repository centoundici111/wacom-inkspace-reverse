const EventEmitter = require("events");

function getPreloadAPI() {
	if (!window.__INKSPACE_PRELOAD__)
		throw new Error("Inkspace preload API is unavailable");

	return window.__INKSPACE_PRELOAD__;
}

function toError(error) {
	if (!error) return null;

	let result = new Error(error.message);
	result.name = error.name || "Error";
	if (error.stack) result.stack = error.stack;

	return result;
}

const ports = new Map();
let serialPortEventsAttached = false;

function attachSerialPortEvents() {
	if (serialPortEventsAttached) return;

	serialPortEventsAttached = true;
	getPreloadAPI().onSerialPortEvent((message) => {
		let port = ports.get(message.portID);
		if (!port) return;

		port.handleMainEvent(message);
	});
}

class SerialPort extends EventEmitter {
	constructor(path, options) {
		super();

		attachSerialPortEvents();

		this.path = path;
		this.options = options || {};
		this.isOpen = false;
		this.portID = null;
	}

	open(callback) {
		getPreloadAPI()
			.openSerialPort({ path: this.path, options: this.options })
			.then((result) => {
				this.portID = result.portID;
				this.isOpen = true;
				ports.set(this.portID, this);

				if (callback) callback();
			})
			.catch((error) => {
				if (callback) callback(toError(error));
			});
	}

	write(buffer, callback) {
		if (!this.portID) {
			if (callback) callback(new Error("Serial port is not open"));
			return;
		}

		getPreloadAPI()
			.writeSerialPort({
				portID: this.portID,
				data: Array.from(buffer || []),
			})
			.then(() => {
				if (callback) callback();
			})
			.catch((error) => {
				if (callback) callback(toError(error));
			});
	}

	drain(callback) {
		if (!this.portID) {
			if (callback) callback(new Error("Serial port is not open"));
			return;
		}

		getPreloadAPI()
			.drainSerialPort({ portID: this.portID })
			.then(() => {
				if (callback) callback();
			})
			.catch((error) => {
				if (callback) callback(toError(error));
			});
	}

	close(callback) {
		if (!this.portID) {
			this.isOpen = false;
			if (callback) callback();
			return;
		}

		getPreloadAPI()
			.closeSerialPort({ portID: this.portID })
			.then(() => {
				if (callback) callback();
			})
			.catch((error) => {
				if (callback) callback(toError(error));
			});
	}

	handleMainEvent(message) {
		switch (message.type) {
			case "data":
				this.emit("data", Buffer.from(message.data || []));
				break;
			case "disconnect":
				this.emit("disconnect", toError(message.error));
				break;
			case "error":
				this.emit("error", toError(message.error));
				break;
			case "close":
				ports.delete(this.portID);
				this.portID = null;
				this.isOpen = false;
				this.emit("close", toError(message.error));
				break;
		}
	}

	static list() {
		return getPreloadAPI().listSerialPorts();
	}
}

module.exports = SerialPort;
