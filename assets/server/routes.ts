import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema, insertChatMessageSchema, customStyleSchema } from "@shared/schema";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Simple chatbot: parse natural language commands and return diagram operations
function processChatCommand(
  message: string,
  currentData: { elements: any[]; relations: any[] }
): { reply: string; operations?: any[] } {
  const msg = message.toLowerCase();
  const ops: any[] = [];

  // Detect element additions
  const actorMatch = msg.match(/voeg\s+(?:een\s+)?actor\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?actor\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+actor\s+['"]?([^'"]+?)['"]?/i);
  const processMatch = msg.match(/voeg\s+(?:een\s+)?proces\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?proces\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+process\s+['"]?([^'"]+?)['"]?/i);
  const appMatch = msg.match(/voeg\s+(?:een\s+)?applicatie\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?applicatie\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+application\s+['"]?([^'"]+?)['"]?/i);
  const dataMatch = msg.match(/voeg\s+(?:een?\s+)?(?:data|gegeven)\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een?\s+)?(?:data|gegeven)\s+['"]?([^'"]+?)['"]?/i);
  const systemMatch = msg.match(/voeg\s+(?:een\s+)?systeem\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?systeem\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+system\s+['"]?([^'"]+?)['"]?/i);

  // Delete element
  const deleteMatch = msg.match(/verwijder\s+['"]?([^'"]+?)['"]?(?:\s+van\s+de\s+praatplaat)?$/i) ||
    msg.match(/delete\s+['"]?([^'"]+?)['"]?/i);

  // Relation: "verbind X met Y"
  const connectMatch = msg.match(/verbind\s+['"]?([^'"]+?)['"]?\s+met\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/connect\s+['"]?([^'"]+?)['"]?\s+(?:to|with)\s+['"]?([^'"]+?)['"]?/i);

  // Clear all
  const clearMatch = msg.match(/leeg\s+de\s+praatplaat|verwijder\s+alles|wis\s+alles|clear\s+all/i);

  if (clearMatch) {
    ops.push({ type: "CLEAR_ALL" });
    return { reply: "Ik heb de praatplaat leeggemaakt.", operations: ops };
  }

  if (deleteMatch) {
    const label = deleteMatch[1].trim();
    const found = currentData.elements.find(e =>
      e.label.toLowerCase() === label.toLowerCase()
    );
    if (found) {
      ops.push({ type: "DELETE_ELEMENT", id: found.id });
      return { reply: `Ik heb "${found.label}" verwijderd van de praatplaat.`, operations: ops };
    }
    return { reply: `Ik kon "${label}" niet vinden op de praatplaat. Controleer de naam.` };
  }

  if (connectMatch) {
    const fromLabel = connectMatch[1].trim();
    const toLabel = connectMatch[2].trim();
    const from = currentData.elements.find(e => e.label.toLowerCase().includes(fromLabel.toLowerCase()));
    const to = currentData.elements.find(e => e.label.toLowerCase().includes(toLabel.toLowerCase()));
    if (from && to) {
      ops.push({
        type: "ADD_RELATION",
        relation: {
          id: `r_${Date.now()}`,
          sourceId: from.id,
          targetId: to.id,
          type: "association",
          label: ""
        }
      });
      return {
        reply: `Ik heb een relatie aangelegd tussen "${from.label}" en "${to.label}".`,
        operations: ops
      };
    }
    return {
      reply: `Ik kon de opgegeven elementen niet vinden. Zijn "${fromLabel}" en "${toLabel}" al op de praatplaat?`
    };
  }

  let matched = false;
  const typeMap: Record<string, string> = {
    actor: actorMatch?.[1] ?? "",
    process: processMatch?.[1] ?? "",
    application: appMatch?.[1] ?? "",
    data: dataMatch?.[1] ?? "",
    system: systemMatch?.[1] ?? "",
  };

  for (const [elemType, label] of Object.entries(typeMap)) {
    if (label) {
      const existingCount = currentData.elements.filter(e => e.type === elemType).length;
      const col = Math.floor(existingCount % 4);
      const row = Math.floor(existingCount / 4);
      ops.push({
        type: "ADD_ELEMENT",
        element: {
          id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: elemType,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          position: { x: 80 + col * 220, y: 80 + row * 200 },
          style: "corporate",
          description: ""
        }
      });
      matched = true;
    }
  }

  if (matched) {
    const addedLabels = ops.map(o => `"${o.element?.label}"`).join(", ");
    return {
      reply: `Ik heb ${addedLabels} toegevoegd aan de praatplaat.`,
      operations: ops
    };
  }

  // Fallback: helpful suggestions
  return {
    reply: `Ik begreep je opdracht niet helemaal. Probeer bijvoorbeeld:\n• "Voeg een actor 'Klant' toe"\n• "Maak een applicatie 'CRM Systeem'"\n• "Voeg een proces 'Facturering' toe"\n• "Verbind 'Klant' met 'Digitaal Loket'"\n• "Verwijder 'Behandelaar'"\n• "Leeg de praatplaat"`
  };
}

