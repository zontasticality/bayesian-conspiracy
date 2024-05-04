"use client"

// import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph, { ForceGraphMethods, GraphData, LinkObject, NodeObject } from "react-force-graph-2d";
import Popup from "reactjs-popup";
// import jsondata from "./miserables.json";
require('gun/lib/unset')

interface Node {
	id: string, // gundb uniq soul
	name: string, // name
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
// gun db
// 'graph' key is main space
// 'node' -> link to each node
//		'incoming': link[]
//		'outgoing:' link[]
//		'name': string
//		'': 
// 'links' set of links, each link contains
//		'source' - link to node
//		'target' - link to node
//		'type' - string representing type of link
//		'data' - associated link data

const CustomFocusGraph = ({ settings, gun }: { settings: GraphSettings, gun: any }) => {
	const fgRef = useRef<ForceGraphMethods<Node, Link>>();

	var graph = gun.get('graph');

	const [data, setData] = useState<GraphData<NodeObject<Node>, LinkObject<Node, Link>>>(() => {
		// initial gun setup
		const nodes = graph.get('nodes');
		nodes.once().map().once(node => {
			node.put(null); // unset all nodes
		})
		// add start node
		// let start = graph.get('nodes').set({ name: "Start" }); // add start item to node array
		// let links = start.get('incoming');
		return {
			nodes: [],
			links: []
		};
	// get start node from gundb if exists
	// get neighboring nodes
	//
		/* nodes: jsondata.nodes,
		links: jsondata.links.map(l => ({
			source: json_node_map.get(l.source)!,
			target: json_node_map.get(l.target)!,
			value: l.value
		})) */
	});

	// gundb setup node & link setState hooks
	useEffect(() => {
		const nodes = graph.get('nodes');

		console.log("updating data:", data);
		// check all nodes in db graph 
		nodes.map().on((node: any, id: any) => {
			setData(data => {
				console.log("iterating db nodes w/ id", id, "node:", node);
				let found_idx = data.nodes.findIndex((i) => i.id === id);
				// if node doesn't exist, delete from node array
				if (node === undefined) { data.nodes.splice(found_idx); return data; }
				// if node in graph matching thing, update it.
				if (found_idx !== -1) {
					data.nodes[found_idx].name = node.name;
				} else { // otherwise add new node
					data.nodes.push({ id: id, name: node.name });
				}
				console.log("data", data);
				return data;
			})
		})
	}, [data, graph])

	const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined);
	const [focusedNodes, setFocusedNodes] = useState<Set<NodeObject<Node>>>(new Set());
	const [focusedLinks, setFocusedLinks] = useState<Set<LinkObject<Node, Link>>>(new Set());

	const [localMouseCoords, setLocalMouseCoords] = useState({ x: 0, y: 0 });

	function addNode(formData: any) {
		const nodeName = formData.get("name");
		setNodePopupOpen(false);
		graph.get('nodes').set({ name: nodeName });
		console.log("adding:", nodeName);
	}

	const [nodePopupOpen, setNodePopupOpen] = useState(false);
	const [nodePopupPos, setNodePopupPos] = useState({ x: 0, y: 0 });
	const closeNodePopup = () => setNodePopupOpen(false);
		// Define the function to call when a key is pressed
	const handleKeyPress = (event: any) => {
		if (nodePopupOpen === true) { return; }
		switch (event.key) {
			case "d":
				console.log("deleting:", selectedNode);
				if (selectedNode !== undefined) {
					const { nodes, links } = data;
					// remove selected node and relevant links from graph
					const newLinks = links.filter(l => !(l.source.id === selectedNode || l.target.id === selectedNode)); // Remove links attached to node
					const newNodes = nodes.filter((val) => val.id !== selectedNode);
					console.log(newLinks);
					console.log(links);
					setData({ nodes: newNodes, links: newLinks });
					setSelectedNode(undefined);
				}
				break;
			case "n":
				// add new node
				console.log("opened popup at:", localMouseCoords);
				setNodePopupOpen(true);
				setNodePopupPos(localMouseCoords);
			case "r":
				fgRef.current?.d3ReheatSimulation();
			// if (selectedNode) { fgRef.current?.centerAt(); }
			default:
				// console.log(`Key pressed: ${event.key}`);
				break;
		}
	};

	const handleMouseMove = (event: any) => {
		const newMouseCoords = {
			x: event.clientX - event.target.offsetLeft,
			y: event.clientY - event.target.offsetTop,
		};
		setLocalMouseCoords(newMouseCoords);
		// console.log(newMouseCoords);
	};

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
		<div tabIndex={0} onMouseMove={handleMouseMove} onKeyDown={handleKeyPress}>
			<Popup contentStyle={{
				position: "absolute",
				left: `${nodePopupPos.x}px`,
				top: `${nodePopupPos.y}px`,
			}} className="modal" position="right center" open={nodePopupOpen} onClose={closeNodePopup}>
				<form action={addNode}>
					<input name="name" />
					<button type="submit"></button>
				</form>
			</Popup>

		<ForceGraph
			ref={fgRef}
			graphData={data}
			nodeId="id"
			nodeLabel="id"
			onNodeClick={nodeClickCallback}
				nodeAutoColorBy="name"
			nodeRelSize={nodeRelSize}
			nodeCanvasObjectMode={() => "after"}
			nodeCanvasObject={(node, ctx, globalScale) => {
				const label = node.name;
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
		</div>
	);
};

export default CustomFocusGraph;
