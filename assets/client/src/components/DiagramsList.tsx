import { Plus, Trash2, FolderOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDiagrams, createDiagram, deleteDiagram } from "@/lib/dataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Diagram } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DiagramsListProps {
  activeDiagramId: number | null;
  onSelectDiagram: (id: number) => void;
}

export default function DiagramsList({ activeDiagramId, onSelectDiagram }: DiagramsListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: diagrams = [], isLoading } = useQuery<Diagram[]>({
    queryKey: ["diagrams"],
    queryFn: getDiagrams,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return createDiagram({
        name,
        description: "",
        style: "corporate",
        data: { elements: [], relations: [] },
        visibleTypes: ["actor","process","application","data","transaction","system","event","decision","service","infrastructure"],
        visibleRelations: ["uses","triggers","flows","association","realization","composition","aggregation","assignment","access","influence"],
      });
    },
    onSuccess: (diagram: Diagram) => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
      onSelectDiagram(diagram.id);
      setCreating(false);
      setNewName("");
      toast({ title: "Praatplaat aangemaakt", description: diagram.name });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteDiagram(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
      if (activeDiagramId === id) onSelectDiagram(diagrams.find(d => d.id !== id)?.id ?? 0);
      toast({ title: "Praatplaat verwijderd" });
    },
  });

  return (
    <div className="p-3 space-y-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Praatplaten
        </p>
        <button
          data-testid="new-diagram-btn"
          onClick={() => setCreating(!creating)}
          className="text-primary hover:text-primary/80 transition-colors"
          title="Nieuwe praatplaat"
        >
          <Plus size={14} />
        </button>
      </div>

      {creating && (
        <div className="flex gap-1.5 mb-2">
          <Input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim());
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Naam praatplaat..."
            className="text-xs h-7 flex-1"
            data-testid="new-diagram-input"
          />
          <Button
            onClick={() => newName.trim() && createMutation.mutate(newName.trim())}
            size="sm"
            className="h-7 text-xs px-2"
            data-testid="new-diagram-confirm"
          >
            +
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-1.5">
          {[1,2].map(i => (
            <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {diagrams.map(diagram => (
        <div
          key={diagram.id}
          data-testid={`diagram-item-${diagram.id}`}
          className={`group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-all ${
            activeDiagramId === diagram.id
              ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
              : "hover:bg-muted"
          }`}
          onClick={() => onSelectDiagram(diagram.id)}
        >
          <FolderOpen size={13} className="flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{diagram.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {(diagram.data as any)?.elements?.length ?? 0} elem.
            </div>
          </div>
          {diagrams.length > 1 && (
            <button
              data-testid={`delete-diagram-${diagram.id}`}
              onClick={e => { e.stopPropagation(); deleteMutation.mutate(diagram.id); }}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
