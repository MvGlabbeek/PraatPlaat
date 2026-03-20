import { supabase } from "./db";
import type {
  Diagram,
  InsertDiagram,
  ChatMessage,
  InsertChatMessage,
  DiagramData,
  CustomStyle,
} from "@shared/schema";

export interface IStorage {
  getDiagrams(): Promise<Diagram[]>;
  getDiagram(id: number): Promise<Diagram | undefined>;
  createDiagram(data: InsertDiagram): Promise<Diagram>;
  updateDiagram(id: number, data: Partial<InsertDiagram>): Promise<Diagram | undefined>;
  deleteDiagram(id: number): Promise<boolean>;
  getChatMessages(diagramId: number): Promise<ChatMessage[]>;
  addChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(diagramId: number): Promise<void>;
  getCustomStyles(): Promise<CustomStyle[]>;
  getCustomStyle(id: string): Promise<CustomStyle | undefined>;
  createCustomStyle(data: CustomStyle): Promise<CustomStyle>;
  updateCustomStyle(id: string, data: Partial<CustomStyle>): Promise<CustomStyle | undefined>;
  deleteCustomStyle(id: string): Promise<boolean>;
}

function rowToDiagram(row: any): Diagram {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    style: row.style ?? "corporate",
    data: row.data ?? { elements: [], relations: [] },
    visibleTypes: row.visible_types ?? [
      "actor","process","application","data","transaction","system",
      "event","decision","service","infrastructure",
    ],
    visibleRelations: row.visible_relations ?? [
      "uses","triggers","flows","association","realization","composition",
      "aggregation","assignment","access","influence",
    ],
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

const DIGIGO_PRESET: CustomStyle = {
  id: "digigo",
  name: "digiGO",
  orgName: "digiGO",
  primaryColor: "#000000",
  accentColor: "#ffe103",
  bgColor: "#ffffff",
  textColor: "#111111",
  borderColor: "#000000",
  fontFamily: "'Inter', 'DM Sans', sans-serif",
  elementIcons: {},
  isPreset: true,
};

const DEMO_DIAGRAM: InsertDiagram = {
  name: "Demo: Digitaal Loket",
  description: "Voorbeeldpraatplaat – klik elementen aan, versleep ze, teken relaties, wissel van stijl. Gebruik de Assistent rechts voor opdrachten in gewone taal.",
  style: "corporate",
  visibleTypes: ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
  visibleRelations: ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
  data: {
    elements: [
      { id: "e1", type: "actor", label: "Burger", style: "corporate", position: { x: 100, y: 140 }, description: "Eindgebruiker die een aanvraag indient" },
      { id: "e2", type: "application", label: "Digitaal Loket", style: "corporate", position: { x: 360, y: 140 }, description: "Online portaal voor burgers" },
      { id: "e3", type: "process", label: "Aanvraag verwerken", style: "corporate", position: { x: 620, y: 140 }, description: "Behandel en beoordeel de aanvraag" },
      { id: "e4", type: "actor", label: "Behandelaar", style: "corporate", position: { x: 880, y: 140 }, description: "Gemeentelijk medewerker" },
      { id: "e5", type: "data", label: "Aanvraagdossier", style: "corporate", position: { x: 360, y: 360 }, description: "Opgeslagen aanvraaggegevens" },
      { id: "e6", type: "system", label: "GBA Koppeling", style: "corporate", position: { x: 620, y: 360 }, description: "Basisregistratie Personen" },
      { id: "e7", type: "service", label: "Notificatiedienst", style: "corporate", position: { x: 100, y: 360 }, description: "Verstuurt berichten naar burger" },
      { id: "e8", type: "decision", label: "Goedkeuren?", style: "corporate", position: { x: 880, y: 360 }, description: "Beslispunt: goedkeuren of afwijzen" },
    ],
    relations: [
      { id: "r1", type: "uses", label: "dient in via", sourceId: "e1", targetId: "e2" },
      { id: "r2", type: "triggers", label: "start", sourceId: "e2", targetId: "e3" },
      { id: "r3", type: "assignment", label: "behandelt", sourceId: "e4", targetId: "e3" },
      { id: "r4", type: "flows", label: "slaat op in", sourceId: "e2", targetId: "e5" },
      { id: "r5", type: "uses", label: "raadpleegt", sourceId: "e3", targetId: "e6" },
      { id: "r6", type: "flows", label: "leidt tot", sourceId: "e3", targetId: "e8" },
      { id: "r7", type: "triggers", label: "verstuurt via", sourceId: "e8", targetId: "e7" },
      { id: "r8", type: "flows", label: "ontvangt bericht", sourceId: "e7", targetId: "e1" },
    ],
  },
};

class SupabaseStorage implements IStorage {
  async getDiagrams(): Promise<Diagram[]> {
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToDiagram);
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToDiagram(data) : undefined;
  }

  async createDiagram(input: InsertDiagram): Promise<Diagram> {
    const DEFAULT_TYPES = ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"];
    const DEFAULT_RELS = ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"];
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

  async updateDiagram(id: number, input: Partial<InsertDiagram>): Promise<Diagram | undefined> {
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
      .maybeSingle();
    if (error) throw error;
    return data ? rowToDiagram(data) : undefined;
  }

  async deleteDiagram(id: number): Promise<boolean> {
    const { error, count } = await supabase
      .from("diagrams")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async getChatMessages(diagramId: number): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("diagram_id", diagramId)
      .order("id", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToChatMessage);
  }

  async addChatMessage(input: InsertChatMessage): Promise<ChatMessage> {
    const payload = {
      diagram_id: input.diagramId,
      role: input.role,
      content: input.content,
      timestamp: input.timestamp,
    };
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return rowToChatMessage(data);
  }

  async clearChatMessages(diagramId: number): Promise<void> {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("diagram_id", diagramId);
    if (error) throw error;
  }

  async getCustomStyles(): Promise<CustomStyle[]> {
    const { data, error } = await supabase
      .from("custom_styles")
      .select("*")
      .order("id");
    if (error) throw error;
    return (data ?? []).map(rowToStyle);
  }

  async getCustomStyle(id: string): Promise<CustomStyle | undefined> {
    const { data, error } = await supabase
      .from("custom_styles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToStyle(data) : undefined;
  }

  async createCustomStyle(s: CustomStyle): Promise<CustomStyle> {
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

  async updateCustomStyle(id: string, updates: Partial<CustomStyle>): Promise<CustomStyle | undefined> {
    const existing = await this.getCustomStyle(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...updates, id };
    await this.createCustomStyle(merged);
    return merged;
  }

  async deleteCustomStyle(id: string): Promise<boolean> {
    const existing = await this.getCustomStyle(id);
    if (!existing || existing.isPreset) return false;
    const { error } = await supabase.from("custom_styles").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
}

export const storage = new SupabaseStorage();

export async function initializeDatabase() {
  try {
    const diagrams = await storage.getDiagrams();
    if (diagrams.length === 0) {
      await storage.createDiagram(DEMO_DIAGRAM);
      console.log("✓ Demo praatplaat aangemaakt");
    }
    const existing = await storage.getCustomStyle("digigo");
    if (!existing) {
      await storage.createCustomStyle(DIGIGO_PRESET);
      console.log("✓ digiGO stijl aangemaakt");
    }
  } catch (error) {
    console.error("Database initialisatiefout:", error);
  }
}
