import dynamic from "next/dynamic";

const CustomForceGraph = dynamic(() => import("./forceGraph"), {
	ssr: false
});

export default CustomForceGraph;
