"use client"

// import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph, { ForceGraphMethods, GraphData, LinkObject, NodeObject } from "react-force-graph-2d";
import jsondata from "./miserables.json";

// const _ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
// ssr: false
// });
/*
const ForwardGraph3D = forwardRef(
  (props: ForceGraphProps, ref: MutableRefObject<ForceGraphMethods>) => (
	<ForceGraph3D {...props} ref={ref} />
  )
);
*/

interface Node {
	id: string,
	group: number
}
interface Link {
	source: NodeObject<Node>,
	target: NodeObject<Node>,
	value: string,
}

interface GraphSettings {
	focusMode: boolean
}
function default_graph_settings(): GraphSettings {
	return { focusMode: false }
}

const CustomFocusGraph = ({ settings }: { settings: GraphSettings }) => {
	const fgRef = useRef<ForceGraphMethods<Node, Link>>();

	const json_node_map = new Map<string, Node>(jsondata.nodes.map(o => [o.id, o]))
	const [data, setData] = useState<GraphData<NodeObject<Node>, LinkObject<Node, Link>>>({
		nodes: jsondata.nodes,
		links: jsondata.links.map(l => ({
			source: json_node_map.get(l.source)!,
			target: json_node_map.get(l.target)!,
			value: l.value
		}))
	});
	const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined);
	const [focusedNodes, setFocusedNodes] = useState<Set<NodeObject<Node>>>(new Set());
	const [focusedLinks, setFocusedLinks] = useState<Set<LinkObject<Node, Link>>>(new Set());

	useEffect(() => {
		// Define the function to call when a key is pressed
		const handleKeyPress = (event: KeyboardEvent) => {
			switch (event.key) {
				case "d":
					console.log("deleting:", selectedNode);
					if (selectedNode !== undefined) {
						const { nodes, links } = data;
						// remove selected node and relevant links from graph
						const newLinks = links.filter(l => !(l.source === selectedNode || l.target === selectedNode)); // Remove links attached to node
						const newNodes = nodes.filter((val) => val.id !== selectedNode);
						console.log(newLinks);
						console.log(links);
						setData({ nodes: newNodes, links: newLinks });
						setSelectedNode(undefined);
					}
					break;
				case "r":
					fgRef.current?.d3ReheatSimulation();
				default:
					console.log(`Key pressed: ${event.key}`);
					break;
			}
		};

		// Add event listener for 'keydown' event
		window.addEventListener('keydown', handleKeyPress);

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [data, setData, selectedNode, setSelectedNode]); // Empty dependency array means this effect runs only once after the initial render

	let nodeClickCallback = useCallback((node: NodeObject<Node>) => {
		let newSelectedNode = node.id;
		setSelectedNode(newSelectedNode);
		fgRef.current?.centerAt(node.x, node.y, 400);
		fgRef.current?.zoom(10, 1000);

		const newFocusedNodes = new Set<NodeObject<Node>>();
		const newFocusedLinks = new Set<LinkObject<Node, Link>>();
		// Add the selected node
		newFocusedNodes.add(node);

		// Go through all links to find connected nodes and links
		data.links.forEach(link => {
			if (link.source.id === newSelectedNode || link.target.id === newSelectedNode) {
				newFocusedNodes.add(link.source);
				newFocusedNodes.add(link.target);
				newFocusedLinks.add(link);
			}
		});
		setFocusedNodes(newFocusedNodes);
		setFocusedLinks(newFocusedLinks);
		console.log(newFocusedNodes, newFocusedLinks, newSelectedNode);
	}, [setSelectedNode, setFocusedNodes, setFocusedLinks, data]);

	const nodeRelSize = 4;
	return (
		<ForceGraph
			ref={fgRef}
			graphData={data}
			nodeId="id"
			nodeLabel="id"
			onNodeClick={nodeClickCallback}
			nodeAutoColorBy="group"
			nodeRelSize={nodeRelSize}
			nodeCanvasObjectMode={() => "after"}
			nodeCanvasObject={(node, ctx, globalScale) => {
				const label = node.id as string; // node label
				const fontSize = 20 / globalScale; // scale with zoom

				ctx.font = `${fontSize}px Sans-Serif`; // set font
				const textWidth = ctx.measureText(label).width;

				const nodeColor = 'rgb(100, 100, 100)';

				if (focusedNodes.has(node)) {
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
					ctx.fillText(label, node.x!, node.y! + fontSize * 2);
				} else if (settings.focusMode) {
					// draw circle
					ctx.beginPath();
					ctx.arc(node.x!, node.y!, nodeRelSize, 0, 2 * Math.PI);
					// render stroke and fill
					ctx.strokeStyle = nodeColor;
					// selected node set stroke
					if (node.id == selectedNode) {
						ctx.strokeStyle = 'rgb(255,255,0)';
					}
					ctx.stroke();
					ctx.fillStyle = nodeColor;
					ctx.fill();
				}
			}}
			linkDirectionalArrowLength={3}
			linkDirectionalArrowRelPos={10}
			linkWidth={10}
			linkCanvasObjectMode={() => "after"}
			linkCanvasObject={(link: LinkObject<Node, Link>, ctx) => {
				const MAX_FONT_SIZE = 4;
				const nodeRelSize = 4;
				const LABEL_NODE_MARGIN = nodeRelSize * 1.5;

				if (focusedLinks.has(link)) {
					const start = link.source;
					const end = link.target;

					// ignore unbound links
					if (typeof start !== 'object' || typeof end !== 'object') return;

					// calculate label positioning
					const textPos = ['x', 'y'].reduce((acc, key) => {
						acc[key] = start[key] + (end[key] - start[key]) / 2;
						return acc;
					}, {} as Record<string, number>);

					const relLink = { x: end.x! - start.x!, y: end.y! - start.y! };

					const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

					let textAngle = Math.atan2(relLink.y, relLink.x);
					// maintain label vertical orientation for legibility
					if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
					if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

					const label = `${link.source.id} > ${link.target.id}`;

					// estimate fontSize to fit in link length
					ctx.font = '1px Sans-Serif';
					const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
					ctx.font = `${fontSize}px Sans-Serif`;
					const textWidth = ctx.measureText(label).width;

					// draw text label
					ctx.save();
					ctx.translate(textPos.x, textPos.y);
					ctx.rotate(textAngle);

					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillStyle = 'rgb(255 72 72)';
					ctx.fillText(label, 0, 0);
					ctx.restore();
				}
			}}
		/>
	);
};

export default CustomFocusGraph;
