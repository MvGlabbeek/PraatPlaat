import type { DiagramData, CanvasElement, CanvasRelation } from "@shared/schema";
import { getElementConfig, getRelationConfig } from "./elementConfig";

// ------- JSON Export -------
export function exportAsJSON(diagram: { name: string; data: DiagramData }): string {
  return JSON.stringify({ name: diagram.name, ...diagram.data }, null, 2);
}

// ------- ArchiMate XML Export -------
export function exportAsArchiMate(diagram: { name: string; data: DiagramData }): string {
  const { elements, relations } = diagram.data;

  const elementXml = elements.map(e => {
    const cfg = getElementConfig(e.type);
    return `    <element xsi:type="archimate:${cfg.archimateType}" id="${e.id}" name="${escapeXml(e.label)}"${e.description ? ` documentation="${escapeXml(e.description)}"` : ""} />`;
  }).join("\n");

  const relationXml = relations.map(r => {
    const cfg = getRelationConfig(r.type);
    const xmlType = relTypeToArchi(r.type);
    return `    <element xsi:type="archimate:${xmlType}" id="${r.id}" source="${r.sourceId}" target="${r.targetId}"${r.label ? ` name="${escapeXml(r.label)}"` : ""} />`;
  }).join("\n");

  const viewElementXml = elements.map(e => {
    return `      <child xsi:type="archimate:DiagramObject" id="v_${e.id}" archimateElement="${e.id}">
        <bounds x="${Math.round(e.position.x)}" y="${Math.round(e.position.y)}" width="${e.width ?? 120}" height="${e.height ?? 60}" />
      </child>`;
  }).join("\n");

  const viewRelationXml = relations.map(r => {
    return `      <connection xsi:type="archimate:Connection" id="vc_${r.id}" archimateRelationship="${r.id}" source="v_${r.sourceId}" target="v_${r.targetId}" />`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:archimate="http://www.archimatetool.com/archimate"
    name="${escapeXml(diagram.name)}"
    id="model_praatplaat"
    version="4.0">
  <folder name="Business" id="folder_business" type="business">
${elementXml}
  </folder>
  <folder name="Relations" id="folder_relations" type="relations">
${relationXml}
  </folder>
  <folder name="Views" id="folder_views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" id="view_main" name="${escapeXml(diagram.name)}">
${viewElementXml}
${viewRelationXml}
    </element>
  </folder>
</archimate:model>`;
}

function relTypeToArchi(type: string): string {
  const map: Record<string, string> = {
    uses: "UsedByRelationship",
    triggers: "TriggeringRelationship",
    flows: "FlowRelationship",
    association: "AssociationRelationship",
    realization: "RealizationRelationship",
    composition: "CompositionRelationship",
    aggregation: "AggregationRelationship",
    assignment: "AssignmentRelationship",
    access: "AccessRelationship",
    influence: "InfluenceRelationship",
  };
  return map[type] ?? "AssociationRelationship";
}

// ------- BPMN XML Export -------
export function exportAsBPMN(diagram: { name: string; data: DiagramData }): string {
  const { elements, relations } = diagram.data;

  const flowElements = elements.map(e => {
    const cfg = getElementConfig(e.type);
    const bpmnType = getBpmnElementTag(cfg.bpmnType ?? "task");
    return `    <${bpmnType} id="${e.id}" name="${escapeXml(e.label)}" />`;
  }).join("\n");

  const sequenceFlows = relations
    .filter(r => ["triggers", "flows", "uses"].includes(r.type))
    .map(r => {
      return `    <sequenceFlow id="${r.id}" sourceRef="${r.sourceId}" targetRef="${r.targetId}"${r.label ? ` name="${escapeXml(r.label)}"` : ""} />`;
    }).join("\n");

  const bpmnShapes = elements.map(e => {
    return `      <bpmndi:BPMNShape id="shape_${e.id}" bpmnElement="${e.id}">
        <dc:Bounds x="${Math.round(e.position.x)}" y="${Math.round(e.position.y)}" width="${e.width ?? 120}" height="${e.height ?? 60}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`;
  }).join("\n");

  const bpmnEdges = relations
    .filter(r => ["triggers", "flows", "uses"].includes(r.type))
    .map(r => {
      return `      <bpmndi:BPMNEdge id="edge_${r.id}" bpmnElement="${r.id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>`;
    }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    id="def_praatplaat"
    targetNamespace="http://bpmn.io/schema/bpmn"
    exporter="Praatplaat Studio">
  <process id="process_main" name="${escapeXml(diagram.name)}" isExecutable="false">
${flowElements}
${sequenceFlows}
  </process>
  <bpmndi:BPMNDiagram id="diagram_main">
    <bpmndi:BPMNPlane id="plane_main" bpmnElement="process_main">
${bpmnShapes}
${bpmnEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
}

function getBpmnElementTag(bpmnType: string): string {
  const map: Record<string, string> = {
    task: "task",
    serviceTask: "serviceTask",
    startEvent: "startEvent",
    endEvent: "endEvent",
    exclusiveGateway: "exclusiveGateway",
    dataObject: "dataObjectReference",
    callActivity: "callActivity",
    lane: "lane",
    messageFlow: "task",
  };
  return map[bpmnType] ?? "task";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ------- SVG Export from canvas -------
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
