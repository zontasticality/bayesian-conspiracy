"use client"

import data from "./miserables.json";
import dynamic from "next/dynamic";

const DynamicForceGraph = dynamic(() => import('./forceGraph').then((mod) => mod.default), { ssr: false });

export default function Home() {
  return (
    <DynamicForceGraph
      graphData={data}
      nodeLabel={"id"}
      nodeAutoColorBy="group"
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.id as string;
        const fontSize = 20 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

        // ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        // ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(label, node.x!, node.y!);

        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
      }}
    />
  );
}
