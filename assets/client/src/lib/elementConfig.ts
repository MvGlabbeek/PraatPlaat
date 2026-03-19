import type { ElementType, RelationType, VisualStyle } from "@shared/schema";

// ------- Element type definitions -------

export interface ElementConfig {
  type: ElementType;
  label: string;
  description: string;
  icon: string; // lucide icon name or emoji fallback
  color: string; // tailwind color class
  archimateType: string;
  bpmnType: string;
}

export const ELEMENT_TYPES: ElementConfig[] = [
  {
    type: "actor",
    label: "Actor",
    description: "Persoon, rol of organisatie",
    icon: "User",
    color: "blue",
    archimateType: "BusinessActor",
    bpmnType: "lane",
  },
  {
    type: "process",
    label: "Proces",
    description: "Activiteit of stap in een werkstroom",
    icon: "GitBranch",
    color: "green",
    archimateType: "BusinessProcess",
    bpmnType: "task",
  },
  {
    type: "application",
    label: "Applicatie",
    description: "Softwaresysteem of portaal",
    icon: "Monitor",
    color: "violet",
    archimateType: "ApplicationComponent",
    bpmnType: "serviceTask",
  },
  {
    type: "data",
    label: "Gegevens",
    description: "Informatie, dataset of document",
    icon: "Database",
    color: "amber",
    archimateType: "DataObject",
    bpmnType: "dataObject",
  },
  {
    type: "transaction",
    label: "Transactie",
    description: "Uitwisseling of overdracht",
    icon: "ArrowLeftRight",
    color: "teal",
    archimateType: "BusinessInteraction",
    bpmnType: "messageFlow",
  },
  {
    type: "system",
    label: "Systeem",
    description: "Extern systeem of koppeling",
    icon: "Server",
    color: "slate",
    archimateType: "TechnologyService",
    bpmnType: "callActivity",
  },
  {
    type: "event",
    label: "Gebeurtenis",
    description: "Trigger of aanleiding",
    icon: "Zap",
    color: "orange",
    archimateType: "BusinessEvent",
    bpmnType: "startEvent",
  },
  {
    type: "decision",
    label: "Beslissing",
    description: "Keuze of splitsing in het proces",
    icon: "Split",
    color: "rose",
    archimateType: "BusinessObject",
    bpmnType: "exclusiveGateway",
  },
  {
    type: "service",
    label: "Dienst",
    description: "Service of product aangeboden",
    icon: "Package",
    color: "cyan",
    archimateType: "BusinessService",
    bpmnType: "task",
  },
  {
    type: "infrastructure",
    label: "Infrastructuur",
    description: "Hardware, netwerk of platform",
    icon: "Network",
    color: "gray",
    archimateType: "Node",
    bpmnType: "callActivity",
  },
];

// ------- Relation type definitions -------

export interface RelationConfig {
  type: RelationType;
  label: string;
  description: string;
  animated: boolean;
  dashed: boolean;
  markerEnd: string;
}

export const RELATION_TYPES: RelationConfig[] = [
  { type: "uses", label: "Gebruikt", description: "Actief gebruik", animated: false, dashed: false, markerEnd: "arrow" },
  { type: "triggers", label: "Triggert", description: "Start of activeert", animated: true, dashed: false, markerEnd: "arrowclosed" },
  { type: "flows", label: "Stroomt naar", description: "Gegevensstroom", animated: true, dashed: true, markerEnd: "arrow" },
  { type: "association", label: "Geassocieerd", description: "Algemene relatie", animated: false, dashed: true, markerEnd: "none" },
  { type: "realization", label: "Realiseert", description: "Implementeert", animated: false, dashed: true, markerEnd: "arrowclosed" },
  { type: "composition", label: "Onderdeel van", description: "Compositie", animated: false, dashed: false, markerEnd: "arrowclosed" },
  { type: "aggregation", label: "Bevat", description: "Aggregatie", animated: false, dashed: false, markerEnd: "arrow" },
  { type: "assignment", label: "Toegewezen aan", description: "Toewijzing van rol", animated: false, dashed: false, markerEnd: "arrowclosed" },
  { type: "access", label: "Toegang tot", description: "Leest of schrijft", animated: true, dashed: true, markerEnd: "arrow" },
  { type: "influence", label: "Beïnvloedt", description: "Heeft invloed op", animated: false, dashed: true, markerEnd: "arrow" },
];

// ------- Visual styles -------

export interface StyleConfig {
  id: VisualStyle;
  name: string;
  description: string;
  emoji: string;
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  cornerRadius: number;
  shadow: boolean;
  fontFamily: string;
}

