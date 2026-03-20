/**
 * TextAnalyzePanel — plak een mail, beschrijving of tekst en vertaal naar praatplaat.
 * De analyser destilleert actoren, processen, systemen en relaties uit de tekst.
 */
import { useState } from "react";
import { Wand as Wand2, FileText, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, X, RefreshCw, ChevronDown, ChevronUp, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeText } from "@/lib/textAnalyzer";
import type { DiagramData, CanvasElement, CanvasRelation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TextAnalyzePanelProps {
  onApply: (data: DiagramData, mode: "vervangen" | "toevoegen") => void;
}

interface AnalysisResult {
  elements: CanvasElement[];
  relations: CanvasRelation[];
  summary: string;
  confidence: "hoog" | "gemiddeld" | "laag";
}

const TYPE_LABELS: Record<string, string> = {
  actor: "Actor", process: "Proces", application: "Applicatie",
  data: "Gegevens", transaction: "Transactie", system: "Systeem",
  event: "Gebeurtenis", decision: "Beslissing", service: "Dienst",
  infrastructure: "Infrastructuur",
};

const CONFIDENCE_CONFIG = {
  hoog:      { label: "Hoog",      color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" },
  gemiddeld: { label: "Gemiddeld", color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" },
  laag:      { label: "Laag",      color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800" },
};

const EXAMPLE_TEXTS = [
  {
    label: "E-mail (aanvraag)",
    text: `Beste behandelaar,

Hierbij stuur ik mijn aanvraag voor een omgevingsvergunning. De aanvrager is de gemeente Amsterdam, afdeling Vergunningen. De medewerker verwerkt de aanvraag in het Vergunningensysteem en registreert het aanvraagdossier. De behandelaar beoordeelt de aanvraag en keurt deze goed of af. Na goedkeuring verstuurt het systeem een beschikking naar de aanvrager.

Met vriendelijke groet`,
  },
  {
    label: "Procestekst (IT)",
    text: `De klant logt in op het Klantportaal en dient een aanvraag in. Het Klantportaal stuurt de aanvraag naar het CRM Systeem. De medewerker ontvangt een melding en behandelt de aanvraag. Het CRM Systeem raadpleegt de GBA Koppeling om persoonsgegevens te valideren. Na validatie maakt het systeem een dossier aan in het Documentmanagementsysteem. De manager keurt het besluit goed en het systeem verstuurt een bevestigingsmail.`,
  },
  {
    label: "Organisatiebeschrijving",
    text: `Rijkswaterstaat is verantwoordelijk voor het beheer van rijkswegen en waterwerken. De afdeling Projectmanagement beheert lopende projecten. Aannemers leveren diensten aan Rijkswaterstaat. Het contractbeheersysteem registreert alle contracten en facturen. De projectmanager behandelt wijzigingsverzoeken en rapporteert aan de directeur.`,
  },
];

export default function TextAnalyzePanel({ onApply }: TextAnalyzePanelProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showElements, setShowElements] = useState(true);
  const [showRelations, setShowRelations] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 20) {
      toast({ title: "Tekst te kort", description: "Plak minimaal een paar zinnen.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const data = analyzeText(text);
      if (data.elements.length === 0) {
        setError(data.summary || "Geen elementen gevonden. Probeer een meer beschrijvende tekst.");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(`Fout bij analyseren: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const typeGroups = result
    ? Object.entries(
        result.elements.reduce<Record<string, CanvasElement[]>>((acc, el) => {
          acc[el.type] = [...(acc[el.type] ?? []), el];
          return acc;
        }, {})
      )
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2 flex-shrink-0">
        <Wand2 size={14} className="text-primary" />
        <span className="text-xs font-semibold">Tekst → Praatplaat</span>
        <div className={cn(
          "ml-auto w-2 h-2 rounded-full flex-shrink-0",
          analyzing ? "bg-amber-400 animate-pulse" : result ? "bg-emerald-400" : "bg-muted-foreground/30"
        )} />
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Invoer-fase */}
        {!result && (
          <div className="p-3 space-y-3">
            {/* Uitleg */}
            <div className="rounded-md bg-muted/60 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-1.5">
                <Info size={11} className="mt-0.5 flex-shrink-0 text-primary" />
                <p>
                  Plak een e-mail, notitie of procesbeschrijving. De analyser herkent actoren, processen,
                  systemen, data en relaties en zet deze om naar een praatplaat.
                </p>
              </div>
            </div>

            {/* Voorbeeldteksten */}
            <div>
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Sparkles size={10} />
                Voorbeeldteksten
                {showExamples ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {showExamples && (
                <div className="mt-2 space-y-1.5">
                  {EXAMPLE_TEXTS.map(ex => (
                    <button
                      key={ex.label}
                      onClick={() => { setText(ex.text); setShowExamples(false); }}
                      className="block w-full text-left text-[11px] px-2.5 py-1.5 rounded-md bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <span className="font-medium">{ex.label}</span>
                      <span className="block text-[10px] truncate opacity-70">{ex.text.slice(0, 60)}…</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea */}
            <Textarea
              data-testid="text-analyze-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Plak hier een e-mail, procesbeschrijving of notitie..."
              className="text-xs resize-none min-h-[140px] max-h-[280px] leading-relaxed"
              rows={7}
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {text.length > 0 ? `${text.length} tekens` : "Minimaal 20 tekens"}
              </span>
              {text.length > 0 && (
                <button onClick={() => setText("")} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Wissen
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle size={13} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{error}</p>
                <button onClick={() => setError(null)}><X size={11} /></button>
              </div>
            )}

            <Button
              data-testid="button-analyze-text"
              onClick={handleAnalyze}
              disabled={analyzing || text.trim().length < 20}
              className="w-full h-8 text-xs"
              size="sm"
            >
              {analyzing ? (
                <><RefreshCw size={12} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />Analyseren...</>
              ) : (
                <><Wand2 size={12} style={{ marginRight: 6 }} />Analyseren en vertalen</>
              )}
            </Button>
          </div>
        )}

        {/* Resultaat-fase */}
        {result && (
          <div className="p-3 space-y-3">
            {/* Samenvatting */}
            <div className={cn(
              "rounded-md border px-3 py-2.5 text-[11px] leading-relaxed",
              CONFIDENCE_CONFIG[result.confidence].bg
            )}>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={12} className={cn("mt-0.5 flex-shrink-0", CONFIDENCE_CONFIG[result.confidence].color)} />
                <div className="flex-1">
                  <p className="font-medium mb-0.5">{result.summary}</p>
                  <span className={cn("text-[10px] font-semibold", CONFIDENCE_CONFIG[result.confidence].color)}>
                    Betrouwbaarheid: {CONFIDENCE_CONFIG[result.confidence].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Elementen */}
            <div>
              <button
                onClick={() => setShowElements(!showElements)}
                className="w-full flex items-center justify-between text-xs font-semibold mb-1.5 hover:text-primary transition-colors"
              >
                <span>Elementen ({result.elements.length})</span>
                {showElements ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showElements && (
                <div className="space-y-0.5">
                  {typeGroups.map(([type, els]) => (
                    <div key={type}>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide px-0.5 mt-1.5 mb-0.5">
                        {TYPE_LABELS[type] ?? type} ({els.length})
                      </p>
                      {els.map(el => (
                        <div key={el.id} className="flex items-center gap-1.5 py-1 px-2 rounded bg-muted/50 mb-0.5">
                          <span className="text-[11px] font-medium flex-1 truncate">{el.label}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relaties */}
            {result.relations.length > 0 && (
              <div>
                <button
                  onClick={() => setShowRelations(!showRelations)}
                  className="w-full flex items-center justify-between text-xs font-semibold mb-1.5 hover:text-primary transition-colors"
                >
                  <span>Relaties ({result.relations.length})</span>
                  {showRelations ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showRelations && (
                  <div className="space-y-0.5">
                    {result.relations.map(rel => {
                      const from = result.elements.find(e => e.id === rel.sourceId)?.label ?? rel.sourceId;
                      const to = result.elements.find(e => e.id === rel.targetId)?.label ?? rel.targetId;
                      return (
                        <div key={rel.id} className="text-[10px] text-muted-foreground py-0.5 px-2 rounded bg-muted/40">
                          <span className="font-medium text-foreground">{from}</span>
                          <span className="mx-1 opacity-50">→</span>
                          <span className="font-medium text-foreground">{to}</span>
                          {rel.label && <span className="ml-1 italic opacity-60">({rel.label})</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tip bij lage betrouwbaarheid */}
            {result.confidence === "laag" && (
              <div className="rounded bg-muted/60 px-3 py-2 text-[10px] text-muted-foreground leading-relaxed">
                <strong>Tip:</strong> De analyser werkt het beste met gestructureerde zinnen die een onderwerp, werkwoord en object bevatten, bijv. "De behandelaar verwerkt de aanvraag in het CRM Systeem."
              </div>
            )}

            {/* Actieknoppen */}
            <div className="space-y-1.5 pt-1">
              <Button
                data-testid="button-apply-replace"
                onClick={() => onApply({ elements: result.elements, relations: result.relations }, "vervangen")}
                className="w-full h-8 text-xs"
                size="sm"
              >
                Toepassen (canvas leegmaken)
              </Button>
              <Button
                data-testid="button-apply-merge"
                onClick={() => onApply({ elements: result.elements, relations: result.relations }, "toevoegen")}
                variant="outline"
                className="w-full h-8 text-xs"
                size="sm"
              >
                Toevoegen aan bestaande praatplaat
              </Button>
              <button
                data-testid="button-analyze-reset"
                onClick={handleReset}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1 transition-colors"
              >
                Nieuwe tekst analyseren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
