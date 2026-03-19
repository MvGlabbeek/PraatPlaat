/**
 * importUtils.ts
 * Parsers voor het importeren van externe modellen naar DiagramData.
 * Ondersteunt:
 * - ArchiMate AMEXX XML (Archi .archimate-formaat)
 * - BPMN 2.0 XML
 */

import type { DiagramData, CanvasElement, CanvasRelation, ElementType, RelationType } from "@shared/schema";

// ───────────────────────────────────────────────
// Hulpfuncties
// ───────────────────────────────────────────────

function parseXML(xmlString: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, "application/xml");
}

function escapeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Grid-layout voor geïmporteerde elementen (als geen positie bekend) */
function gridPosition(index: number): { x: number; y: number } {
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: 80 + col * 230, y: 80 + row * 180 };
}

// ───────────────────────────────────────────────
// ArchiMate type mapping (xsi:type → ElementType)
// ───────────────────────────────────────────────

const ARCHI_TYPE_MAP: Record<string, ElementType> = {
  // Business layer actors
  BusinessActor: "actor",
  BusinessRole: "actor",
  BusinessCollaboration: "actor",
  BusinessInterface: "actor",
  // Business layer behaviour
  BusinessProcess: "process",
  BusinessFunction: "process",
  BusinessInteraction: "process",
  BusinessService: "service",
  BusinessEvent: "event",
  BusinessObject: "data",
  // Application layer
  ApplicationComponent: "application",
  ApplicationFunction: "application",
  ApplicationProcess: "process",
  ApplicationService: "service",
  ApplicationInterface: "application",
  DataObject: "data",
  // Technology layer
  Node: "infrastructure",
  Device: "infrastructure",
  SystemSoftware: "system",
  TechnologyService: "system",
  TechnologyFunction: "system",
  CommunicationNetwork: "infrastructure",
  Path: "transaction",
  // Motivation
  Stakeholder: "actor",
  Driver: "event",
  Assessment: "decision",
  Goal: "decision",
  Requirement: "data",
  Constraint: "decision",
  Principle: "data",
  // Implementation
  WorkPackage: "process",
  Deliverable: "data",
  ImplementationEvent: "event",
  // Generic
  Junction: "decision",
  Grouping: "system",
  Location: "infrastructure",
};

const ARCHI_RELATION_MAP: Record<string, RelationType> = {
  AssociationRelationship: "association",
  CompositionRelationship: "composition",
  AggregationRelationship: "aggregation",
  AssignmentRelationship: "assignment",
  RealizationRelationship: "realization",
  ServingRelationship: "uses",
  AccessRelationship: "access",
  InfluenceRelationship: "influence",
  TriggeringRelationship: "triggers",
  FlowRelationship: "flows",
  SpecializationRelationship: "realization",
};

// ───────────────────────────────────────────────
// PARSER 1: ArchiMate AMEXX XML
// ───────────────────────────────────────────────

