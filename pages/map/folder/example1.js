

import * as je from "../folder/jaxa.earth.esm.js";
import { coastline } from "https://github.com/SystemEngineer/coastline-js";

const map = L.map("map", {
	crs: L.CRS.EPSG4326,
	center: [0, 0],
	zoom: 1,
	minZoom: 1,
	maxZoom: 15,
	// maxBounds: [[-90, -360],[90, 360]], //south west north east

	// zoomControl: false,
	attributionControl: false,
});

L.geoJSON(coastline, {
	style: {
		"color": "#000000",
		"weight": 1,
		"opacity": 0.5
	}
}).addTo(map);

je.leaflet.createLayer({
	//Leaflet縺ｮ繧ｪ繝悶ず繧ｧ繧ｯ繝医ｒ貂｡縺�
	L,

	collection: "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_ALOS.PRISM_AW3D30.v3.2_global/collection.json",
	band: "DSM",

	//逵∫払譎ゅ�繝��繧ｿ縺ｮ蛟､蝓溷�繧偵げ繝ｬ繝ｼ繧ｹ繧ｱ繝ｼ繝ｫ縺ｧ陦ｨ遉ｺ
	colorMap: {
		min: 0,
		max: 6000,
		colors: "jet",
	},


	//繝舌う繝ｪ繝九い繝ｪ繧ｵ繝ｳ繝励Μ繝ｳ繧ｰ繧剃ｽｿ逕ｨ(譛ｪ謖�ｮ壽凾縺ｯ鬮倬溘↑繝九い繝ｬ繧ｹ繝医ロ繧､繝舌�繧剃ｽｿ逕ｨ)
	// bilinearResampling: true,

}).addTo(map);





