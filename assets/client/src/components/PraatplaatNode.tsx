import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  User, GitBranch, Monitor, Database, ArrowLeftRight, Server,
  Zap, Split, Package, Network, Pencil, Check, X
} from "lucide-react";
import type { CanvasElement, VisualStyle, CustomStyle } from "@shared/schema";
import { ELEMENT_COLORS, getStyleConfig } from "@/lib/elementConfig";

const ICONS: Record<string, React.ComponentType<any>> = {
  User, GitBranch, Monitor, Database, ArrowLeftRight, Server,
  Zap, Split, Package, Network,
};

const ICON_NAMES: Record<string, string> = {
  actor: "User",
  process: "GitBranch",
  application: "Monitor",
  data: "Database",
  transaction: "ArrowLeftRight",
  system: "Server",
  event: "Zap",
  decision: "Split",
  service: "Package",
  infrastructure: "Network",
};

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

interface PraatplaatNodeData extends CanvasElement {
  onLabelChange?: (id: string, label: string) => void;
  customStyleConfig?: CustomStyle | null;
}

const PraatplaatNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as PraatplaatNodeData;
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);

  const colors = ELEMENT_COLORS[nodeData.type] ?? ELEMENT_COLORS.actor;
  const style = nodeData.style as string ?? "corporate";
  const customCfg = nodeData.customStyleConfig;

  // Is dit een custom stijl?
  const isCustom = !!customCfg;
  const styleCfg = isCustom ? null : getStyleConfig(style as VisualStyle);

  const iconName = ICON_NAMES[nodeData.type] ?? "User";
  const IconComponent = ICONS[iconName];

  const isBlueprint = style === "blueprint";
  const isSketch = style === "sketch";
  const isPlayful = style === "playful";

  // Kleurenlogica: custom stijl heeft voorrang
  const bgColor = isCustom
    ? (customCfg!.bgColor)
    : (isBlueprint ? colors.dark_bg : (styleCfg!.nodeBg === "white" ? colors.bg : styleCfg!.nodeBg));
  const borderColor = isCustom
    ? customCfg!.borderColor
    : (isBlueprint ? "#60a5fa" : colors.border);
  const textColor = isCustom
    ? customCfg!.textColor
    : (isBlueprint ? "#e0f2fe" : styleCfg!.nodeText);
  const fontFamily = isCustom
    ? customCfg!.fontFamily
    : (styleCfg!.fontFamily ?? "'DM Sans', sans-serif");
  const iconBg = isCustom
    ? customCfg!.accentColor + "22" // lichte accentkleur als icon achtergrond
    : (isBlueprint ? "rgba(255,255,255,0.1)" : colors.icon_bg);
  const cornerRadius = isCustom ? 6 : (styleCfg!.cornerRadius ?? 8);

  // Custom icoon voor dit elementtype (data-URL SVG)
  const customIconUrl = isCustom
    ? (customCfg!.elementIcons?.[nodeData.type] || null)
    : null;

  // Type label kleur: primary bij custom stijl
  const typeLabelColor = isCustom
    ? customCfg!.primaryColor
    : (isBlueprint ? "rgba(224,242,254,0.6)" : colors.border);

  const handleSave = () => {
    if (nodeData.onLabelChange && editValue.trim()) {
      nodeData.onLabelChange(nodeData.id, editValue.trim());
    }
    setEditing(false);
  };

  const hasShadow = isCustom ? false : (styleCfg?.shadow ?? false);

  return (
    <div
      data-testid={`node-${nodeData.id}`}
      className="praatplaat-node"
      style={{
        background: bgColor,
        border: `${selected ? 2.5 : 1.5}px solid ${selected ? "#3b82f6" : borderColor}`,
        borderRadius: cornerRadius,
        boxShadow: hasShadow
          ? selected
            ? `0 0 0 3px rgba(59,130,246,0.25), 0 4px 16px rgba(0,0,0,0.12)`
            : `0 2px 8px rgba(0,0,0,0.08)`
          : selected ? `0 0 0 3px rgba(59,130,246,0.25)` : "none",
        fontFamily: fontFamily,
        minWidth: 130,
        maxWidth: 170,
        padding: "10px 12px 10px 10px",
        color: textColor,
        position: "relative",
        transition: "box-shadow 0.15s, border-color 0.15s",
        ...(isSketch ? { transform: "rotate(-0.5deg)" } : {}),
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left} style={{ background: borderColor, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: borderColor, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 8, height: 8, opacity: 0.5 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: 8, height: 8, opacity: 0.5 }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Icon: custom icoon heeft de hoogste prioriteit, dan nodeData.iconUrl, dan standaard Lucide icoon */}
        {(customIconUrl || nodeData.iconUrl) ? (
          <img
            src={customIconUrl ?? nodeData.iconUrl}
            alt={nodeData.label}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: iconBg, padding: 4, flexShrink: 0,
              objectFit: "contain",
            }}
          />
        ) : (
          <div style={{
            width: 32, height: 32,
            background: iconBg,
            borderRadius: isPlayful ? 10 : 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            color: isCustom ? customCfg!.primaryColor : colors.border,
          }}>
            {IconComponent && <IconComponent size={16} strokeWidth={2} />}
          </div>
        )}

        {/* Label area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge */}
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: typeLabelColor,
            marginBottom: 2, lineHeight: 1,
          }}>
            {TYPE_LABELS[nodeData.type] ?? nodeData.type}
          </div>

          {/* Label */}
          {editing ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
                  borderBottom: `1px solid ${borderColor}`,
                  color: textColor,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  width: "100%",
                  outline: "none",
                  padding: "0 0 1px 0",
                }}
              />
              <button onClick={handleSave} style={{ color: "#22c55e", padding: 0, lineHeight: 1 }}><Check size={12} /></button>
              <button onClick={() => setEditing(false)} style={{ color: "#ef4444", padding: 0, lineHeight: 1 }}><X size={12} /></button>
            </div>
          ) : (
            <div
              onDoubleClick={() => { setEditing(true); setEditValue(nodeData.label); }}
              style={{
                fontSize: 12, fontWeight: 600, lineHeight: 1.3,
                wordBreak: "break-word",
                cursor: "text",
              }}
            >
              {nodeData.label}
            </div>
          )}

          {/* Description */}
          {nodeData.description && !editing && (
            <div style={{
              fontSize: 10, marginTop: 3, lineHeight: 1.3,
              color: isBlueprint ? "rgba(224,242,254,0.5)" : "rgba(0,0,0,0.4)",
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {nodeData.description}
            </div>
          )}
        </div>
      </div>

      {/* Edit hint on hover */}
      {!editing && (
        <div style={{
          position: "absolute", top: 4, right: 4,
          opacity: 0, transition: "opacity 0.15s",
          fontSize: 9, color: "rgba(0,0,0,0.3)",
        }} className="edit-hint">
          <Pencil size={9} />
        </div>
      )}
    </div>
  );
});

PraatplaatNode.displayName = "PraatplaatNode";

export default PraatplaatNode;