export function parseArchiMateXML(xmlString: string): { data: DiagramData; diagramName: string; warnings: string[] } {
  const doc = parseXML(xmlString);
  const warnings: string[] = [];

  // Model naam
  const modelEl = doc.querySelector("model, archimate\\:model, [xmi\\:type='archimate:ArchimateModel']");
  const diagramName = modelEl?.getAttribute("name") ?? "Geïmporteerd ArchiMate model";

  const elements: CanvasElement[] = [];
  const relations: CanvasRelation[] = [];
  const idMap = new Map<string, string>(); // origineel id → praatplaat id

  // Haal alle elementen op (archi:element of element nodes)
  const allElements = doc.querySelectorAll("element, folder > element");
  let elementIndex = 0;

  allElements.forEach(el => {
    const xsiType = el.getAttribute("xsi:type") ?? el.getAttribute("type") ?? "";
    const archType = xsiType.replace(/^archimate:/, "");
    const mappedType = ARCHI_TYPE_MAP[archType];

    if (!mappedType) {
      // Relatie of onbekend element
      return;
    }

    const origId = el.getAttribute("id") ?? `el_${elementIndex}`;
    const safeId = escapeId(origId);
    const name = el.getAttribute("name") ?? el.getAttribute("label") ?? `Element ${elementIndex + 1}`;
    const doc2 = el.getAttribute("documentation") ?? "";

    idMap.set(origId, safeId);

    // Positie uit bounds (als beschikbaar in view)
    const bound = doc.querySelector(`[archimateElement="${origId}"] bounds, [archimateElement="${origId}"] > bounds`);
    const x = bound ? (parseInt(bound.getAttribute("x") ?? "0") || 0) : gridPosition(elementIndex).x;
    const y = bound ? (parseInt(bound.getAttribute("y") ?? "0") || 0) : gridPosition(elementIndex).y;

    elements.push({
      id: safeId,
      type: mappedType,
      label: name,
      description: doc2 || undefined,
      position: { x, y },
      style: "corporate",
    });

    elementIndex++;
  });

  // Haal alle relaties op
  allElements.forEach(el => {
    const xsiType = el.getAttribute("xsi:type") ?? el.getAttribute("type") ?? "";
    const archType = xsiType.replace(/^archimate:/, "");
    const mappedRelType = ARCHI_RELATION_MAP[archType];

    if (!mappedRelType) return;

    const origId = el.getAttribute("id") ?? "";
    const source = el.getAttribute("source") ?? "";
    const target = el.getAttribute("target") ?? "";
    const label = el.getAttribute("name") ?? "";

    const safeSource = idMap.get(source) ?? escapeId(source);
    const safeTarget = idMap.get(target) ?? escapeId(target);

    if (!safeSource || !safeTarget) {
      warnings.push(`Relatie ${origId}: bron of doel niet gevonden (${source} → ${target})`);
      return;
    }

    relations.push({
      id: escapeId(origId) || `rel_${relations.length}`,
      sourceId: safeSource,
      targetId: safeTarget,
      type: mappedRelType,
      label: label || undefined,
    });
  });

  if (elements.length === 0) {
    warnings.push("Geen herkenbare ArchiMate-elementen gevonden. Controleer of het een geldig .archimate of AMEXX XML-bestand is.");
  }

  return { data: { elements, relations }, diagramName, warnings };
}

// ───────────────────────────────────────────────
// BPMN type mapping
// ───────────────────────────────────────────────

const BPMN_TYPE_MAP: Record<string, ElementType> = {
  userTask: "actor",
  humanTask: "actor",
  performer: "actor",
  participant: "actor",
  lane: "actor",
  laneSet: "actor",
  task: "process",
  scriptTask: "process",
  serviceTask: "application",
  sendTask: "transaction",
  receiveTask: "transaction",
  manualTask: "process",
  businessRuleTask: "decision",
  callActivity: "system",
  subProcess: "process",
  adHocSubProcess: "process",
  transaction: "transaction",
  startEvent: "event",
  endEvent: "event",
  intermediateThrowEvent: "event",
  intermediateCatchEvent: "event",
  boundaryEvent: "event",
  exclusiveGateway: "decision",
  inclusiveGateway: "decision",
  parallelGateway: "decision",
  complexGateway: "decision",
  eventBasedGateway: "decision",
  dataObject: "data",
  dataObjectReference: "data",
  dataStore: "data",
  dataStoreReference: "data",
  dataInput: "data",
  dataOutput: "data",
  message: "data",
  error: "event",
  escalation: "event",
  signal: "event",
};

const BPMN_RELATION_MAP: Record<string, RelationType> = {
  sequenceFlow: "flows",
  messageFlow: "flows",
  dataOutputAssociation: "flows",
  dataInputAssociation: "access",
  association: "association",
  textAnnotation: "association",
};

// ───────────────────────────────────────────────
// PARSER 2: BPMN 2.0 XML
// ───────────────────────────────────────────────

