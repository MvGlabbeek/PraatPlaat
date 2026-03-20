import {
  diagrams, chatMessages,
  type Diagram, type InsertDiagram,
  type ChatMessage, type InsertChatMessage,
  type DiagramData,
  type CustomStyle
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

function deepClone(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Buffer) return obj.toString('utf-8');
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(deepClone);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepClone(value);
    }
    return result;
  }
  return obj;
}

export interface IStorage {
  // Diagrams
  getDiagrams(): Promise<Diagram[]>;
  getDiagram(id: number): Promise<Diagram | undefined>;
  createDiagram(data: InsertDiagram): Promise<Diagram>;
  updateDiagram(id: number, data: Partial<InsertDiagram>): Promise<Diagram | undefined>;
  deleteDiagram(id: number): Promise<boolean>;

  // Chat messages
  getChatMessages(diagramId: number): Promise<ChatMessage[]>;
  addChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(diagramId: number): Promise<void>;

  // Custom stijlen
  getCustomStyles(): Promise<CustomStyle[]>;
  getCustomStyle(id: string): Promise<CustomStyle | undefined>;
  createCustomStyle(data: CustomStyle): Promise<CustomStyle>;
  updateCustomStyle(id: string, data: Partial<CustomStyle>): Promise<CustomStyle | undefined>;
  deleteCustomStyle(id: string): Promise<boolean>;
}

// digiGO preset
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

class PostgresStorage implements IStorage {
  async getDiagrams(): Promise<Diagram[]> {
    const results = await db.select().from(diagrams);
    return deepClone(results);
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    const results = await db.select().from(diagrams).where(eq(diagrams.id, id));
    return deepClone(results[0]);
  }

  async createDiagram(data: InsertDiagram): Promise<Diagram> {
    const results = await db.insert(diagrams).values(data).returning();
    return deepClone(results[0]);
  }

  async updateDiagram(id: number, data: Partial<InsertDiagram>): Promise<Diagram | undefined> {
    const results = await db
      .update(diagrams)
      .set({ ...data, updated_at: sql`now()` })
      .where(eq(diagrams.id, id))
      .returning();
    return deepClone(results[0]);
  }

  async deleteDiagram(id: number): Promise<boolean> {
    const results = await db.delete(diagrams).where(eq(diagrams.id, id)).returning();
    return results.length > 0;
  }

  async getChatMessages(diagramId: number): Promise<ChatMessage[]> {
    const results = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.diagramId, diagramId));
    return deepClone(results);
  }

  async addChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const results = await db.insert(chatMessages).values(data).returning();
    return deepClone(results[0]);
  }

  async clearChatMessages(diagramId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.diagramId, diagramId));
  }

  async getCustomStyles(): Promise<CustomStyle[]> {
    const results: any = await db.execute(sql`SELECT * FROM custom_styles`);
    return deepClone(results.rows || []);
  }

  async getCustomStyle(id: string): Promise<CustomStyle | undefined> {
    const results: any = await db.execute(
      sql`SELECT * FROM custom_styles WHERE id = ${id}`
    );
    return deepClone(results.rows?.[0]);
  }

  async createCustomStyle(data: CustomStyle): Promise<CustomStyle> {
    await db.execute(
      sql`INSERT INTO custom_styles (id, name, org_name, primary_color, accent_color, bg_color, text_color, border_color, font_family, element_icons, is_preset)
          VALUES (${data.id}, ${data.name}, ${data.orgName}, ${data.primaryColor}, ${data.accentColor}, ${data.bgColor}, ${data.textColor}, ${data.borderColor}, ${data.fontFamily}, ${JSON.stringify(data.elementIcons)}, ${data.isPreset ?? false})`
    );
    return data;
  }

  async updateCustomStyle(id: string, data: Partial<CustomStyle>): Promise<CustomStyle | undefined> {
    const existing = await this.getCustomStyle(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...data, id };
    await db.execute(
      sql`UPDATE custom_styles
          SET name = ${updated.name},
              org_name = ${updated.orgName},
              primary_color = ${updated.primaryColor},
              accent_color = ${updated.accentColor},
              bg_color = ${updated.bgColor},
              text_color = ${updated.textColor},
              border_color = ${updated.borderColor},
              font_family = ${updated.fontFamily},
              element_icons = ${JSON.stringify(updated.elementIcons)},
              is_preset = ${updated.isPreset ?? false}
          WHERE id = ${id}`
    );
    return updated;
  }

  async deleteCustomStyle(id: string): Promise<boolean> {
    const existing = await this.getCustomStyle(id);
    if (!existing || existing.isPreset) return false;

    await db.execute(sql`DELETE FROM custom_styles WHERE id = ${id}`);
    return true;
  }
}

