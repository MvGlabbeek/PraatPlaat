/**
 * ImportPanel — importeer een extern ArchiMate of BPMN model als praatplaat.
 * Ondersteunt drag-and-drop en handmatig bestand kiezen.
 */
import { useState, useRef, useCallback } from "react";
import { Upload, FileCode, AlertCircle, CheckCircle2, X, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseImportedModel, type ImportFormat } from "@/lib/importUtils";
import type { DiagramData } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ImportPanelProps {
  onImport: (data: DiagramData, name: string) => void;
}

const FORMAT_LABELS: Record<ImportFormat, string> = {
  archimate: "ArchiMate AMEXX",
  bpmn: "BPMN 2.0",
  unknown: "Onbekend",
};

const FORMAT_COLORS: Record<ImportFormat, string> = {
  archimate: "text-emerald-600",
  bpmn: "text-amber-600",
  unknown: "text-muted-foreground",
};

export default function ImportPanel({ onImport }: ImportPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{
    data: DiagramData;
    name: string;
    format: ImportFormat;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const parsed = parseImportedModel(text);

      if (parsed.format === "unknown" || parsed.data.elements.length === 0) {
        setError(
          parsed.warnings[0] ??
          "Kon het bestand niet verwerken. Controleer of het een geldig ArchiMate (.archimate, .xml) of BPMN (.bpmn, .xml) bestand is."
        );
      } else {
        // Gebruik bestandsnaam als fallback voor de diagramnaam
        const fallbackName = file.name.replace(/\.(archimate|bpmn|xml)$/i, "").replace(/[_-]/g, " ");
        setResult({
          data: parsed.data,
          name: parsed.diagramName !== "Geïmporteerd ArchiMate model" && parsed.diagramName !== "Geïmporteerd BPMN model"
            ? parsed.diagramName
            : fallbackName || parsed.diagramName,
          format: parsed.format,
          warnings: parsed.warnings,
        });
      }
    } catch (e) {
      setError(`Fout bij verwerken: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    if (!result) return;
    onImport(result.data, result.name);
    setResult(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1">
        Model importeren
      </p>

      {/* Uitleg */}
      <div className="rounded-md bg-muted/60 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
        <div className="flex items-start gap-1.5">
          <Info size={11} className="mt-0.5 flex-shrink-0 text-primary" />
          <p>
            Upload een extern model als startpunt voor je praatplaat. Elementen en relaties worden automatisch vertaald.
          </p>
        </div>
        <div className="flex gap-3 mt-1.5">
          <span className="flex items-center gap-1">
            <FileCode size={10} className="text-emerald-500" />
            <strong>ArchiMate</strong> · .archimate, .xml (Archi, BizzDesign, AMEXX)
          </span>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <FileCode size={10} className="text-amber-500" />
            <strong>BPMN</strong> · .bpmn, .xml (Camunda, Signavio, BlueDolphin)
          </span>
        </div>
      </div>

      {/* Drop zone */}
      {!result && !error && (
        <div
          data-testid="import-dropzone"
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150",
            dragOver
              ? "border-primary bg-accent"
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".archimate,.bpmn,.xml"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
          {parsing ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={20} className="text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Bestand verwerken...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={20} className={dragOver ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-medium">
                {dragOver ? "Loslaten om te uploaden" : "Klik of sleep een bestand"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                .archimate · .bpmn · .xml
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-destructive mb-1">Importeren mislukt</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handleReset} className="mt-3 h-7 text-xs w-full">
            Opnieuw proberen
          </Button>
        </div>
      )}

      {/* Resultaat preview */}
      {result && (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-semibold truncate">{result.name}</span>
            </div>
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>

          {/* Stats */}
          <div className="px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide", FORMAT_COLORS[result.format])}>
                {FORMAT_LABELS[result.format]}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">
                <strong className="text-foreground">{result.data.elements.length}</strong> elementen
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">
                <strong className="text-foreground">{result.data.relations.length}</strong> relaties
              </span>
            </div>

            {/* Element type overzicht */}
            <div className="flex flex-wrap gap-1">
              {(() => {
                const counts: Record<string, number> = {};
                result.data.elements.forEach(e => {
                  counts[e.type] = (counts[e.type] ?? 0) + 1;
                });
                return Object.entries(counts).map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground"
                  >
                    {count}× {type}
                  </span>
                ));
              })()}
            </div>

            {/* Waarschuwingen */}
            {result.warnings.length > 0 && (
              <div className="rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5 mt-1">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">{w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Actie */}
          <div className="px-3 pb-3">
            <Button
              data-testid="button-confirm-import"
              onClick={handleConfirmImport}
              className="w-full h-8 text-xs"
              size="sm"
            >
              <Upload size={12} style={{ marginRight: 6 }} />
              Importeren als nieuwe praatplaat
            </Button>
          </div>
        </div>
      )}

      {/* Tip */}
      <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
        Na het importeren kun je het model verder aanpassen, stijlen toepassen en elementen verwijderen die je niet nodig hebt voor het gesprek.
      </p>
    </div>
  );
}
