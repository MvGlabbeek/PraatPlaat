import { supabase } from "./supabase";
import type {
  Diagram,
  InsertDiagram,
  ChatMessage,
  CustomStyle,
  DiagramData,
} from "@shared/schema";

const DEFAULT_TYPES = [
  "actor","process","application","data","transaction","system",
  "event","decision","service","infrastructure",
];
const DEFAULT_RELS = [
  "uses","triggers","flows","association","realization","composition",
  "aggregation","assignment","access","influence",
];

function rowToDiagram(row: any): Diagram {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    style: row.style ?? "corporate",
    data: row.data ?? { elements: [], relations: [] },
    visibleTypes: row.visible_types ?? DEFAULT_TYPES,
    visibleRelations: row.visible_relations ?? DEFAULT_RELS,
    created_at: row.created_at ? new Date(row.created_at) : null,
    updated_at: row.updated_at ? new Date(row.updated_at) : null,
  };
}

function rowToStyle(row: any): CustomStyle {
  return {
    id: row.id,
    name: row.name,
    orgName: row.org_name,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    bgColor: row.bg_color,
    textColor: row.text_color,
    borderColor: row.border_color,
    fontFamily: row.font_family,
    elementIcons: row.element_icons ?? {},
    isPreset: row.is_preset ?? false,
  };
}

function rowToChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    diagramId: row.diagram_id,
    role: row.role,
    content: row.content,
    timestamp: Number(row.timestamp),
  };
}

export async function getDiagrams(): Promise<Diagram[]> {
  const { data, error } = await supabase
    .from("diagrams")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToDiagram);
}

export async function getDiagram(id: number): Promise<Diagram | null> {
  const { data, error } = await supabase
    .from("diagrams")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDiagram(data) : null;
}

export async function createDiagram(input: InsertDiagram): Promise<Diagram> {
  const payload: any = {
    name: input.name,
    description: input.description ?? null,
    style: input.style ?? "corporate",
    data: input.data,
    visible_types: input.visibleTypes ?? DEFAULT_TYPES,
    visible_relations: input.visibleRelations ?? DEFAULT_RELS,
  };
  const { data, error } = await supabase
    .from("diagrams")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return rowToDiagram(data);
}

export async function updateDiagram(
  id: number,
  input: Partial<InsertDiagram>,
): Promise<Diagram> {
  const payload: any = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.style !== undefined) payload.style = input.style;
  if (input.data !== undefined) payload.data = input.data;
  if (input.visibleTypes !== undefined) payload.visible_types = input.visibleTypes;
  if (input.visibleRelations !== undefined) payload.visible_relations = input.visibleRelations;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("diagrams")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToDiagram(data);
}

export async function deleteDiagram(id: number): Promise<void> {
  const { error } = await supabase.from("diagrams").delete().eq("id", id);
  if (error) throw error;
}

export async function getChatMessages(diagramId: number): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("diagram_id", diagramId)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToChatMessage);
}

export async function addChatMessage(
  diagramId: number,
  role: string,
  content: string,
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      diagram_id: diagramId,
      role,
      content,
      timestamp: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;
  return rowToChatMessage(data);
}

export async function getCustomStyles(): Promise<CustomStyle[]> {
  const { data, error } = await supabase
    .from("custom_styles")
    .select("*")
    .order("id");
  if (error) throw error;
  return (data ?? []).map(rowToStyle);
}

export async function getCustomStyle(id: string): Promise<CustomStyle | null> {
  const { data, error } = await supabase
    .from("custom_styles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToStyle(data) : null;
}

export async function upsertCustomStyle(s: CustomStyle): Promise<CustomStyle> {
  const payload = {
    id: s.id,
    name: s.name,
    org_name: s.orgName,
    primary_color: s.primaryColor,
    accent_color: s.accentColor,
    bg_color: s.bgColor,
    text_color: s.textColor,
    border_color: s.borderColor,
    font_family: s.fontFamily,
    element_icons: s.elementIcons ?? {},
    is_preset: s.isPreset ?? false,
  };
  const { error } = await supabase.from("custom_styles").upsert(payload);
  if (error) throw error;
  return s;
}

export async function deleteCustomStyle(id: string): Promise<void> {
  const { error } = await supabase.from("custom_styles").delete().eq("id", id);
  if (error) throw error;
}