export const storage = new PostgresStorage();

// Initialize database with default data if empty
export async function initializeDatabase() {
  try {
    const diagrams = await storage.getDiagrams();

    // Seed default diagram if none exists
    if (diagrams.length === 0) {
      await storage.createDiagram({
        name: "🎨 Welkom bij Praatplaat Studio!",
        description: "Interactieve demo - Probeer elementen toe te voegen, relaties te tekenen en stijlen te wijzigen. Klik op Assistent voor natuurlijke taal commando's!",
        style: "corporate",
        data: {
          elements: [
            {
              id: "e1",
              type: "actor",
              label: "Burger",
              style: "corporate",
              position: { x: 100, y: 150 },
              description: "Eindgebruiker die een aanvraag indient"
            },
            {
              id: "e2",
              type: "application",
              label: "Digitaal Loket",
              style: "corporate",
              position: { x: 350, y: 150 },
              description: "Online portaal voor burgers"
            },
            {
              id: "e3",
              type: "process",
              label: "Aanvraag verwerken",
              style: "corporate",
              position: { x: 600, y: 150 },
              description: "Behandel en beoordeel aanvraag"
            },
            {
              id: "e4",
              type: "actor",
              label: "Behandelaar",
              style: "corporate",
              position: { x: 850, y: 150 },
              description: "Gemeentelijk medewerker"
            },
            {
              id: "e5",
              type: "data",
              label: "Aanvraagdossier",
              style: "corporate",
              position: { x: 350, y: 350 },
              description: "Opgeslagen aanvraaggegevens"
            },
            {
              id: "e6",
              type: "system",
              label: "GBA Koppeling",
              style: "corporate",
              position: { x: 600, y: 350 },
              description: "Basisregistratie Personen verificatie"
            },
            {
              id: "e7",
              type: "service",
              label: "Notificatiedienst",
              style: "corporate",
              position: { x: 100, y: 350 },
              description: "Verstuur berichten naar burger"
            },
            {
              id: "e8",
              type: "decision",
              label: "Goedkeuren?",
              style: "corporate",
              position: { x: 850, y: 350 },
              description: "Beslispunt: wel/niet goedkeuren"
            }
          ],
          relations: [
            {
              id: "r1",
              type: "uses",
              label: "dient in via",
              sourceId: "e1",
              targetId: "e2"
            },
            {
              id: "r2",
              type: "triggers",
              label: "start",
              sourceId: "e2",
              targetId: "e3"
            },
            {
              id: "r3",
              type: "assignment",
              label: "behandelt",
              sourceId: "e4",
              targetId: "e3"
            },
            {
              id: "r4",
              type: "flows",
              label: "slaat op in",
              sourceId: "e2",
              targetId: "e5"
            },
            {
              id: "r5",
              type: "uses",
              label: "raadpleegt",
              sourceId: "e3",
              targetId: "e6"
            },
            {
              id: "r6",
              type: "flows",
              label: "leidt tot",
              sourceId: "e3",
              targetId: "e8"
            },
            {
              id: "r7",
              type: "triggers",
              label: "verstuurt via",
              sourceId: "e8",
              targetId: "e7"
            },
            {
              id: "r8",
              type: "flows",
              label: "ontvangt van",
              sourceId: "e7",
              targetId: "e1"
            }
          ]
        },
        visibleTypes: ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
        visibleRelations: ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
      });
      console.log("✓ Demo praatplaat seeded");
    }

    // Seed digiGO preset if it doesn't exist
    const existingStyle = await storage.getCustomStyle("digigo");
    if (!existingStyle) {
      await storage.createCustomStyle(DIGIGO_PRESET);
      console.log("✓ digiGO preset seeded");
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}
