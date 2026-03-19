import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, X } from "lucide-react";
import type { CanvasElement, VisualStyle } from "@shared/schema";
import { SKETCH_FIGURES } from "./SketchFigures";

const TYPE_LABELS: Record<string, string> = {
  actor: "Actor",
  process: "Proces",
  application: "Applicatie",
  data: "Gegevens",
  transaction: "Transactie",
  system: "Systeem",
  event: "Gebeurtenis",
  decision: "Beslissing",
  service: "Dienst",
  infrastructure: "Infrastructuur",
};

// Stift-stijl kleuren per type
const STIFT_COLORS: Record<string, { stroke: string; accent: string }> = {
  actor:          { stroke: "#1a56db", accent: "#1e40af" },
  process:        { stroke: "#166534", accent: "#15803d" },
  application:    { stroke: "#6d28d9", accent: "#7c3aed" },
  data:           { stroke: "#92400e", accent: "#b45309" },
  transaction:    { stroke: "#0f766e", accent: "#0d9488" },
  system:         { stroke: "#374151", accent: "#4b5563" },
  event:          { stroke: "#c2410c", accent: "#ea580c" },
  decision:       { stroke: "#9f1239", accent: "#be123c" },
  service:        { stroke: "#0e7490", accent: "#0891b2" },
  infrastructure: { stroke: "#374151", accent: "#4b5563" },
};

// Whiteboard kleuren (donker potlood/stift)
const WHITEBOARD_COLORS: Record<string, string> = {
  actor:          "#1a1a2e",
  process:        "#1a2e1a",
  application:    "#1a1a3e",
  data:           "#2e1a00",
  transaction:    "#002e2a",
  system:         "#1a1a1a",
  event:          "#2e0a00",
  decision:       "#2e001a",
  service:        "#00192e",
  infrastructure: "#101018",
};

interface WhiteboardNodeData extends CanvasElement {
  onLabelChange?: (id: string, label: string) => void;
}

