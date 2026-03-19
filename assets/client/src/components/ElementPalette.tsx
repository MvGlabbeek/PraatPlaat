import {
  User, GitBranch, Monitor, Database, ArrowLeftRight, Server,
  Zap, Split, Package, Network
} from "lucide-react";
import type { ElementType, VisualStyle } from "@shared/schema";
import { ELEMENT_TYPES, ELEMENT_COLORS, getStyleConfig } from "@/lib/elementConfig";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<any>> = {
  User, GitBranch, Monitor, Database, ArrowLeftRight, Server,
  Zap, Split, Package, Network,
};

interface ElementPaletteProps {
  visibleTypes: string[];
  onToggleType: (type: string) => void;
  activeStyle: string;
  onAddElement: (type: ElementType) => void;
}

export default function ElementPalette({
  visibleTypes,
  onToggleType,
  activeStyle,
  onAddElement,
}: ElementPaletteProps) {
  const styleCfg = getStyleConfig(activeStyle);

  return (
    <div className="p-3 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1 mb-2">
        Elementen
      </p>
      {ELEMENT_TYPES.map(config => {
        const colors = ELEMENT_COLORS[config.type];
        const visible = visibleTypes.includes(config.type);
        const Icon = ICONS[config.icon];

        return (
          <div
            key={config.type}
            data-testid={`palette-item-${config.type}`}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer select-none",
              "transition-all duration-150",
              visible
                ? "hover:bg-accent"
                : "opacity-40 hover:opacity-60"
            )}
          >
            {/* Drag handle / click to add */}
            <button
              data-testid={`add-element-${config.type}`}
              onClick={() => onAddElement(config.type)}
              className="flex items-center gap-2.5 flex-1 min-w-0"
              title={`Voeg ${config.label} toe aan praatplaat`}
            >
              <div
                style={{
                  width: 28, height: 28,
                  background: colors.icon_bg,
                  borderRadius: styleCfg.cornerRadius / 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: colors.border,
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={14} strokeWidth={2} />}
              </div>
              <span className="text-xs font-medium truncate">{config.label}</span>
            </button>

            {/* Visibility toggle */}
            <button
              data-testid={`toggle-type-${config.type}`}
              onClick={() => onToggleType(config.type)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                "transition-colors duration-150",
                visible
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              title={visible ? "Verberg dit type" : "Toon dit type"}
            >
              <div style={{
                width: 10, height: 10,
                borderRadius: 2,
                background: visible ? colors.border : "transparent",
                border: `1.5px solid ${visible ? colors.border : "#94a3b8"}`,
                transition: "all 0.15s",
              }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