export const VISUAL_STYLES: StyleConfig[] = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Strak, zakelijk en professioneel",
    emoji: "🏢",
    nodeBg: "white",
    nodeBorder: "#cbd5e1",
    nodeText: "#1e293b",
    cornerRadius: 8,
    shadow: true,
    fontFamily: "'DM Sans', sans-serif",
  },
  {
    id: "playful",
    name: "Speels",
    description: "Kleurrijk en toegankelijk",
    emoji: "🎨",
    nodeBg: "#fefce8",
    nodeBorder: "#fde047",
    nodeText: "#1c1917",
    cornerRadius: 16,
    shadow: true,
    fontFamily: "'DM Sans', sans-serif",
  },
  {
    id: "minimal",
    name: "Minimaal",
    description: "Schoon en rustig",
    emoji: "◻️",
    nodeBg: "#f8fafc",
    nodeBorder: "#e2e8f0",
    nodeText: "#334155",
    cornerRadius: 4,
    shadow: false,
    fontFamily: "'Inter', sans-serif",
  },
  {
    id: "blueprint",
    name: "Blauwdruk",
    description: "Technisch, voor architecten",
    emoji: "📐",
    nodeBg: "#1e3a5f",
    nodeBorder: "#60a5fa",
    nodeText: "#e0f2fe",
    cornerRadius: 2,
    shadow: false,
    fontFamily: "'Inter', monospace",
  },
  {
    id: "sketch",
    name: "Schets",
    description: "Handgetekend gevoel",
    emoji: "✏️",
    nodeBg: "#fffbeb",
    nodeBorder: "#92400e",
    nodeText: "#292524",
    cornerRadius: 6,
    shadow: false,
    fontFamily: "'DM Sans', cursive",
  },
  {
    id: "whiteboard",
    name: "Whiteboard",
    description: "Handgetekende figuren op wit bord",
    emoji: "🖊️",
    nodeBg: "rgba(255,255,252,0.95)",
    nodeBorder: "#1a1a2e",
    nodeText: "#1a1a2e",
    cornerRadius: 0,
    shadow: false,
    fontFamily: "'Patrick Hand', 'Caveat', cursive",
  },
  {
    id: "stift",
    name: "Stift",
    description: "Kleurrijke dikke viltstift, workshop-stijl",
    emoji: "🖍️",
    nodeBg: "rgba(250,249,255,0.92)",
    nodeBorder: "#374151",
    nodeText: "#1a1a2e",
    cornerRadius: 0,
    shadow: false,
    fontFamily: "'Caveat', 'Patrick Hand', cursive",
  },
];

// ------- Color maps for element types -------

export const ELEMENT_COLORS: Record<string, { bg: string; border: string; text: string; dark_bg: string; icon_bg: string }> = {
  actor:          { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", dark_bg: "#1e3a5f", icon_bg: "#dbeafe" },
  process:        { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", dark_bg: "#14532d", icon_bg: "#dcfce7" },
  application:    { bg: "#f5f3ff", border: "#8b5cf6", text: "#6d28d9", dark_bg: "#3b1f8c", icon_bg: "#ede9fe" },
  data:           { bg: "#fffbeb", border: "#f59e0b", text: "#b45309", dark_bg: "#451a03", icon_bg: "#fef3c7" },
  transaction:    { bg: "#f0fdfa", border: "#14b8a6", text: "#0f766e", dark_bg: "#042f2e", icon_bg: "#ccfbf1" },
  system:         { bg: "#f8fafc", border: "#64748b", text: "#334155", dark_bg: "#0f172a", icon_bg: "#f1f5f9" },
  event:          { bg: "#fff7ed", border: "#f97316", text: "#c2410c", dark_bg: "#431407", icon_bg: "#ffedd5" },
  decision:       { bg: "#fff1f2", border: "#f43f5e", text: "#be123c", dark_bg: "#4c0519", icon_bg: "#ffe4e6" },
  service:        { bg: "#ecfeff", border: "#06b6d4", text: "#0e7490", dark_bg: "#083344", icon_bg: "#cffafe" },
  infrastructure: { bg: "#f9fafb", border: "#9ca3af", text: "#4b5563", dark_bg: "#111827", icon_bg: "#f3f4f6" },
};

export function getElementConfig(type: ElementType): ElementConfig {
  return ELEMENT_TYPES.find(e => e.type === type) ?? ELEMENT_TYPES[0];
}

export function getRelationConfig(type: RelationType): RelationConfig {
  return RELATION_TYPES.find(r => r.type === type) ?? RELATION_TYPES[0];
}

export function getStyleConfig(style: VisualStyle): StyleConfig {
  return VISUAL_STYLES.find(s => s.id === style) ?? VISUAL_STYLES[0];
}
