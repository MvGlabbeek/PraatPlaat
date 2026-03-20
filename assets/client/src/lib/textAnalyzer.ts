import type { CanvasElement, CanvasRelation } from "@shared/schema";

interface AnalysisResult {
  elements: CanvasElement[];
  relations: CanvasRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
}

const ELEMENT_PATTERNS: Record<string, RegExp> = {
  actor: /medewerker|gebruiker|klant|burger|manager|afdeling|team|organisatie|leverancier|stakeholder|behandelaar|directeur|aanvrager|opdrachtgever|opdrachtnemer|verantwoordelijke|uitvoerder/i,
  application: /systeem|portaal|platform|applicatie|app|software|database|register|api|module|website/i,
  data: /dossier|document|formulier|rapport|aanvraag|besluit|contract|data|gegevens|factuur|bericht|email|notitie|beschikking|bestand/i,
  process: /verwerk|behandel|taak|procedure|workflow|actie|beoordel|registr|analyseer|goedkeur|controle|aanvra/i,
  service: /dienst|service|product|voorziening|levering/i,
  event: /event|gebeurtenis|trigger|melding|signaal|alarm|ontvangst|deadline/i,
  decision: /beslissing|keuze|goedkeuring|afwijzing|afkeuring/i,
};

function classifyToken(text: string): string {
  const lower = text.toLowerCase();
  for (const [type, pattern] of Object.entries(ELEMENT_PATTERNS)) {
    if (pattern.test(lower)) return type;
  }
  if (/[a-z](er|or|eur|aar)$/i.test(lower)) return "actor";
  if (/[a-z](ing|atie)$/i.test(lower)) return "process";
  return "system";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function analyzeText(text: string): AnalysisResult {
  const lines = text
    .split(/[\n.!?]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const elements: CanvasElement[] = [];
  const relations: CanvasRelation[] = [];
  const seen = new Map<string, string>();
  let elIdx = 0;

  const gridPos = (i: number) => ({
    x: 80 + (i % 4) * 230,
    y: 80 + Math.floor(i / 4) * 180,
  });

  const makeId = () =>
    `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${elIdx++}`;

  const addEl = (label: string, type: string): string => {
    const key = label.toLowerCase();
    if (seen.has(key)) return seen.get(key)!;
    const id = makeId();
    seen.set(key, id);
    elements.push({
      id,
      type: type as any,
      label,
      position: gridPos(elements.length),
      style: "corporate",
    });
    return id;
  };

  const addRel = (
    fromId: string,
    toId: string,
    type: string,
    label?: string,
  ) => {
    if (fromId === toId) return;
    if (relations.find((r) => r.sourceId === fromId && r.targetId === toId))
      return;
    relations.push({
      id: `rel_${Date.now()}_${relations.length}`,
      sourceId: fromId,
      targetId: toId,
      type: type as any,
      label,
    });
  };

  lines.forEach((line) => {
    const svo = line.match(
      /^([^,]+?)\s+(verwerkt|behandelt|stuurt|ontvangt|registreert|gebruikt|raadpleegt|maakt|beoordeelt|verstuurt|dient|logt|keurt|rapporteert|beheert|leveren|levert|processes|sends|uses|creates|handles)\s+(?:een |de |het |aan )?(.+)/i,
    );
    if (svo) {
      const subLabel = capitalize(svo[1].trim());
      const objLabel = capitalize(svo[3].trim().replace(/[.,;:!?]$/, ""));
      const subId = addEl(subLabel, classifyToken(subLabel));
      const objId = addEl(objLabel, classifyToken(objLabel));
      addRel(subId, objId, "uses", svo[2].toLowerCase());
    }

    const passive = line.match(
      /(?:de |het |een )?([^,]+?)\s+(?:wordt|worden)\s+(verwerkt|behandeld|verstuurd|beoordeeld|geregistreerd|goedgekeurd|afgekeurd|opgeslagen|gebruikt)\s+(?:door|in|via|naar)\s+(?:de |het |een )?([^,]+)/i,
    );
    if (passive) {
      const objLabel = capitalize(passive[1].trim());
      const subLabel = capitalize(passive[3].trim().replace(/[.,;:!?]$/, ""));
      const subId = addEl(subLabel, classifyToken(subLabel));
      const objId = addEl(objLabel, classifyToken(objLabel));
      addRel(subId, objId, "uses", passive[2].toLowerCase());
    }
  });

  const confidence: "hoog" | "gemiddeld" | "laag" =
    elements.length >= 6
      ? "gemiddeld"
      : elements.length >= 3
        ? "gemiddeld"
        : "laag";

  const summary =
    elements.length > 0
      ? `${elements.length} elementen en ${relations.length} relaties gevonden via tekstanalyse.`
      : "Geen elementen gevonden. Probeer een meer beschrijvende tekst met duidelijke zinnen (onderwerp-werkwoord-lijdend voorwerp).";

  return { elements, relations, summary, confidence };
}
