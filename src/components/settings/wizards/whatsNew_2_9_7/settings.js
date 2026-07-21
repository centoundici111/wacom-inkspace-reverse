import images from "../../../../images";
import Dictionary from "./dictionary";

export default {
	version: "2.9.7",
	config: {
		prefix: "whatsNew",
		className: "center",
		discardXButton: true,
		discardOverlayClick: true,

		dictionary: Dictionary,

		steps: [
			{
				image: { src: images.whatsNewStep1 },
				buttons: [{ text: "btn.OK" }],
			},
		],
	},
};
