import { type EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from "@xyflow/react";

// Ruwe, grillige pijl voor whiteboard / stift stijl
export function SketchEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, label, selected, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const style = (data as any)?.visualStyle ?? "whiteboard";
  const isStift = style === "stift";

  // Stift: dikke, expressieve lijn; Whiteboard: dunnere potloodlijn
  const strokeWidth = isStift ? 2.6 : 1.8;
  const strokeColor = selected ? "#3b82f6" : isStift ? "#374151" : "#2a2a2a";
  const strokeDash = (data as any)?.dashed ? "6 4" : undefined;

  return (
    <>
      {/* Schaduwlijn (offset, geeft diepte) */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth + 2}
        opacity={0.06}
        strokeLinecap="round"
        strokeDasharray={strokeDash}
        transform="translate(1.5, 1.5)"
      />
      {/* Hoofdlijn */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDash}
        markerEnd={markerEnd}
        className={`react-flow__edge-path${selected ? " selected" : ""}`}
      />
      {/* Dubbele lijn voor "dubbele stift" effect */}
      {isStift && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={0.8}
          opacity={0.25}
          strokeLinecap="round"
          transform="translate(2, 1)"
          strokeDasharray={strokeDash}
        />
      )}

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              fontFamily: isStift
                ? "'Caveat', 'Patrick Hand', cursive"
                : "'Patrick Hand', 'Caveat', cursive",
              fontSize: isStift ? 14 : 12,
              fontWeight: isStift ? 700 : 500,
              color: strokeColor,
              background: "rgba(255,255,252,0.88)",
              padding: "1px 6px",
              borderRadius: 3,
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Animerende stift-pijl (voor triggers en flows)
export function SketchAnimatedEdge(props: EdgeProps) {
  return <SketchEdge {...props} />;
}
