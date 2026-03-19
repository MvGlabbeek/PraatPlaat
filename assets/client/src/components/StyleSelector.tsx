import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VISUAL_STYLES } from "@/lib/elementConfig";
import type { CustomStyle } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Building2, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CustomStyleEditor from "./CustomStyleEditor";

interface StyleSelectorProps {
  activeStyle: string;
  onStyleChange: (style: string) => void;
}

export default function StyleSelector({ activeStyle, onStyleChange }: StyleSelectorProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);

  const { data: customStyles = [] } = useQuery<CustomStyle[]>({
    queryKey: ["/api/custom-styles"],
    queryFn: () => apiRequest("GET", "/api/custom-styles").then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/custom-styles/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-styles"] });
      toast({ title: "Stijl verwijderd" });
    },
  });

  const openNew = () => {
    setEditingStyle(null);
    setEditorOpen(true);
  };

  const openEdit = (style: CustomStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStyle(style);
    setEditorOpen(true);
  };

  const handleDelete = (style: CustomStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (style.isPreset) {
      toast({ title: "Preset kan niet verwijderd worden", variant: "destructive" });
      return;
    }
    deleteMutation.mutate(style.id);
    if (activeStyle === style.id) onStyleChange("corporate");
  };

  const handleSaved = (saved: CustomStyle) => {
    setEditorOpen(false);
    onStyleChange(saved.id);
  };

  return (
    <div className="p-3">
      {/* Ingebouwde stijlen */}
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1 mb-2">
        Stijl
      </p>
      <div className="space-y-1 mb-4">
        {VISUAL_STYLES.map(style => (
          <button
            key={style.id}
            data-testid={`style-${style.id}`}
            onClick={() => onStyleChange(style.id)}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-all duration-150",
              activeStyle === style.id
                ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
                : "hover:bg-muted"
            )}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{style.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{style.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{style.description}</div>
            </div>
            {activeStyle === style.id && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Organisatie-huisstijlen */}
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Huisstijlen
        </p>
        <button
          data-testid="button-new-custom-style"
          onClick={openNew}
          className="flex items-center gap-1 text-[10px] text-primary hover:underline"
          title="Nieuwe huisstijl aanmaken"
        >
          <Plus size={11} />
          Nieuw
        </button>
      </div>

      {customStyles.length === 0 ? (
        <p className="text-[10px] text-muted-foreground px-2 italic">
          Nog geen huisstijlen aangemaakt.
        </p>
      ) : (
        <div className="space-y-1">
          {customStyles.map(cs => {
            const isActive = activeStyle === cs.id;
            const iconCount = Object.values(cs.elementIcons ?? {}).filter(Boolean).length;
            return (
              <button
                key={cs.id}
                data-testid={`style-custom-${cs.id}`}
                onClick={() => onStyleChange(cs.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-all duration-150 group",
                  isActive
                    ? "bg-accent text-accent-foreground ring-1 ring-primary/20"
                    : "hover:bg-muted"
                )}
              >
                {/* Kleurvierkantjes als "logo" */}
                <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    borderRadius: 3,
                    background: cs.primaryColor,
                  }} />
                  <div style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 8, height: 8,
                    borderRadius: 2,
                    background: cs.accentColor,
                    border: `1.5px solid ${cs.bgColor}`,
                  }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold truncate">{cs.name}</span>
                    {cs.isPreset && (
                      <Star size={9} className="text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {cs.orgName || cs.name}
                    {iconCount > 0 && ` · ${iconCount} iconen`}
                  </div>
                </div>

                {/* Acties */}
                <div className={cn("flex gap-0.5", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                  <span
                    data-testid={`edit-style-${cs.id}`}
                    onClick={e => openEdit(cs, e)}
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                    title="Bewerken"
                  >
                    <Pencil size={10} />
                  </span>
                  {!cs.isPreset && (
                    <span
                      data-testid={`delete-style-${cs.id}`}
                      onClick={e => handleDelete(cs, e)}
                      className="p-1 rounded hover:bg-background text-muted-foreground hover:text-red-500"
                      title="Verwijderen"
                    >
                      <Trash2 size={10} />
                    </span>
                  )}
                </div>

                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <CustomStyleEditor
          editing={editingStyle}
          onClose={() => setEditorOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
