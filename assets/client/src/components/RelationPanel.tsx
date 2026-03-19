import { RELATION_TYPES } from "@/lib/elementConfig";
import { cn } from "@/lib/utils";

interface RelationPanelProps {
  visibleRelations: string[];
  onToggleRelation: (type: string) => void;
}

export default function RelationPanel({ visibleRelations, onToggleRelation }: RelationPanelProps) {
  return (
    <div className="p-3 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1 mb-2">
        Relaties
      </p>
      {RELATION_TYPES.map(cfg => {
        const visible = visibleRelations.includes(cfg.type);
        return (
          <button
            key={cfg.type}
            data-testid={`toggle-relation-${cfg.type}`}
            onClick={() => onToggleRelation(cfg.type)}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
              "transition-all duration-150",
              visible ? "hover:bg-accent" : "opacity-40 hover:opacity-60"
            )}
            title={cfg.description}
          >
            {/* Relation line preview */}
            <svg width="24" height="14" viewBox="0 0 24 14" style={{ flexShrink: 0 }}>
              <line
                x1="2" y1="7" x2="20" y2="7"
                stroke={visible ? "#64748b" : "#cbd5e1"}
                strokeWidth="1.5"
                strokeDasharray={cfg.dashed ? "4,3" : undefined}
              />
              {cfg.markerEnd === "arrow" && (
                <polyline points="16,4 20,7 16,10" fill="none" stroke={visible ? "#64748b" : "#cbd5e1"} strokeWidth="1.5" />
              )}
              {cfg.markerEnd === "arrowclosed" && (
                <polygon points="15,4 20,7 15,10" fill={visible ? "#64748b" : "#cbd5e1"} />
              )}
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{cfg.label}</div>
              <div className="text-[10px] text-muted-foreground truncate">{cfg.description}</div>
            </div>
            <div style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: visible ? "#64748b" : "transparent",
              border: `1.5px solid ${visible ? "#64748b" : "#94a3b8"}`,
              transition: "all 0.15s",
            }} />
          </button>
        );
      })}
    </div>
  );
}