// ─────────────────────────────────────────────────────────
// Tekst → Praatplaat analyser
// ─────────────────────────────────────────────────────────

interface AnalysisElement {
  id: string;
  type: string;
  label: string;
  description?: string;
  position: { x: number; y: number };
  style: string;
}

interface AnalysisRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRAATPLAAT ONTOLOGIE — gebruikt als context voor de LLM-analyse
// ─────────────────────────────────────────────────────────────────────────────
const PRAATPLAAT_ONTOLOGY = `
Jij bent een expert ontologie-analist die tekst omzet naar praatplaat-elementen en -relaties.
Een praatplaat is een visueel communicatiediagram voor gesprekken met domeinexperts, managers
en bestuurders die geen kennis hebben van formele notaties (ArchiMate, BPMN, UML).

## ELEMENTTYPES (kies de meest passende)

| type          | wanneer gebruiken | voorbeelden |
|---------------|-------------------|-------------|
| actor         | persoon, functie, rol, organisatie, afdeling, team, partij die iets doet of verantwoordelijk is | medewerker, klant, directeur, gemeente, leverancier, team, afdeling, burger, verantwoordelijke, uitvoerder, opdrachtnemer |
| process       | activiteit, taak, stap, handeling, werkproces, procedure die wordt uitgevoerd | aanvragen, beoordelen, verwerken, publiceren, factureren, controleren, goedkeuren, registreren, analyseren |
| application   | software, systeem, platform, tool, database, koppeling, digitale dienst | CRM-systeem, portaal, app, register, API, database, softwaremodule, platform, website |
| data          | document, bestand, formulier, dossier, bericht, rapport, besluit, aanvraag, informatie die wordt uitgewisseld of opgeslagen | aanvraagformulier, factuur, besluit, dossier, rapport, contract, bericht, email, notitie |
| service       | dienst, product, service, levering die iemand ontvangt of aanbiedt | vergunningsdienst, betaaldienst, adviesdienst, product, voorziening, abonnement |
| event         | trigger, gebeurtenis, moment, melding, signaal dat iets in gang zet | ontvangst aanvraag, deadline, melding, alarm, deadline |
| decision      | beslissing, keuze, goedkeuring, afkeuring, oordeel, beoordeling op een kruispunt | goedkeuring, afwijzing, keuze, beoordeling, controle |
| infrastructure| fysieke locatie, gebouw, netwerk, hardware, server, kantoor | datacenter, kantoor, netwerk, server, locatie, pand |
| system        | abstract systeem, domein, landschap, zoneoverkoepelend concept dat niet in bovenstaande valt | landschap, domein, omgeving, context |

## RELATIETYPES (kies de meest passende)

| type          | semantiek | voorbeelden |
|---------------|-----------|-------------|
| uses          | actor/process gebruikt een applicatie, dienst of data | de medewerker gebruikt het CRM-systeem |
| triggers      | iets activeert, start, veroorzaakt iets anders | de aanvraag triggert het beoordelingsproces |
| flows         | informatie, data of product stroomt van A naar B | het dossier stroomt van behandelaar naar archief |
| association   | algemene relatie, samenwerking, betrokkenheid | de afdeling werkt samen met de leverancier |
| realization   | iets concretiseert, implementeert of maakt iets mogelijk | het systeem realiseert de dienst |
| composition   | iets is een onderdeel van een groter geheel | het proces is onderdeel van de workflow |
| aggregation   | losse verzameling van onderdelen | de afdeling groepeert meerdere teams |
| assignment    | actor is verantwoordelijk voor, belast met, eigenaar van | de manager is verantwoordelijk voor het proces |
| access        | lees- of schrijftoegang tot data of een systeem | de applicatie heeft toegang tot de database |
| influence     | beïnvloedt, stuurt, reguleert, controleert | beleid beïnvloedt het werkproces |

## VUISTREGELS
- Gebruik alleen elementen die echt in de tekst staan of er duidelijk uit volgen.
- Wees precies in labels: gebruik de exacte naam of omschrijving uit de tekst, of een beknopte parafrase.
- Geef beschrijvingen alleen mee als er extra context in de tekst staat.
- Maak geen relaties aan tussen elementen die niet direct aan elkaar gerelateerd zijn in de tekst.
- Prioriteit: kwaliteit boven kwantiteit. Liever 5 goede elementen dan 15 vage.
- Detecteer ook impliciete actoren en processen ("de aanvraag wordt beoordeeld" → er is een beoordelaar en een beoordelingsproces).
- Nederlandstalige en Engelstalige tekst zijn beide toegestaan.
`;

