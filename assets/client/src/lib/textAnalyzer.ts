import type { CanvasElement, CanvasRelation } from "@shared/schema";

export interface AnalysisResult {
  elements: CanvasElement[];
  relations: CanvasRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
}

interface AIElement {
  label: string;
  type: string;
  description?: string;
}

interface AIRelation {
  sourceLabel: string;
  targetLabel: string;
  type: string;
  label?: string;
}

interface AIResponse {
  elements: AIElement[];
  relations: AIRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
}

const VALID_TYPES = new Set([
  "actor", "process", "application", "data", "transaction",
  "system", "event", "decision", "service", "infrastructure",
]);

const VALID_RELATION_TYPES = new Set([
  "uses", "triggers", "flows", "association", "realization",
  "composition", "aggregation", "assignment", "access", "influence",
]);

function gridPos(i: number) {
  return { x: 80 + (i % 4) * 230, y: 80 + Math.floor(i / 4) * 180 };
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-text`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Onbekende fout" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const ai: AIResponse = await response.json();

  if ((ai as any).error) {
    throw new Error((ai as any).error);
  }

  const elements: CanvasElement[] = [];
  const labelToId = new Map<string, string>();
  let idx = 0;

  for (const el of ai.elements ?? []) {
    const type = VALID_TYPES.has(el.type) ? el.type : "system";
    const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${idx++}`;
    const key = el.label.toLowerCase();

    if (labelToId.has(key)) continue;
    labelToId.set(key, id);

    elements.push({
      id,
      type: type as any,
      label: el.label,
      description: el.description || "",
      position: gridPos(elements.length),
      style: "corporate",
    });
  }

  const relations: CanvasRelation[] = [];
  for (const rel of ai.relations ?? []) {
    const sourceId = labelToId.get(rel.sourceLabel.toLowerCase());
    const targetId = labelToId.get(rel.targetLabel.toLowerCase());
    if (!sourceId || !targetId || sourceId === targetId) continue;

    const alreadyExists = relations.some(
      (r) => r.sourceId === sourceId && r.targetId === targetId,
    );
    if (alreadyExists) continue;

    const relType = VALID_RELATION_TYPES.has(rel.type) ? rel.type : "association";
    relations.push({
      id: `rel_${Date.now()}_${relations.length}`,
      sourceId,
      targetId,
      type: relType as any,
      label: rel.label,
    });
  }

  return {
    elements,
    relations,
    summary: ai.summary || `${elements.length} elementen en ${relations.length} relaties gevonden.`,
    confidence: ai.confidence || "gemiddeld",
  };
}
