import { pgTable, text, integer, jsonb, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export type VisualStyle = "corporate" | "playful" | "minimal" | "blueprint" | "sketch" | "whiteboard" | "stift" | string; // string: ook custom stijl-id's

// --- Custom stijlen (huisstijl van een organisatie) ---

export interface CustomStyle {
  id: string;           // uniek id, bijv. "digigo" of uuid
  name: string;         // weergavenaam, bijv. "digiGO"
  orgName: string;      // naam van de organisatie
  primaryColor: string; // hoofdkleur (bijv. #000000)
  accentColor: string;  // accentkleur (bijv. #ffe103)
  bgColor: string;      // achtergrondkleur van nodes
  textColor: string;    // tekstkleur
  borderColor: string;  // randkleur van nodes
  fontFamily: string;   // lettertype (bijv. "Inter, sans-serif")
  // Per elementtype: base64-encoded SVG-string (data-URL) of lege string
  elementIcons: Partial<Record<string, string>>;
  isPreset?: boolean;   // true = ingebouwde preset, niet verwijderbaar
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
  archimateType?: string; // voor formele export
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

// --- Database Tables ---

export const diagrams = pgTable("diagrams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  style: text("style").notNull().default("corporate"),
  data: jsonb("data").notNull().$type<DiagramData>(),
  visibleTypes: text("visible_types").array().notNull().default([
    "actor","process","application","data","transaction","system","event","decision","service","infrastructure"
  ]),
  visibleRelations: text("visible_relations").array().notNull().default([
    "uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"
  ]),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  diagramId: integer("diagram_id").notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: integer("timestamp").notNull(),
});

// --- Zod Schemas ---

export const insertDiagramSchema = createInsertSchema(diagrams).omit({ id: true });
export type InsertDiagram = z.infer<typeof insertDiagramSchema>;
export type Diagram = typeof diagrams.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

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
