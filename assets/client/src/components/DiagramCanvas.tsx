import { useCallback, useRef } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Edge, type Node,
  MarkerType, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PraatplaatNode from "./PraatplaatNode";
import WhiteboardNode from "./WhiteboardNode";
import { SketchEdge, SketchAnimatedEdge } from "./SketchEdge";
import type { CanvasElement, CanvasRelation, VisualStyle, ElementType, RelationType, CustomStyle } from "@shared/schema";
import { ELEMENT_COLORS, getRelationConfig } from "@/lib/elementConfig";

const nodeTypes = { praatplaat: PraatplaatNode, whiteboard: WhiteboardNode };
const edgeTypes = { sketch: SketchEdge, sketchAnimated: SketchAnimatedEdge };

interface DiagramCanvasProps {
  elements: CanvasElement[];
  relations: CanvasRelation[];
  visibleTypes: string[];
  visibleRelations: string[];
  activeStyle: string;
  customStyleConfig?: CustomStyle | null; // ingevuld als activeStyle een custom stijl is
  onElementsChange: (elements: CanvasElement[]) => void;
  onRelationsChange: (relations: CanvasRelation[]) => void;
  onElementSelect: (element: CanvasElement | null) => void;
  selectedElementId: string | null;
}

const SKETCH_STYLES = ["whiteboard", "stift", "sketch"];

function toFlowNodes(
  elements: CanvasElement[],
  visibleTypes: string[],
  selectedId: string | null,
  activeStyle: string,
  customStyleConfig?: CustomStyle | null,
): Node[] {
  const isSketchStyle = SKETCH_STYLES.includes(activeStyle);
  return elements
    .filter(e => visibleTypes.includes(e.type))
    .map(e => ({
      id: e.id,
      type: isSketchStyle ? "whiteboard" : "praatplaat",
      position: e.position,
      data: { ...e, style: activeStyle, customStyleConfig: customStyleConfig ?? null },
      selected: e.id === selectedId,
    }));
}

function toFlowEdges(relations: CanvasRelation[], visibleRelations: string[], activeStyle: string): Edge[] {
  const isSketchStyle = SKETCH_STYLES.includes(activeStyle);
  return relations
    .filter(r => visibleRelations.includes(r.type))
    .map(r => {
      const cfg = getRelationConfig(r.type as RelationType);

      if (isSketchStyle) {
        // Ruwe stift/whiteboard edges
        const strokeColor = activeStyle === "stift" ? "#374151" : "#2a2a2a";
        return {
          id: r.id,
          source: r.sourceId,
          target: r.targetId,
          type: cfg.animated ? "sketchAnimated" : "sketch",
          label: r.label ?? "",
          data: { dashed: cfg.dashed, visualStyle: activeStyle },
          markerEnd: cfg.markerEnd !== "none" ? {
            type: cfg.markerEnd === "arrowclosed" ? MarkerType.ArrowClosed : MarkerType.Arrow,
            width: activeStyle === "stift" ? 18 : 14,
            height: activeStyle === "stift" ? 18 : 14,
            color: strokeColor,
          } : undefined,
        };
      }

      // Normale edges voor niet-schets stijlen
      return {
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        label: r.label ?? "",
        animated: cfg.animated,
        style: {
          strokeDasharray: cfg.dashed ? "5,4" : undefined,
          stroke: "#64748b",
          strokeWidth: 1.8,
        },
        labelStyle: { fill: "#475569", fontSize: 11, fontFamily: "'DM Sans', sans-serif" },
        labelBgStyle: { fill: "white", fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        markerEnd: cfg.markerEnd !== "none" ? {
          type: cfg.markerEnd === "arrowclosed" ? MarkerType.ArrowClosed : MarkerType.Arrow,
          width: 16,
          height: 16,
          color: "#64748b",
        } : undefined,
      };
    });
}

export default function DiagramCanvas({
  elements,
  relations,
  visibleTypes,
  visibleRelations,
  activeStyle,
  customStyleConfig,
  onElementsChange,
  onRelationsChange,
  onElementSelect,
  selectedElementId,
}: DiagramCanvasProps) {
  const nodes = toFlowNodes(elements, visibleTypes, selectedElementId, activeStyle, customStyleConfig);
  const edges = toFlowEdges(relations, visibleRelations, activeStyle);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newRelation: CanvasRelation = {
        id: `r_${Date.now()}`,
        sourceId: params.source,
        targetId: params.target,
        type: "association",
        label: "",
      };
      onRelationsChange([...relations, newRelation]);
    },
    [relations, onRelationsChange]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      const updated = elements.map(e =>
        e.id === node.id ? { ...e, position: node.position } : e
      );
      onElementsChange(updated);
    },
    [elements, onElementsChange]
  );

  const onNodeClick = useCallback(
    (_event: any, node: Node) => {
      const el = elements.find(e => e.id === node.id) ?? null;
      onElementSelect(el);
    },
    [elements, onElementSelect]
  );

  const onPaneClick = useCallback(() => {
    onElementSelect(null);
  }, [onElementSelect]);

  const isSketchStyle = SKETCH_STYLES.includes(activeStyle);

  const bgVariant = activeStyle === "blueprint"
    ? BackgroundVariant.Lines
    : activeStyle === "whiteboard"
    ? BackgroundVariant.Lines
    : (activeStyle === "sketch" || activeStyle === "stift")
    ? BackgroundVariant.Cross
    : BackgroundVariant.Dots;

  // Custom stijl achtergrond
  const customBg = (!SKETCH_STYLES.includes(activeStyle) && customStyleConfig)
    ? customStyleConfig.bgColor
    : undefined;

  const bgColor = customBg ?? (
    activeStyle === "blueprint" ? "#1e3a5f" :
    activeStyle === "whiteboard" ? "#fafaf8" :
    activeStyle === "stift" ? "#f7f4ff" :
    activeStyle === "sketch" ? "#fdf8f0" :
    activeStyle === "playful" ? "#fefce8" : undefined
  );

  const bgPatternColor = activeStyle === "blueprint" ? "#3b82f680" :
    activeStyle === "whiteboard" ? "rgba(0,0,0,0.04)" :
    activeStyle === "stift" ? "rgba(100,80,200,0.06)" :
    activeStyle === "sketch" ? "#92400e30" :
    "#94a3b820";

  const bgSize = (activeStyle === "whiteboard" || activeStyle === "stift") ? 32 : 16;

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%", background: bgColor }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      >
        <Background
          variant={bgVariant}
          gap={bgSize}
          size={activeStyle === "blueprint" ? 1 : 1.2}
          color={bgPatternColor}
        />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          position="bottom-left"
          nodeColor={(node) => {
            const el = elements.find(e => e.id === node.id);
            return el ? (ELEMENT_COLORS[el.type]?.border ?? "#64748b") : "#64748b";
          }}
          style={{ width: 140, height: 90 }}
        />
      </ReactFlow>
    </div>
  );
}