// Ruwe border voor whiteboard stijl
function SketchBorder({ w, h, style }: { w: number; h: number; style: VisualStyle }) {
  const j = (v: number, a = 2) => v + Math.sin(v * 7.3 + 1) * a;
  const isStift = style === "stift";

  if (isStift) {
    // Dubbele lijn, dikker, expressief
    return (
      <svg
        width={w + 20} height={h + 20}
        style={{ position: "absolute", top: -10, left: -10, pointerEvents: "none", overflow: "visible" }}
      >
        <path
          d={`M${j(4,3)},${j(4,2)} L${w + j(16,3)},${j(3,2)} L${w + j(15,3)},${h + j(17,3)} L${j(3,2)},${h + j(16,3)} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.15}
        />
        <path
          d={`M${j(5,2)},${j(5,1.5)} L${w + j(14,2)},${j(4,1.5)} L${w + j(14,2)},${h + j(15,2.5)} L${j(4,1.5)},${h + j(15,2)} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
      </svg>
    );
  }

  // Whiteboard: potlood/stift omlijning
  return (
    <svg
      width={w + 24} height={h + 24}
      style={{ position: "absolute", top: -12, left: -12, pointerEvents: "none", overflow: "visible" }}
    >
      <path
        d={`M${j(4,3.5)},${j(5,2)} L${w + j(18,3)},${j(4,2.5)} L${w + j(17,3)},${h + j(19,3.5)} L${j(5,2.5)},${h + j(18,3)} Z`}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WhiteboardNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WhiteboardNodeData;
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);

  const style = nodeData.style as VisualStyle;
  const isStift = style === "stift";
  const isWhiteboard = style === "whiteboard";
  const isSketch = style === "sketch";

  const strokeColor = isStift
    ? (STIFT_COLORS[nodeData.type]?.stroke ?? "#333")
    : WHITEBOARD_COLORS[nodeData.type] ?? "#1a1a2e";

  const FigureComponent = SKETCH_FIGURES[nodeData.type];

  // Bepaal node-afmetingen op basis van type
  const isWide = ["process", "application", "system", "infrastructure", "service"].includes(nodeData.type);
  const isTall = ["actor", "decision"].includes(nodeData.type);
  const nodeW = isWide ? 140 : isTall ? 110 : 120;
  const nodeH = isTall ? 130 : 100;

  // Figure-canvas afmetingen
  const figW = nodeW - 8;
  const figH = nodeH * 0.56;
  const figCX = figW * 0.5;
  const figCY = figH * 0.52;

  const handleSave = () => {
    if (nodeData.onLabelChange && editValue.trim()) {
      nodeData.onLabelChange(nodeData.id, editValue.trim());
    }
    setEditing(false);
  };

  const fontFamily = isStift
    ? "'Caveat', 'Patrick Hand', cursive"
    : "'Patrick Hand', 'Caveat', cursive";

  const bgColor = isStift
    ? "rgba(250,249,255,0.92)"
    : isWhiteboard
    ? "rgba(255,255,253,0.95)"
    : "rgba(255,253,240,0.92)";

  return (
    <div
      data-testid={`node-${nodeData.id}`}
      style={{
        width: nodeW,
        minHeight: nodeH,
        position: "relative",
        background: "transparent",
        fontFamily,
        cursor: "grab",
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left}
        style={{ background: strokeColor, width: 10, height: 10, border: "2px solid white", zIndex: 10 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: strokeColor, width: 10, height: 10, border: "2px solid white", zIndex: 10 }} />
      <Handle type="target" position={Position.Top}
        style={{ background: strokeColor, width: 8, height: 8, border: "2px solid white", opacity: 0.6, zIndex: 10 }} />
      <Handle type="source" position={Position.Bottom}
        style={{ background: strokeColor, width: 8, height: 8, border: "2px solid white", opacity: 0.6, zIndex: 10 }} />

      {/* Schets-omlijning */}
      {selected && (
        <div style={{
          position: "absolute", inset: -3,
          border: `2.5px dashed ${isStift ? STIFT_COLORS[nodeData.type]?.accent : "#3b82f6"}`,
          borderRadius: 4,
          pointerEvents: "none",
          opacity: 0.7,
        }} />
      )}

      {/* Schets-figuur bovenin */}
      <div style={{
        display: "flex", justifyContent: "center",
        paddingTop: nodeData.type === "actor" ? 6 : 4,
        paddingBottom: 2,
      }}>
        {FigureComponent && (
          <svg
            width={figW} height={figH}
            style={{ overflow: "visible" }}
            viewBox={`0 0 ${figW} ${figH}`}
          >
            {nodeData.iconUrl ? (
              <image
                href={nodeData.iconUrl}
                x={figCX - figH * 0.35}
                y={0}
                width={figH * 0.7}
                height={figH * 0.7}
              />
            ) : (
              <FigureComponent
                cx={figCX} cy={figCY}
                w={isWide ? figW * 0.82 : figW * 0.7}
                h={figH * 0.78}
                size={figH * 0.85}
                stroke={strokeColor}
              />
            )}
          </svg>
        )}
      </div>

      {/* Type label */}
      <div style={{
        textAlign: "center",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isStift ? STIFT_COLORS[nodeData.type]?.stroke : "rgba(0,0,0,0.35)",
        lineHeight: 1,
        marginBottom: 2,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {TYPE_LABELS[nodeData.type]}
      </div>

      {/* Label */}
      <div style={{ padding: "0 8px 8px" }}>
        {editing ? (
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <input
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${strokeColor}`,
                color: strokeColor,
                fontFamily,
                fontSize: 15,
                fontWeight: 600,
                width: "100%",
                outline: "none",
                textAlign: "center",
              }}
            />
            <button onClick={handleSave} style={{ color: "#22c55e", padding: 0, flexShrink: 0 }}>
              <Check size={12} />
            </button>
            <button onClick={() => setEditing(false)} style={{ color: "#ef4444", padding: 0, flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={() => { setEditing(true); setEditValue(nodeData.label); }}
            style={{
              textAlign: "center",
              fontSize: isStift ? 16 : 15,
              fontWeight: isStift ? 700 : 600,
              lineHeight: 1.25,
              color: strokeColor,
              wordBreak: "break-word",
              cursor: "text",
            }}
          >
            {nodeData.label}
          </div>
        )}

        {nodeData.description && !editing && (
          <div style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(0,0,0,0.35)",
            marginTop: 3,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {nodeData.description}
          </div>
        )}
      </div>
    </div>
  );
});

WhiteboardNode.displayName = "WhiteboardNode";
export default WhiteboardNode;
