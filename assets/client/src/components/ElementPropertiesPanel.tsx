import { useState } from "react";
import { X, Trash2, Upload } from "lucide-react";
import type { CanvasElement, ElementType, VisualStyle } from "@shared/schema";
import { ELEMENT_TYPES, ELEMENT_COLORS, getStyleConfig } from "@/lib/elementConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Props {
  element: CanvasElement;
  activeStyle: string;
  onUpdate: (updated: CanvasElement) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ElementPropertiesPanel({ element, activeStyle, onUpdate, onDelete, onClose }: Props) {
  const [label, setLabel] = useState(element.label);
  const [description, setDescription] = useState(element.description ?? "");
  const [type, setType] = useState<ElementType>(element.type);
  const colors = ELEMENT_COLORS[type];

  const handleApply = () => {
    onUpdate({ ...element, label, description, type });
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onUpdate({ ...element, iconUrl: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <div
          style={{
            width: 20, height: 20,
            background: colors.icon_bg,
            borderRadius: 4,
            border: `1.5px solid ${colors.border}`,
            flexShrink: 0,
          }}
        />
        <span className="text-xs font-semibold truncate flex-1">Eigenschappen</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Naam</Label>
          <Input
            data-testid="prop-label"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="text-xs h-8"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Type element</Label>
          <Select value={type} onValueChange={v => setType(v as ElementType)}>
            <SelectTrigger data-testid="prop-type" className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELEMENT_TYPES.map(et => (
                <SelectItem key={et.type} value={et.type} className="text-xs">
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Omschrijving</Label>
          <Textarea
            data-testid="prop-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="text-xs resize-none"
            rows={3}
            placeholder="Optionele toelichting..."
          />
        </div>

        {/* Icon upload */}
        <div className="space-y-1.5">
          <Label className="text-xs">Eigen icoon</Label>
          <div className="flex items-center gap-2">
            {element.iconUrl && (
              <img src={element.iconUrl} alt="icon" className="w-8 h-8 rounded border object-contain" />
            )}
            <label className="flex-1">
              <input
                type="file"
                accept="image/*,.svg"
                className="hidden"
                onChange={handleIconUpload}
                data-testid="prop-icon-upload"
              />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dashed text-xs text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
                <Upload size={12} />
                <span>{element.iconUrl ? "Vervangen..." : "Upload icoon..."}</span>
              </div>
            </label>
            {element.iconUrl && (
              <button
                onClick={() => onUpdate({ ...element, iconUrl: undefined })}
                className="text-destructive hover:text-destructive/80"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">PNG, SVG of JPEG. Max. 256×256px.</p>
        </div>

        {/* ArchiMate info */}
        <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Formele mapping</p>
          <p className="text-[11px]">
            <span className="text-muted-foreground">ArchiMate: </span>
            <code className="text-xs bg-background px-1 rounded">
              {ELEMENT_TYPES.find(e => e.type === type)?.archimateType}
            </code>
          </p>
          <p className="text-[11px]">
            <span className="text-muted-foreground">BPMN: </span>
            <code className="text-xs bg-background px-1 rounded">
              {ELEMENT_TYPES.find(e => e.type === type)?.bpmnType}
            </code>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex gap-2">
        <Button
          data-testid="prop-apply"
          onClick={handleApply}
          size="sm"
          className="flex-1 text-xs h-8"
        >
          Toepassen
        </Button>
        <Button
          data-testid="prop-delete"
          onClick={() => { onDelete(element.id); onClose(); }}
          variant="destructive"
          size="sm"
          className="text-xs h-8 w-8 p-0"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}