export function parseBPMNXML(xmlString: string): { data: DiagramData; diagramName: string; warnings: string[] } {
  const doc = parseXML(xmlString);
  const warnings: string[] = [];

  // Model naam
  const definitionsEl = doc.querySelector("definitions, bpmn\\:definitions, bpmn2\\:definitions");
  const processEl = doc.querySelector("process, bpmn\\:process, bpmn2\\:process");
  const diagramName =
    definitionsEl?.getAttribute("name") ??
    processEl?.getAttribute("name") ??
    "Geïmporteerd BPMN model";

  const elements: CanvasElement[] = [];
  const relations: CanvasRelation[] = [];
  const idMap = new Map<string, string>();

  // Positie-data uit BPMNDiagram / BPMNShape
  const positionMap = new Map<string, { x: number; y: number }>();
  doc.querySelectorAll("BPMNShape, bpmndi\\:BPMNShape").forEach(shape => {
    const bpmnEl = shape.getAttribute("bpmnElement") ?? "";
    const bounds = shape.querySelector("Bounds, dc\\:Bounds");
    if (bounds) {
      positionMap.set(bpmnEl, {
        x: parseFloat(bounds.getAttribute("x") ?? "0") || 0,
        y: parseFloat(bounds.getAttribute("y") ?? "0") || 0,
      });
    }
  });

  let elementIndex = 0;

  // Verwerk alle BPMN flow nodes
  const processAll = (container: Element | Document) => {
    const children = Array.from(container.children || []);
    children.forEach(el => {
      const localName = el.localName ?? el.tagName?.split(":").pop() ?? "";
      const mappedType = BPMN_TYPE_MAP[localName];

      if (!mappedType) {
        // Mogelijk een relatie of container → recursief doorgaan
        const relType = BPMN_RELATION_MAP[localName];
        if (relType) {
          const origId = el.getAttribute("id") ?? "";
          const source = el.getAttribute("sourceRef") ?? el.getAttribute("source") ?? "";
          const target = el.getAttribute("targetRef") ?? el.getAttribute("target") ?? "";
          const label = el.getAttribute("name") ?? "";

          const safeSource = idMap.get(source) ?? escapeId(source);
          const safeTarget = idMap.get(target) ?? escapeId(target);

          if (safeSource && safeTarget && safeSource !== safeTarget) {
            relations.push({
              id: escapeId(origId) || `rel_${relations.length}`,
              sourceId: safeSource,
              targetId: safeTarget,
              type: relType,
              label: label || undefined,
            });
          }
        }
        if (["process", "subProcess", "collaboration", "participant"].includes(localName)) {
          processAll(el);
        }
        return;
      }

      const origId = el.getAttribute("id") ?? `el_${elementIndex}`;
      const safeId = escapeId(origId);
      const name = el.getAttribute("name") ?? `${localName} ${elementIndex + 1}`;

      idMap.set(origId, safeId);

      const pos = positionMap.get(origId) ?? gridPosition(elementIndex);

      elements.push({
        id: safeId,
        type: mappedType,
        label: name || `${localName} ${elementIndex + 1}`,
        position: pos,
        style: "corporate",
      });

      elementIndex++;
      processAll(el); // ook ingebedde elementen
    });
  };

  processAll(doc);

  if (elements.length === 0) {
    warnings.push("Geen herkenbare BPMN-elementen gevonden. Controleer of het een geldig BPMN 2.0 XML-bestand is.");
  }

  return { data: { elements, relations }, diagramName, warnings };
}

// ───────────────────────────────────────────────
// Auto-detectie: kies parser op basis van inhoud
// ───────────────────────────────────────────────

export type ImportFormat = "archimate" | "bpmn" | "unknown";

export function detectFormat(xmlString: string): ImportFormat {
  const lower = xmlString.slice(0, 2000).toLowerCase();
  if (
    lower.includes("archimate") ||
    lower.includes("amexx") ||
    lower.includes("archi:") ||
    lower.includes('xmlns:archimate')
  ) return "archimate";
  if (
    lower.includes("bpmn") ||
    lower.includes("definitions") ||
    lower.includes("sequenceflow") ||
    lower.includes("startevent")
  ) return "bpmn";
  return "unknown";
}

export function parseImportedModel(xmlString: string, forceFormat?: ImportFormat): {
  data: DiagramData;
  diagramName: string;
  format: ImportFormat;
  warnings: string[];
} {
  const format = forceFormat ?? detectFormat(xmlString);
  if (format === "bpmn") {
    const result = parseBPMNXML(xmlString);
    return { ...result, format };
  }
  if (format === "archimate") {
    const result = parseArchiMateXML(xmlString);
    return { ...result, format };
  }
  // Probeer beide
  const archi = parseArchiMateXML(xmlString);
  if (archi.data.elements.length > 0) return { ...archi, format: "archimate" };
  const bpmn = parseBPMNXML(xmlString);
  if (bpmn.data.elements.length > 0) return { ...bpmn, format: "bpmn" };
  return {
    data: { elements: [], relations: [] },
    diagramName: "Onbekend model",
    format: "unknown",
    warnings: ["Kon het bestandsformaat niet herkennen. Probeer ArchiMate (.archimate) of BPMN 2.0 (.bpmn/.xml)."],
  };
}
