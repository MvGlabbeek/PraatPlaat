import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ReactFlowProvider } from "@xyflow/react";
import DiagramCanvas from "@/components/DiagramCanvas";
import ElementPalette from "@/components/ElementPalette";

const RelationPanel = lazy(() => import("@/components/RelationPanel"));
const StyleSelector = lazy(() => import("@/components/StyleSelector"));
const ChatPanel = lazy(() => import("@/components/ChatPanel"));
const ElementPropertiesPanel = lazy(() => import("@/components/ElementPropertiesPanel"));
const ExportPanel = lazy(() => import("@/components/ExportPanel"));
const DiagramsList = lazy(() => import("@/components/DiagramsList"));
const ImportPanel = lazy(() => import("@/components/ImportPanel"));
const TextAnalyzePanel = lazy(() => import("@/components/TextAnalyzePanel"));
import type { Diagram, DiagramData, CanvasElement, CanvasRelation, ElementType, VisualStyle, CustomStyle } from "@shared/schema";
import { VISUAL_STYLES, getStyleConfig } from "@/lib/elementConfig";
import { useToast } from "@/hooks/use-toast";
import { Layers, MessageSquare, Download, Settings, PanelLeft, Save, RotateCcw, Pencil, List, ChevronLeft, ChevronRight, Upload, Wand as Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

// ---- Sidebar tab types ----
type SidebarTab = "diagrams" | "elements" | "relations" | "style" | "import" | "export";
type RightTab = "chat" | "properties" | "analyze";

export default function EditorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeDiagramId, setActiveDiagramId] = useState<number>(1);
  const [localData, setLocalData] = useState<DiagramData | null>(null);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [leftTab, setLeftTab] = useState<SidebarTab>("elements");
  const [rightTab, setRightTab] = useState<RightTab>("chat");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Custom stijlen ophalen
  const { data: customStyles = [] } = useQuery<CustomStyle[]>({
    queryKey: ["/api/custom-styles"],
    queryFn: () => apiRequest("GET", "/api/custom-styles").then(r => r.json()),
  });

  const { data: diagram, isLoading } = useQuery<Diagram>({
    queryKey: ["/api/diagrams", activeDiagramId],
    queryFn: () => apiRequest("GET", `/api/diagrams/${activeDiagramId}`).then(r => r.json()),
    enabled: !!activeDiagramId,
  });

  // Merge server data with local edits
  const effectiveData: DiagramData = localData ?? (diagram?.data as DiagramData) ?? { elements: [], relations: [] };
  const activeStyle: string = (diagram?.style as string) ?? "corporate";
  const visibleTypes: string[] = diagram?.visibleTypes ?? [];
  const visibleRelations: string[] = diagram?.visibleRelations ?? [];

  // Bepaal of activeStyle een custom stijl is en haal de config op
  const isBuiltinStyle = VISUAL_STYLES.some(s => s.id === activeStyle);
  const activeCustomStyle: CustomStyle | null = isBuiltinStyle
    ? null
    : (customStyles.find(cs => cs.id === activeStyle) ?? null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/diagrams/${activeDiagramId}`, { data: effectiveData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagrams", activeDiagramId] });
      setIsDirty(false);
      toast({ title: "Opgeslagen", description: "Praatplaat is bewaard" });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Diagram>) => {
      await apiRequest("PATCH", `/api/diagrams/${activeDiagramId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagrams", activeDiagramId] });
    },
  });

  const handleDiagramSelect = (id: number) => {
    if (isDirty) saveMutation.mutate();
    setActiveDiagramId(id);
    setLocalData(null);
    setSelectedElement(null);
  };

  const markDirty = (data: DiagramData) => {
    setLocalData(data);
    setIsDirty(true);
  };

  const handleElementsChange = (elements: CanvasElement[]) => {
    markDirty({ ...effectiveData, elements });
  };

  const handleRelationsChange = (relations: CanvasRelation[]) => {
    markDirty({ ...effectiveData, relations });
  };

  const handleElementSelect = (element: CanvasElement | null) => {
    setSelectedElement(element);
    if (element) setRightTab("properties");
  };

  const handleAddElement = useCallback((type: ElementType) => {
    const count = effectiveData.elements.length;
    const col = count % 4;
    const row = Math.floor(count / 4);
    const newEl: CanvasElement = {
      id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: `Nieuw ${type}`,
      position: { x: 100 + col * 220, y: 100 + row * 180 },
      style: activeStyle,
      description: "",
    };
    markDirty({ ...effectiveData, elements: [...effectiveData.elements, newEl] });
    toast({ title: `${type} toegevoegd`, description: `Sleep het element naar de gewenste positie` });
  }, [effectiveData, activeStyle]);

  const handleToggleType = (type: string) => {
    const current = diagram?.visibleTypes ?? [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateSettings.mutate({ visibleTypes: updated });
  };

  const handleToggleRelation = (type: string) => {
    const current = diagram?.visibleRelations ?? [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateSettings.mutate({ visibleRelations: updated });
  };

  const handleStyleChange = (style: string) => {
    updateSettings.mutate({ style });
    // Also update all existing element styles
    const updatedElements = effectiveData.elements.map(e => ({ ...e, style }));
    markDirty({ ...effectiveData, elements: updatedElements });
  };

  const handleUpdateElement = (updated: CanvasElement) => {
    const elements = effectiveData.elements.map(e => e.id === updated.id ? updated : e);
    markDirty({ ...effectiveData, elements });
    setSelectedElement(updated);
  };

  const handleDeleteElement = (id: string) => {
    const elements = effectiveData.elements.filter(e => e.id !== id);
    const relations = effectiveData.relations.filter(r => r.sourceId !== id && r.targetId !== id);
    markDirty({ ...effectiveData, elements, relations });
    setSelectedElement(null);
  };

  const handleChatOps = (ops: any[]) => {
    let data = { ...effectiveData };
    for (const op of ops) {
      if (op.type === "ADD_ELEMENT") {
        data = { ...data, elements: [...data.elements, { ...op.element, style: activeStyle }] };
      } else if (op.type === "DELETE_ELEMENT") {
        data = {
          ...data,
          elements: data.elements.filter(e => e.id !== op.id),
          relations: data.relations.filter(r => r.sourceId !== op.id && r.targetId !== op.id),
        };
      } else if (op.type === "ADD_RELATION") {
        data = { ...data, relations: [...data.relations, op.relation] };
      } else if (op.type === "CLEAR_ALL") {
        data = { elements: [], relations: [] };
      }
    }
    markDirty(data);
  };

  const handleLabelChange = (id: string, label: string) => {
    const elements = effectiveData.elements.map(e => e.id === id ? { ...e, label } : e);
    markDirty({ ...effectiveData, elements });
  };

  // Add onLabelChange callback to element data
  const elementsWithCallback = effectiveData.elements.map(e => ({
    ...e,
    onLabelChange: handleLabelChange,
  }));

  // Import handler: maak een nieuw diagram van geïmporteerde data
  const handleImport = async (data: DiagramData, name: string) => {
    try {
      const res = await apiRequest("POST", "/api/diagrams", {
        name,
        description: `Geïmporteerd op ${new Date().toLocaleDateString("nl-NL")}`,
        style: "corporate",
        data,
        visibleTypes: ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
        visibleRelations: ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
      });
      const created = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/diagrams"] });
      setActiveDiagramId(created.id);
      setLocalData(null);
      setLeftTab("elements");
      toast({ title: `"${name}" geïmporteerd`, description: `${data.elements.length} elementen, ${data.relations.length} relaties` });
    } catch (e) {
      toast({ title: "Import mislukt", description: String(e), variant: "destructive" });
    }
  };

  // Tekst-analyse handler: voeg elementen toe of vervang
  const handleTextAnalysis = (data: DiagramData, mode: "vervangen" | "toevoegen") => {
    if (mode === "vervangen") {
      markDirty(data);
      toast({ title: "Praatplaat vervangen", description: `${data.elements.length} elementen toegepast` });
    } else {
      // Voeg toe, vermijd duplicaten op label
      const existingLabels = new Set(effectiveData.elements.map(e => e.label.toLowerCase()));
      const newElements = data.elements.filter(e => !existingLabels.has(e.label.toLowerCase()));
      // Verschuif posities zodat ze niet overlappen
      const offset = effectiveData.elements.length;
      const shiftedElements = newElements.map((e, i) => ({
        ...e,
        position: { x: e.position.x, y: e.position.y + Math.floor(offset / 4) * 180 },
      }));
      const newRelations = data.relations.filter(r => {
        const srcExists = [...newElements, ...effectiveData.elements].some(e => e.id === r.sourceId);
        const tgtExists = [...newElements, ...effectiveData.elements].some(e => e.id === r.targetId);
        return srcExists && tgtExists;
      });
      markDirty({
        elements: [...effectiveData.elements, ...shiftedElements],
        relations: [...effectiveData.relations, ...newRelations],
      });
      toast({ title: "Elementen toegevoegd", description: `${shiftedElements.length} nieuwe elementen` });
    }
    setRightTab("chat"); // ga terug naar assistent
  };

  const LEFT_TABS: { id: SidebarTab; icon: React.ComponentType<any>; label: string }[] = [
    { id: "diagrams", icon: List, label: "Praatplaten" },
    { id: "elements", icon: Layers, label: "Elementen" },
    { id: "relations", icon: Settings, label: "Relaties" },
    { id: "style", icon: Pencil, label: "Stijl" },
    { id: "import", icon: Upload, label: "Importeren" },
    { id: "export", icon: Download, label: "Exporteren" },
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Praatplaat laden...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden" data-testid="editor-root">
        {/* Top bar */}
        <header className="h-12 border-b bg-card flex items-center px-3 gap-3 flex-shrink-0 z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Praatplaat Studio" className="text-primary">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.5"/>
              <path d="M17.5 13v9M13 17.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
            <span className="font-semibold text-sm hidden sm:block">Praatplaat Studio</span>
          </div>

          {/* Diagram name */}
          <div className="flex-1 min-w-0">
            {diagram && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{diagram.name}</span>
<span className="text-[10px] text-muted-foreground hidden md:block">
                  {isBuiltinStyle
                    ? `${getStyleConfig(activeStyle as VisualStyle).emoji} ${getStyleConfig(activeStyle as VisualStyle).name}`
                    : (activeCustomStyle ? `🏢 ${activeCustomStyle.name}` : activeStyle)
                  }
                </span>
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Niet-opgeslagen wijzigingen" />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="save-btn"
                  size="sm"
                  variant={isDirty ? "default" : "outline"}
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !isDirty}
                  className="h-7 text-xs gap-1.5"
                >
                  <Save size={12} />
                  <span className="hidden sm:block">{saveMutation.isPending ? "Opslaan..." : "Opslaan"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Opslaan (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="reset-btn"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setLocalData(null); setIsDirty(false); }}
                  disabled={!isDirty}
                  className="h-7 w-7 p-0"
                >
                  <RotateCcw size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Wijzigingen ongedaan maken</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left sidebar */}
          <div className="flex flex-shrink-0 border-r bg-card">
            {/* Icon bar */}
            <div className="w-9 flex flex-col items-center py-2 gap-0.5 border-r">
              {LEFT_TABS.map(tab => (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      data-testid={`left-tab-${tab.id}`}
                      onClick={() => {
                        if (leftTab === tab.id) setLeftOpen(!leftOpen);
                        else { setLeftTab(tab.id); setLeftOpen(true); }
                      }}
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                        leftTab === tab.id && leftOpen
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <tab.icon size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{tab.label}</TooltipContent>
                </Tooltip>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setLeftOpen(!leftOpen)}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {leftOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </button>
            </div>

            {/* Panel content */}
            {leftOpen && (
              <div className="w-52 overflow-y-auto">
                <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Laden...</div>}>
                  {leftTab === "diagrams" && (
                    <DiagramsList
                      activeDiagramId={activeDiagramId}
                      onSelectDiagram={handleDiagramSelect}
                    />
                  )}
                  {leftTab === "elements" && (
                    <ElementPalette
                      visibleTypes={visibleTypes}
                      onToggleType={handleToggleType}
                      activeStyle={activeStyle}
                      onAddElement={handleAddElement}
                    />
                  )}
                  {leftTab === "relations" && (
                    <RelationPanel
                      visibleRelations={visibleRelations}
                      onToggleRelation={handleToggleRelation}
                    />
                  )}
                  {leftTab === "style" && (
                    <StyleSelector
                      activeStyle={activeStyle}
                      onStyleChange={handleStyleChange}
                    />
                  )}
                  {leftTab === "import" && (
                    <ImportPanel onImport={handleImport} />
                  )}
                  {leftTab === "export" && diagram && (
                    <ExportPanel
                      diagramName={diagram.name}
                      diagramData={effectiveData}
                    />
                  )}
                </Suspense>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-w-0 relative" data-testid="canvas-area">
            {diagram ? (
              <ReactFlowProvider>
<DiagramCanvas
                  elements={elementsWithCallback as CanvasElement[]}
                  relations={effectiveData.relations}
                  visibleTypes={visibleTypes}
                  visibleRelations={visibleRelations}
                  activeStyle={activeStyle}
                  customStyleConfig={activeCustomStyle}
                  onElementsChange={handleElementsChange}
                  onRelationsChange={handleRelationsChange}
                  onElementSelect={handleElementSelect}
                  selectedElementId={selectedElement?.id ?? null}
                />
              </ReactFlowProvider>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Selecteer een praatplaat om te beginnen
              </div>
            )}

            {/* Canvas hint overlay */}
            {diagram && effectiveData.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 opacity-40">
                  <Layers size={32} className="mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Klik op een element in het palet om te beginnen,<br/>
                    of vraag de assistent om iets toe te voegen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-shrink-0 border-l bg-card">
            {/* Panel content */}
            {rightOpen && (
              <div className="w-60 flex flex-col border-r overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b flex-shrink-0">
                  <button
                    data-testid="right-tab-chat"
                    onClick={() => setRightTab("chat")}
                    className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      rightTab === "chat"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare size={12} />
                    Assistent
                  </button>
                  <button
                    data-testid="right-tab-properties"
                    onClick={() => setRightTab("properties")}
                    className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      rightTab === "properties"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Settings size={12} />
                    Eigenschappen
                  </button>
                  <button
                    data-testid="right-tab-analyze"
                    onClick={() => setRightTab("analyze")}
                    className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      rightTab === "analyze"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wand2 size={12} />
                    Analyseren
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Laden...</div>}>
                    {rightTab === "chat" && diagram && (
                      <ChatPanel
                        diagramId={activeDiagramId}
                        onDiagramDataChange={handleChatOps}
                      />
                    )}
                    {rightTab === "analyze" && diagram && (
                      <TextAnalyzePanel onApply={handleTextAnalysis} />
                    )}
                    {rightTab === "properties" && selectedElement ? (
                      <ElementPropertiesPanel
                        element={selectedElement}
                        activeStyle={activeStyle}
                        onUpdate={handleUpdateElement}
                        onDelete={handleDeleteElement}
                        onClose={() => setSelectedElement(null)}
                      />
                    ) : rightTab === "properties" && (
                      <div className="h-full flex items-center justify-center p-4 text-center">
                        <div className="space-y-2">
                          <Settings size={24} className="mx-auto text-muted-foreground/30" />
                          <p className="text-xs text-muted-foreground">
                            Klik op een element om de eigenschappen te bewerken.
                          </p>
                        </div>
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>
            )}

            {/* Icon bar */}
            <div className="w-9 flex flex-col items-center py-2 gap-0.5">
              <button
                onClick={() => setRightOpen(!rightOpen)}
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {rightOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid="right-icon-chat"
                    onClick={() => { setRightTab("chat"); setRightOpen(true); }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      rightTab === "chat" && rightOpen
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <MessageSquare size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Assistent</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid="right-icon-props"
                    onClick={() => { setRightTab("properties"); setRightOpen(true); }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      rightTab === "properties" && rightOpen
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Settings size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Eigenschappen</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-testid="right-icon-analyze"
                    onClick={() => { setRightTab("analyze"); setRightOpen(true); }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      rightTab === "analyze" && rightOpen
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Wand2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Tekst analyseren</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Attribution footer */}
        <div className="border-t px-3 py-1 flex justify-end">
          <PerplexityAttribution />
        </div>
      </div>
    </TooltipProvider>
  );
}