// ─────────────────────────────────────────────────────────────────────────────
// LLM-gebaseerde tekst-analyse (Claude via Anthropic SDK)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeTextWithLLM(text: string): Promise<{
  elements: AnalysisElement[];
  relations: AnalysisRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
}> {
  const client = new Anthropic();

  const prompt = `${PRAATPLAAT_ONTOLOGY}

## TAAK
Analyseer de onderstaande tekst en extraheer alle relevante elementen en relaties voor een praatplaat.

Geef je antwoord UITSLUITEND als valide JSON in dit exacte formaat:
{
  "elements": [
    {
      "label": "korte naam van het element (max 4 woorden)",
      "type": "een van: actor | process | application | data | service | event | decision | infrastructure | system",
      "description": "optionele toelichting vanuit de tekst, of leeg"
    }
  ],
  "relations": [
    {
      "from": "label van het bronelement (exact zoals in elements)",
      "to": "label van het doelelement (exact zoals in elements)",
      "type": "een van: uses | triggers | flows | association | realization | composition | aggregation | assignment | access | influence",
      "label": "optioneel: kort werkwoord of relatiebeschrijving"
    }
  ],
  "summary": "Nederlandse samenvatting van wat je hebt gevonden en waarom je die keuzes hebt gemaakt",
  "confidence": "hoog of gemiddeld of laag"
}

TEKST OM TE ANALYSEREN:
---
${text}
---

JSON antwoord:`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const rawContent = message.content[0].type === "text" ? message.content[0].text : "";

  // Extraheer JSON uit het antwoord (ook als er extra tekst omheen staat)
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Geen geldig JSON gevonden in LLM-antwoord");

  const parsed = JSON.parse(jsonMatch[0]);

  // Zet de LLM-output om naar het interne AnalysisElement/AnalysisRelation formaat
  const elements: AnalysisElement[] = [];
  const labelToId = new Map<string, string>();
  let elIdx = 0;
  const gridPos = (i: number) => ({ x: 80 + (i % 4) * 230, y: 80 + Math.floor(i / 4) * 180 });

  const validTypes = new Set(["actor","process","application","data","service","event","decision","infrastructure","system"]);
  const validRelTypes = new Set(["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"]);

  for (const el of (parsed.elements ?? [])) {
    if (!el.label || typeof el.label !== "string") continue;
    const label = el.label.trim();
    if (!label || labelToId.has(label.toLowerCase())) continue;
    const id = `txt_${Date.now()}_${Math.random().toString(36).slice(2,6)}_${elIdx++}`;
    labelToId.set(label.toLowerCase(), id);
    elements.push({
      id,
      type: validTypes.has(el.type) ? el.type : "system",
      label,
      description: el.description || undefined,
      position: gridPos(elements.length),
      style: "corporate",
    });
  }

  const relations: AnalysisRelation[] = [];
  const seenRels = new Set<string>();
  for (const rel of (parsed.relations ?? [])) {
    if (!rel.from || !rel.to) continue;
    const fromId = labelToId.get(rel.from.toLowerCase().trim());
    const toId = labelToId.get(rel.to.toLowerCase().trim());
    if (!fromId || !toId || fromId === toId) continue;
    const key = `${fromId}->${toId}`;
    if (seenRels.has(key)) continue;
    seenRels.add(key);
    relations.push({
      id: `rel_${Date.now()}_${relations.length}`,
      sourceId: fromId,
      targetId: toId,
      type: validRelTypes.has(rel.type) ? rel.type : "association",
      label: rel.label || undefined,
    });
  }

  const confidence: "hoog" | "gemiddeld" | "laag" =
    parsed.confidence === "hoog" ? "hoog" :
    parsed.confidence === "gemiddeld" ? "gemiddeld" : "laag";

  return {
    elements,
    relations,
    summary: parsed.summary ?? `${elements.length} elementen en ${relations.length} relaties gevonden.`,
    confidence,
  };
}

