import{j as s}from"./flow-vendor-DKtwixb5.js";import{a as j,o as M,p as E,u as N}from"./index-W49Too4K.js";import{F as y}from"./file-code-3UN8B9x0.js";import"./ui-vendor-2A84t0YK.js";const B=j("FileJson",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1",key:"1oajmo"}],["path",{d:"M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1",key:"mpwhp6"}]]);const $=j("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);function L(t){return JSON.stringify({name:t.name,...t.data},null,2)}function P(t){const{elements:i,relations:r}=t.data,o=i.map(e=>`    <element xsi:type="archimate:${M(e.type).archimateType}" id="${e.id}" name="${l(e.label)}"${e.description?` documentation="${l(e.description)}"`:""} />`).join(`
`),a=r.map(e=>(E(e.type),`    <element xsi:type="archimate:${S(e.type)}" id="${e.id}" source="${e.sourceId}" target="${e.targetId}"${e.label?` name="${l(e.label)}"`:""} />`)).join(`
`),c=i.map(e=>`      <child xsi:type="archimate:DiagramObject" id="v_${e.id}" archimateElement="${e.id}">
        <bounds x="${Math.round(e.position.x)}" y="${Math.round(e.position.y)}" width="${e.width??120}" height="${e.height??60}" />
      </child>`).join(`
`),m=r.map(e=>`      <connection xsi:type="archimate:Connection" id="vc_${e.id}" archimateRelationship="${e.id}" source="v_${e.sourceId}" target="v_${e.targetId}" />`).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:archimate="http://www.archimatetool.com/archimate"
    name="${l(t.name)}"
    id="model_praatplaat"
    version="4.0">
  <folder name="Business" id="folder_business" type="business">
${o}
  </folder>
  <folder name="Relations" id="folder_relations" type="relations">
${a}
  </folder>
  <folder name="Views" id="folder_views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" id="view_main" name="${l(t.name)}">
${c}
${m}
    </element>
  </folder>
</archimate:model>`}function S(t){return{uses:"UsedByRelationship",triggers:"TriggeringRelationship",flows:"FlowRelationship",association:"AssociationRelationship",realization:"RealizationRelationship",composition:"CompositionRelationship",aggregation:"AggregationRelationship",assignment:"AssignmentRelationship",access:"AccessRelationship",influence:"InfluenceRelationship"}[t]??"AssociationRelationship"}function I(t){const{elements:i,relations:r}=t.data,o=i.map(e=>{const h=M(e.type);return`    <${U(h.bpmnType??"task")} id="${e.id}" name="${l(e.label)}" />`}).join(`
`),a=r.filter(e=>["triggers","flows","uses"].includes(e.type)).map(e=>`    <sequenceFlow id="${e.id}" sourceRef="${e.sourceId}" targetRef="${e.targetId}"${e.label?` name="${l(e.label)}"`:""} />`).join(`
`),c=i.map(e=>`      <bpmndi:BPMNShape id="shape_${e.id}" bpmnElement="${e.id}">
        <dc:Bounds x="${Math.round(e.position.x)}" y="${Math.round(e.position.y)}" width="${e.width??120}" height="${e.height??60}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>`).join(`
`),m=r.filter(e=>["triggers","flows","uses"].includes(e.type)).map(e=>`      <bpmndi:BPMNEdge id="edge_${e.id}" bpmnElement="${e.id}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>`).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    id="def_praatplaat"
    targetNamespace="http://bpmn.io/schema/bpmn"
    exporter="Praatplaat Studio">
  <process id="process_main" name="${l(t.name)}" isExecutable="false">
${o}
${a}
  </process>
  <bpmndi:BPMNDiagram id="diagram_main">
    <bpmndi:BPMNPlane id="plane_main" bpmnElement="process_main">
${c}
${m}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`}function U(t){return{task:"task",serviceTask:"serviceTask",startEvent:"startEvent",endEvent:"endEvent",exclusiveGateway:"exclusiveGateway",dataObject:"dataObjectReference",callActivity:"callActivity",lane:"lane",messageFlow:"task"}[t]??"task"}function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function f(t,i,r){const o=new Blob([t],{type:r}),a=URL.createObjectURL(o),c=document.createElement("a");c.href=a,c.download=i,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(a)}function G({diagramName:t,diagramData:i,canvasRef:r}){const{toast:o}=N(),a=t.replace(/[^a-z0-9]/gi,"_").toLowerCase(),k=[{label:"PNG afbeelding",description:"Hoge kwaliteit afbeelding",icon:$,onClick:()=>{const n=document.querySelector(".react-flow__renderer svg")??document.querySelector(".react-flow svg");if(!n){o({title:"PNG export mislukt",variant:"destructive"});return}const u=new XMLSerializer().serializeToString(n),d=new window.Image,g=new Blob([u],{type:"image/svg+xml;charset=utf-8"}),p=URL.createObjectURL(g);d.onload=()=>{const x=document.createElement("canvas");x.width=d.width||1200,x.height=d.height||800,x.getContext("2d")?.drawImage(d,0,0),x.toBlob(b=>{if(!b)return;const v=URL.createObjectURL(b),w=document.createElement("a");w.href=v,w.download=`${a}.png`,w.click(),URL.revokeObjectURL(v),o({title:"Geëxporteerd als PNG",description:`${a}.png gedownload`})},"image/png"),URL.revokeObjectURL(p)},d.src=p},accent:"text-sky-600",testId:"export-png"},{label:"SVG vector",description:"Schaalbare vectorgrafiek",icon:$,onClick:()=>{const n=document.querySelector(".react-flow__renderer svg")??document.querySelector(".react-flow svg");if(!n){o({title:"SVG export mislukt",description:"Probeer de praatplaat te openen",variant:"destructive"});return}const u=new XMLSerializer().serializeToString(n),d=new Blob([`<?xml version="1.0" encoding="UTF-8"?>
${u}`],{type:"image/svg+xml"}),g=URL.createObjectURL(d),p=document.createElement("a");p.href=g,p.download=`${a}.svg`,p.click(),URL.revokeObjectURL(g),o({title:"Geëxporteerd als SVG",description:`${a}.svg gedownload`})},accent:"text-indigo-600",testId:"export-svg"},{label:"ArchiMate XML",description:"Import in Archi / BizzDesign / BlueDolphin",icon:y,onClick:()=>{const n=P({name:t,data:i});f(n,`${a}.archimate`,"application/xml"),o({title:"Geëxporteerd als ArchiMate",description:`${a}.archimate gedownload`})},accent:"text-emerald-600",testId:"export-archimate"},{label:"BPMN 2.0 XML",description:"Import in Camunda / Signavio / BlueDolphin",icon:y,onClick:()=>{const n=I({name:t,data:i});f(n,`${a}.bpmn`,"application/xml"),o({title:"Geëxporteerd als BPMN 2.0",description:`${a}.bpmn gedownload`})},accent:"text-amber-600",testId:"export-bpmn"},{label:"JSON",description:"Praatplaat data back-up",icon:B,onClick:()=>{const n=L({name:t,data:i});f(n,`${a}.json`,"application/json"),o({title:"Geëxporteerd als JSON",description:`${a}.json gedownload`})},accent:"text-slate-600",testId:"export-json"}];return s.jsxs("div",{className:"p-3 space-y-2",children:[s.jsx("p",{className:"text-xs text-muted-foreground font-medium uppercase tracking-wide px-1 mb-3",children:"Exporteren"}),k.map(n=>s.jsxs("button",{"data-testid":n.testId,onClick:n.onClick,className:"w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-accent transition-colors text-left group",children:[s.jsx(n.icon,{size:15,className:`${n.accent} flex-shrink-0`}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsx("div",{className:"text-xs font-medium",children:n.label}),s.jsx("div",{className:"text-[10px] text-muted-foreground",children:n.description})]}),s.jsx("span",{className:"text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",children:"↓"})]},n.testId)),s.jsx("div",{className:"mt-3 pt-3 border-t",children:s.jsxs("p",{className:"text-[10px] text-muted-foreground px-1",children:[s.jsx("strong",{children:i.elements.length})," elementen ·"," ",s.jsx("strong",{children:i.relations.length})," relaties"]})})]})}export{G as default};
