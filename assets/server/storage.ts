import {
  diagrams, chatMessages,
  type Diagram, type InsertDiagram,
  type ChatMessage, type InsertChatMessage,
  type DiagramData,
  type CustomStyle
} from "@shared/schema";

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

class MemStorage implements IStorage {
  private diagrams = new Map<number, Diagram>();
  private chatMessages = new Map<number, ChatMessage>();
  private customStyles = new Map<string, CustomStyle>();
  private nextDiagramId = 1;
  private nextChatId = 1;

  constructor() {
    // Seed met ingebouwde presets
    this.customStyles.set(DIGIGO_PRESET.id, DIGIGO_PRESET);
    // Seed with een demo praatplaat
    const demo: Diagram = {
      id: 1,
      name: "Demo: Digitaal Loket",
      description: "Voorbeeld praatplaat voor een digitaal loket proces",
      style: "corporate",
      visibleTypes: ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
      visibleRelations: ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
      data: {
        elements: [
          { id: "e1", type: "actor", label: "Burger", position: { x: 80, y: 200 }, style: "corporate", description: "Eindgebruiker van het loket" },
          { id: "e2", type: "application", label: "Digitaal Loket", position: { x: 300, y: 200 }, style: "corporate", description: "Webportaal voor aanvragen" },
          { id: "e3", type: "process", label: "Aanvraag verwerken", position: { x: 520, y: 200 }, style: "corporate", description: "Backoffice verwerking" },
          { id: "e4", type: "system", label: "GBA Koppeling", position: { x: 520, y: 380 }, style: "corporate", description: "Basisregistratie Personen" },
          { id: "e5", type: "data", label: "Aanvraagdossier", position: { x: 300, y: 380 }, style: "corporate", description: "Opgeslagen aanvragen" },
          { id: "e6", type: "actor", label: "Behandelaar", position: { x: 740, y: 200 }, style: "corporate", description: "Gemeentelijk medewerker" },
        ],
        relations: [
          { id: "r1", sourceId: "e1", targetId: "e2", type: "uses", label: "dient in via" },
          { id: "r2", sourceId: "e2", targetId: "e3", type: "triggers", label: "start" },
          { id: "r3", sourceId: "e3", targetId: "e4", type: "uses", label: "raadpleegt" },
          { id: "r4", sourceId: "e2", targetId: "e5", type: "flows", label: "slaat op" },
          { id: "r5", sourceId: "e6", targetId: "e3", type: "assignment", label: "behandelt" },
        ]
      }
    };
    this.diagrams.set(1, demo);
    this.nextDiagramId = 2;
  }

  async getDiagrams(): Promise<Diagram[]> {
    return Array.from(this.diagrams.values());
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    return this.diagrams.get(id);
  }

  async createDiagram(data: InsertDiagram): Promise<Diagram> {
    const id = this.nextDiagramId++;
    const diagram: Diagram = {
      id,
      name: data.name,
      description: data.description ?? null,
      style: data.style ?? "corporate",
      data: data.data as DiagramData,
      visibleTypes: data.visibleTypes ?? ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
      visibleRelations: data.visibleRelations ?? ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
    };
    this.diagrams.set(id, diagram);
    return diagram;
  }

  async updateDiagram(id: number, data: Partial<InsertDiagram>): Promise<Diagram | undefined> {
    const existing = this.diagrams.get(id);
    if (!existing) return undefined;
    const updated: Diagram = { ...existing, ...data } as Diagram;
    this.diagrams.set(id, updated);
    return updated;
  }

  async deleteDiagram(id: number): Promise<boolean> {
    return this.diagrams.delete(id);
  }

  async getChatMessages(diagramId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(m => m.diagramId === diagramId);
  }

  async addChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const id = this.nextChatId++;
    const msg: ChatMessage = { id, ...data };
    this.chatMessages.set(id, msg);
    return msg;
  }

  async clearChatMessages(diagramId: number): Promise<void> {
    for (const [id, msg] of this.chatMessages.entries()) {
      if (msg.diagramId === diagramId) this.chatMessages.delete(id);
    }
  }

  // --- Custom stijlen ---
  async getCustomStyles(): Promise<CustomStyle[]> {
    return Array.from(this.customStyles.values());
  }

  async getCustomStyle(id: string): Promise<CustomStyle | undefined> {
    return this.customStyles.get(id);
  }

  async createCustomStyle(data: CustomStyle): Promise<CustomStyle> {
    this.customStyles.set(data.id, data);
    return data;
  }

  async updateCustomStyle(id: string, data: Partial<CustomStyle>): Promise<CustomStyle | undefined> {
    const existing = this.customStyles.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, id } as CustomStyle;
    this.customStyles.set(id, updated);
    return updated;
  }

  async deleteCustomStyle(id: string): Promise<boolean> {
    const existing = this.customStyles.get(id);
    if (existing?.isPreset) return false; // presets niet verwijderbaar
    return this.customStyles.delete(id);
  }
}

export const storage = new MemStorage();