// Fallback: eenvoudige regex-NLP als de LLM niet beschikbaar is
function analyzeTextFallback(text: string): {
  elements: AnalysisElement[];
  relations: AnalysisRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
} {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 3);
  const elements: AnalysisElement[] = [];
  const relations: AnalysisRelation[] = [];
  const seen = new Map<string, string>();
  let elIdx = 0;
  const gridPos = (i: number) => ({ x: 80 + (i % 4) * 230, y: 80 + Math.floor(i / 4) * 180 });
  const makeId = () => `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${elIdx++}`;
  const addEl = (label: string, type: string): string => {
    const key = label.toLowerCase();
    if (seen.has(key)) return seen.get(key)!;
    const id = makeId();
    seen.set(key, id);
    elements.push({ id, type, label, position: gridPos(elements.length), style: "corporate" });
    return id;
  };
  const addRel = (fromId: string, toId: string, type: string, label?: string) => {
    if (fromId === toId) return;
    if (relations.find(r => r.sourceId === fromId && r.targetId === toId)) return;
    relations.push({ id: `rel_${Date.now()}_${relations.length}`, sourceId: fromId, targetId: toId, type, label });
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const classifyFallback = (t: string): string => {
    const l = t.toLowerCase();
    if (/medewerker|gebruiker|klant|burger|manager|afdeling|team|organisatie|leverancier|stakeholder/.test(l)) return "actor";
    if (/systeem|portaal|platform|applicatie|app|software|database|register|api/.test(l)) return "application";
    if (/dossier|document|formulier|rapport|aanvraag|besluit|contract|data|gegevens/.test(l)) return "data";
    if (/verwerking|behandeling|taak|procedure|workflow|actie/.test(l)) return "process";
    if (/dienst|service|product/.test(l)) return "service";
    if (/event|gebeurtenis|trigger|melding/.test(l)) return "event";
    if (/beslissing|keuze|goedkeuring/.test(l)) return "decision";
    if (/[a-z](er|or|eur|aar)$/.test(l)) return "actor";
    if (/[a-z](ing|atie)$/.test(l)) return "process";
    return "system";
  };
  lines.forEach(line => {
    const svo = line.match(/^([^,]+?)\s+(verwerkt|behandelt|stuurt|ontvangt|registreert|gebruikt|raadpleegt|maakt|processes|sends|uses|creates|handles)\s+(?:een |de |het )?(.+)/i);
    if (svo) {
      const subId = addEl(cap(svo[1].trim()), classifyFallback(svo[1]));
      const objId = addEl(cap(svo[3].trim().replace(/[.,;:!?]$/, "")), classifyFallback(svo[3]));
      addRel(subId, objId, "uses", svo[2].toLowerCase());
    }
  });
  const confidence: "hoog" | "gemiddeld" | "laag" = elements.length >= 4 ? "gemiddeld" : "laag";
  const summary = elements.length > 0
    ? `Basisanalyse: ${elements.length} elementen en ${relations.length} relaties gevonden. (LLM niet beschikbaar)`
    : "Geen elementen gevonden. (LLM niet beschikbaar — probeer opnieuw)";
  return { elements, relations, summary, confidence };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Te veel analyseaanvragen. Probeer over een minuut opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadsDir = path.join(process.cwd(), "uploads");

const fileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg\+xml/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true);
    }
    cb(new Error("Alleen afbeeldingen zijn toegestaan (jpg, png, gif, svg)"));
  },
});

