import { z } from "zod";

// --- Enums & Types ---

export type ElementType =
  | "actor"
  | "process"
  | "application"
  | "data"
  | "transaction"
  | "system"
  | "event"
  | "decision"
  | "service"
  | "infrastructure";

export type RelationType =
  | "uses"
  | "triggers"
  | "flows"
  | "association"
  | "realization"
  | "composition"
  | "aggregation"
  | "assignment"
  | "access"
  | "influence";

export type VisualStyle =
  | "corporate"
  | "playful"
  | "minimal"
  | "blueprint"
  | "sketch"
  | "whiteboard"
  | "stift"
  | string;

// --- Custom stijlen ---

export interface CustomStyle {
  id: string;
  name: string;
  orgName: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: string;
  elementIcons: Partial<Record<string, string>>;
  isPreset?: boolean;
}

export interface ElementPosition {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  label: string;
  description?: string;
  position: ElementPosition;
  style: VisualStyle;
  iconUrl?: string;
  color?: string;
  width?: number;
  height?: number;
  archimateType?: string;
  bpmnType?: string;
}

export interface CanvasRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  label?: string;
  animated?: boolean;
}

export interface DiagramData {
  elements: CanvasElement[];
  relations: CanvasRelation[];
  viewport?: { x: number; y: number; zoom: number };
}

// --- Plain TS interfaces (no Drizzle dependency) ---

export interface Diagram {
  id: number;
  name: string;
  description: string | null;
  style: string;
  data: DiagramData;
  visibleTypes: string[];
  visibleRelations: string[];
  created_at: Date | null;
  updated_at: Date | null;
}

export interface InsertDiagram {
  name: string;
  description?: string | null;
  style?: string;
  data: DiagramData;
  visibleTypes?: string[];
  visibleRelations?: string[];
}

export interface ChatMessage {
  id: number;
  diagramId: number;
  role: string;
  content: string;
  timestamp: number;
}

export interface InsertChatMessage {
  diagramId: number;
  role: string;
  content: string;
  timestamp: number;
}

// --- Zod Schemas ---

export const insertDiagramSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  style: z.string().optional(),
  data: z.object({
    elements: z.array(z.any()),
    relations: z.array(z.any()),
    viewport: z.any().optional(),
  }),
  visibleTypes: z.array(z.string()).optional(),
  visibleRelations: z.array(z.string()).optional(),
});

export const insertChatMessageSchema = z.object({
  diagramId: z.number(),
  role: z.string(),
  content: z.string(),
  timestamp: z.number(),
});

export const customStyleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  orgName: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  fontFamily: z.string().min(1),
  elementIcons: z.record(z.string()).optional().default({}),
  isPreset: z.boolean().optional().default(false),
});
