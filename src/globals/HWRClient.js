const querystring = require("querystring");

const config = require("../../project.config.js")["hwr"];

let HWRClient = {
	searchText(searchStr) {
		let access = AuthenticationManager.getAccess();
		if (!access) return Promise.reject(new Error("NOT_AUTHORIZED"));

		let request = new Request(
			`${config.searchURL}?${querystring.stringify({ searchStr })}`,
			{
				method: "GET",
				headers: new Headers({
					Authorization: `Bearer ${access.token}`,
				}),
			}
		);

		return fetch(request).then((response) => {
			if (/2[0-9]{2}/.test(response.status)) return response.json();
			else {
				var error = new Error(response.statusText);
				error.response = response;
				throw error;
			}
		});
	},

	export(type, note, locale) {
		let access = AuthenticationManager.getAccess();
		if (!access) return Promise.reject(new Error("NOT_AUTHORIZED"));

		return DBManager.getPageLayers(note.pageId)
			.then((layers) => {
				note.layers = layers;
				let noteJson = note.toWiddJSON(locale);

				let request = new Request(`${config.export[type]}`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${access.token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(noteJson),
				});

				return fetch(request);
			})
			.then((response) => {
				if (/2[0-9]{2}/.test(response.status)) {
					if (type === "txt") {
						return response.text();
					} else if (type === "mp4") {
						return response.text().then((taskID) => {
							return config.export.video.replace(
								"{TaskID}",
								taskID.split('"').join("")
							);
						});
					} else {
						return response.arrayBuffer();
					}
				} else {
					let error = new Error(response.statusText);
					error.response = response;
					throw error;
				}
			});
	},

	exportVideo(noteID) {
		let access = AuthenticationManager.getAccess();
		if (!access) return Promise.reject(new Error("NOT_AUTHORIZED"));

		let request = new Request(
			`${config.export["videoRequest"]}?${querystring.stringify({
				documentId: noteID,
			})}`,
			{
				method: "GET",
				headers: new Headers({
					Authorization: `Bearer ${access.token}`,
				}),
			}
		);

		return fetch(request).then((response) => {
			if (/2[0-9]{2}/.test(response.status))
				return response
					.text()
					.then((taskID) =>
						config.export.video.replace("{TaskID}", taskID)
					);
			else {
				let error = new Error(response.statusText);
				error.response = response;
				throw error;
			}
		});
	},
};

export default HWRClient;