export async function registerRoutes(httpServer: Server, app: Express) {
  // GET all diagrams
  app.get("/api/diagrams", async (_req, res) => {
    const list = await storage.getDiagrams();
    res.json(list);
  });

  // GET single diagram
  app.get("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const diagram = await storage.getDiagram(id);
    if (!diagram) return res.status(404).json({ error: "Not found" });
    res.json(diagram);
  });

  // POST create diagram
  app.post("/api/diagrams", async (req, res) => {
    const parsed = insertDiagramSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const diagram = await storage.createDiagram(parsed.data);
    res.status(201).json(diagram);
  });

  // PATCH update diagram
  app.patch("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const parsed = insertDiagramSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const diagram = await storage.updateDiagram(id, parsed.data);
    if (!diagram) return res.status(404).json({ error: "Not found" });
    res.json(diagram);
  });

  // DELETE diagram
  app.delete("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ok = await storage.deleteDiagram(id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // POST chat command
  app.post("/api/diagrams/:id/chat", async (req, res) => {
    const id = parseInt(req.params.id);
    const diagram = await storage.getDiagram(id);
    if (!diagram) return res.status(404).json({ error: "Not found" });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    // Save user message
    await storage.addChatMessage({
      diagramId: id,
      role: "user",
      content: message,
      timestamp: Date.now(),
    });

    // Process command
    const result = processChatCommand(message, diagram.data as any);

    // Save assistant reply
    await storage.addChatMessage({
      diagramId: id,
      role: "assistant",
      content: result.reply,
      timestamp: Date.now(),
    });

    res.json({ reply: result.reply, operations: result.operations ?? [] });
  });

  // GET chat history
  app.get("/api/diagrams/:id/chat", async (req, res) => {
    const id = parseInt(req.params.id);
    const messages = await storage.getChatMessages(id);
    res.json(messages);
  });

  // POST upload icon
  app.post("/api/icons", upload.single("icon"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Geen bestand geüpload" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, message: "Icon succesvol geüpload" });
  });

  // --- Custom stijlen API ---

  // GET alle custom stijlen
  app.get("/api/custom-styles", async (_req, res) => {
    const styles = await storage.getCustomStyles();
    res.json(styles);
  });

  // GET enkele custom stijl
  app.get("/api/custom-styles/:id", async (req, res) => {
    const style = await storage.getCustomStyle(req.params.id);
    if (!style) return res.status(404).json({ error: "Not found" });
    res.json(style);
  });

  // POST maak nieuwe custom stijl
  app.post("/api/custom-styles", async (req, res) => {
    const parsed = customStyleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const style = await storage.createCustomStyle(parsed.data);
    res.status(201).json(style);
  });

  // PATCH update custom stijl
  app.patch("/api/custom-styles/:id", async (req, res) => {
    const parsed = customStyleSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const style = await storage.updateCustomStyle(req.params.id, parsed.data);
    if (!style) return res.status(404).json({ error: "Not found" });
    res.json(style);
  });

  // DELETE custom stijl (presets kunnen niet verwijderd worden)
  app.delete("/api/custom-styles/:id", async (req, res) => {
    const ok = await storage.deleteCustomStyle(req.params.id);
    if (!ok) return res.status(400).json({ error: "Niet gevonden of preset kan niet verwijderd worden" });
    res.json({ ok: true });
  });

  // ── Tekst analyseren → praatplaat-elementen ──
  // POST /api/analyze-text
  // body: { text: string }
  // returns: { elements, relations, summary, confidence }
  app.post("/api/analyze-text", analyzeLimiter, async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return res.status(400).json({ error: "Geef minimaal 20 tekens tekst mee om te analyseren." });
    }
    if (text.length > 20000) {
      return res.status(400).json({ error: "Tekst is te lang (max. 20.000 tekens)." });
    }
    try {
      // Probeer eerst de LLM-gebaseerde analyse
      const result = await analyzeTextWithLLM(text);
      res.json(result);
    } catch (llmError) {
      // Fallback naar regex als LLM niet beschikbaar is
      console.warn("LLM analyse mislukt, gebruik fallback:", llmError);
      const result = analyzeTextFallback(text);
      res.json(result);
    }
  });
}
