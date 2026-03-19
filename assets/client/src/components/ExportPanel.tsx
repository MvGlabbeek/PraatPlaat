import { FileJson, FileCode, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagramData } from "@shared/schema";
import { exportAsJSON, exportAsArchiMate, exportAsBPMN, downloadFile } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  diagramName: string;
  diagramData: DiagramData;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export default function ExportPanel({ diagramName, diagramData, canvasRef }: ExportPanelProps) {
  const { toast } = useToast();

  const safeName = diagramName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const handleExportJSON = () => {
    const content = exportAsJSON({ name: diagramName, data: diagramData });
    downloadFile(content, `${safeName}.json`, "application/json");
    toast({ title: "Geëxporteerd als JSON", description: `${safeName}.json gedownload` });
  };

  const handleExportArchiMate = () => {
    const content = exportAsArchiMate({ name: diagramName, data: diagramData });
    downloadFile(content, `${safeName}.archimate`, "application/xml");
    toast({ title: "Geëxporteerd als ArchiMate", description: `${safeName}.archimate gedownload` });
  };

  const handleExportBPMN = () => {
    const content = exportAsBPMN({ name: diagramName, data: diagramData });
    downloadFile(content, `${safeName}.bpmn`, "application/xml");
    toast({ title: "Geëxporteerd als BPMN 2.0", description: `${safeName}.bpmn gedownload` });
  };

  const handleExportSVG = () => {
    // Export via react-flow's built-in SVG canvas
    const svgEl = document.querySelector(".react-flow__renderer svg") ??
                  document.querySelector(".react-flow svg");
    if (!svgEl) {
      toast({ title: "SVG export mislukt", description: "Probeer de praatplaat te openen", variant: "destructive" });
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Geëxporteerd als SVG", description: `${safeName}.svg gedownload` });
  };

  const handleExportPNG = () => {
    const svgEl = document.querySelector(".react-flow__renderer svg") ??
                  document.querySelector(".react-flow svg");
    if (!svgEl) {
      toast({ title: "PNG export mislukt", variant: "destructive" });
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new window.Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1200;
      canvas.height = img.height || 800;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${safeName}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        toast({ title: "Geëxporteerd als PNG", description: `${safeName}.png gedownload` });
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportOptions = [
    {
      label: "PNG afbeelding",
      description: "Hoge kwaliteit afbeelding",
      icon: Image,
      onClick: handleExportPNG,
      accent: "text-sky-600",
      testId: "export-png",
    },
    {
      label: "SVG vector",
      description: "Schaalbare vectorgrafiek",
      icon: Image,
      onClick: handleExportSVG,
      accent: "text-indigo-600",
      testId: "export-svg",
    },
    {
      label: "ArchiMate XML",
      description: "Import in Archi / BizzDesign / BlueDolphin",
      icon: FileCode,
      onClick: handleExportArchiMate,
      accent: "text-emerald-600",
      testId: "export-archimate",
    },
    {
      label: "BPMN 2.0 XML",
      description: "Import in Camunda / Signavio / BlueDolphin",
      icon: FileCode,
      onClick: handleExportBPMN,
      accent: "text-amber-600",
      testId: "export-bpmn",
    },
    {
      label: "JSON",
      description: "Praatplaat data back-up",
      icon: FileJson,
      onClick: handleExportJSON,
      accent: "text-slate-600",
      testId: "export-json",
    },
  ];

  return (
    <div className="p-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1 mb-3">
        Exporteren
      </p>

      {exportOptions.map(opt => (
        <button
          key={opt.testId}
          data-testid={opt.testId}
          onClick={opt.onClick}
          className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-accent transition-colors text-left group"
        >
          <opt.icon size={15} className={`${opt.accent} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">{opt.label}</div>
            <div className="text-[10px] text-muted-foreground">{opt.description}</div>
          </div>
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
        </button>
      ))}

      <div className="mt-3 pt-3 border-t">
        <p className="text-[10px] text-muted-foreground px-1">
          <strong>{diagramData.elements.length}</strong> elementen ·{" "}
          <strong>{diagramData.relations.length}</strong> relaties
        </p>
      </div>
    </div>
  );
}
