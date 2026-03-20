/**
 * CustomStyleEditor — paneel voor het aanmaken/bewerken van een organisatie-huisstijl.
 * Ondersteunt:
 * - Kleuren (primair, accent, achtergrond, tekst, rand)
 * - Lettertype
 * - Per elementtype een eigen SVG-icoon (bulk upload of één-voor-één)
 * - digiGO preset als startpunt
 */
import { useState, useRef, useCallback } from "react";
import { X, Upload, Trash2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomStyle } from "@shared/schema";
import { upsertCustomStyle } from "@/lib/dataService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  actor: "Actor",
  process: "Proces",
  application: "Applicatie",
  data: "Gegevens",
  transaction: "Transactie",
  system: "Systeem",
  event: "Gebeurtenis",
  decision: "Beslissing",
  service: "Dienst",
  infrastructure: "Infrastructuur",
};

const ELEMENT_TYPES = Object.keys(ELEMENT_TYPE_LABELS);

const FONT_OPTIONS = [
  { label: "Inter (sans-serif)", value: "'Inter', 'DM Sans', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Caveat (handgeschreven)", value: "'Caveat', cursive" },
  { label: "Patrick Hand", value: "'Patrick Hand', cursive" },
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
];

// Lees een File als data-URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Genereer een slug-achtig id
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || `stijl-${Date.now()}`;
}

interface Props {
  editing?: CustomStyle | null;
  onClose: () => void;
  onSaved: (style: CustomStyle) => void;
}

export default function CustomStyleEditor({ editing, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!editing && !editing.isPreset;

  const [form, setForm] = useState<CustomStyle>(() => editing ?? {
    id: "",
    name: "",
    orgName: "",
    primaryColor: "#000000",
    accentColor: "#ffe103",
    bgColor: "#ffffff",
    textColor: "#111111",
    borderColor: "#000000",
    fontFamily: "'Inter', 'DM Sans', sans-serif",
    elementIcons: {},
  });

  const [saving, setSaving] = useState(false);
  const [activeIconTab, setActiveIconTab] = useState<string | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof CustomStyle>(key: K, value: CustomStyle[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Sla één SVG-icoon op voor een elementtype
  const handleIconFile = async (type: string, file: File) => {
    if (!file.type.includes("svg") && !file.name.endsWith(".svg")) {
      toast({ title: "Alleen SVG-bestanden", description: "Upload een .svg bestand.", variant: "destructive" });
      return;
    }
    const dataUrl = await readFileAsDataURL(file);
    setForm(prev => ({
      ...prev,
      elementIcons: { ...prev.elementIcons, [type]: dataUrl },
    }));
  };

  // Bulk upload: probeer bestandsnamen te matchen met elementtypes
  const handleBulkUpload = async (files: FileList) => {
    const newIcons: Record<string, string> = {};
    Object.entries(form.elementIcons || {}).forEach(([k, v]) => {
      if (v) newIcons[k] = v;
    });
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".svg")) continue;
      const nameLower = file.name.toLowerCase().replace(".svg", "");
      // Zoek match op elementtype of label
      const matchedType = ELEMENT_TYPES.find(t =>
        nameLower.includes(t) ||
        nameLower.includes(ELEMENT_TYPE_LABELS[t].toLowerCase())
      );
      if (matchedType) {
        newIcons[matchedType] = await readFileAsDataURL(file);
        matched.push(file.name);
      } else {
        unmatched.push(file.name);
      }
    }

    setForm(prev => ({ ...prev, elementIcons: newIcons }));
    toast({
      title: `${matched.length} iconen gekoppeld`,
      description: unmatched.length > 0
        ? `Niet herkend (wijs handmatig toe): ${unmatched.join(", ")}`
        : "Alle iconen zijn automatisch gekoppeld.",
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Naam vereist", description: "Geef de stijl een naam.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: CustomStyle = {
        ...form,
        id: form.id || slugify(form.name),
        orgName: form.orgName || form.name,
      };
      const saved = await upsertCustomStyle(payload);
      queryClient.invalidateQueries({ queryKey: ["custom-styles"] });
      onSaved(saved);
      toast({ title: "Stijl opgeslagen", description: `"${saved.name}" is bewaard.` });
    } catch (e) {
      toast({ title: "Fout bij opslaan", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const iconCount = Object.values(form.elementIcons || {}).filter(Boolean).length;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          width: "min(680px, 100%)",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              {isEdit ? "Stijl bewerken" : "Nieuwe huisstijl aanmaken"}
            </h2>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" }}>
              Definieer de huisstijl van een organisatie en voeg iconen toe per elementtype.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>

          {/* Basisgegevens */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, color: "var(--muted-foreground)" }}>
              Basisgegevens
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: "block" }}>Stijlnaam *</Label>
                <Input
                  data-testid="input-style-name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="bijv. digiGO"
                  style={{ height: 32, fontSize: 13 }}
                />
              </div>
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: "block" }}>Organisatie</Label>
                <Input
                  data-testid="input-org-name"
                  value={form.orgName}
                  onChange={e => set("orgName", e.target.value)}
                  placeholder="bijv. digiGO - stelselorganisatie"
                  style={{ height: 32, fontSize: 13 }}
                />
              </div>
            </div>
          </section>

          {/* Kleuren */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, color: "var(--muted-foreground)" }}>
              Kleuren
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {([
                ["primaryColor", "Primaire kleur"],
                ["accentColor", "Accentkleur"],
                ["bgColor", "Achtergrond node"],
                ["textColor", "Tekstkleur"],
                ["borderColor", "Randkleur"],
              ] as [keyof CustomStyle, string][]).map(([key, label]) => (
                <div key={key}>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: "block" }}>{label}</Label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="color"
                      data-testid={`color-${key}`}
                      value={form[key] as string}
                      onChange={e => set(key, e.target.value)}
                      style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: 2, background: "none" }}
                    />
                    <Input
                      value={form[key] as string}
                      onChange={e => set(key, e.target.value)}
                      style={{ height: 32, fontSize: 12, fontFamily: "monospace", flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 11, marginBottom: 6, display: "block" }}>Voorbeeld</Label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  background: form.bgColor,
                  border: `2px solid ${form.borderColor}`,
                  borderRadius: 8,
                  padding: "8px 14px",
                  color: form.textColor,
                  fontFamily: form.fontFamily,
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  Elementnaam
                </div>
                <div style={{
                  background: form.primaryColor,
                  borderRadius: 6,
                  padding: "8px 14px",
                  color: form.accentColor,
                  fontFamily: form.fontFamily,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}>
                  ACTOR
                </div>
                <div style={{
                  background: form.accentColor,
                  borderRadius: 6,
                  padding: "8px 14px",
                  color: form.primaryColor,
                  fontFamily: form.fontFamily,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  Accent
                </div>
              </div>
            </div>
          </section>

          {/* Lettertype */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, color: "var(--muted-foreground)" }}>
              Lettertype
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FONT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  data-testid={`font-${opt.value}`}
                  onClick={() => set("fontFamily", opt.value)}
                  style={{
                    padding: "6px 12px",
                    border: `1.5px solid ${form.fontFamily === opt.value ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 6,
                    background: form.fontFamily === opt.value ? "var(--accent)" : "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: opt.value,
                    color: "var(--foreground)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {form.fontFamily === opt.value && <Check size={10} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Iconen per elementtype */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, color: "var(--muted-foreground)" }}>
                  Iconen per elementtype
                </h3>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "2px 0 0" }}>
                  {iconCount} van {ELEMENT_TYPES.length} iconen ingesteld
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-bulk-upload"
                  onClick={() => bulkInputRef.current?.click()}
                  style={{ fontSize: 11, height: 28 }}
                >
                  <Upload size={12} style={{ marginRight: 4 }} />
                  Bulk upload (.svg)
                </Button>
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  multiple
                  style={{ display: "none" }}
                  onChange={e => e.target.files && handleBulkUpload(e.target.files)}
                />
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 10, lineHeight: 1.5 }}>
              Upload SVG-bestanden. Bij bulk upload worden bestandsnamen automatisch herkend
              (bijv. <em>actor.svg</em> of <em>proces.svg</em>). Je kunt ook per type handmatig uploaden.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {ELEMENT_TYPES.map(type => {
                const icon = form.elementIcons?.[type];
                const isActive = activeIconTab === type;
                return (
                  <div
                    key={type}
                    style={{
                      border: `1.5px solid ${icon ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: icon ? "var(--accent)" : "transparent",
                      transition: "all 0.12s",
                    }}
                  >
                    {/* Preview of icoon */}
                    <div style={{
                      width: 32, height: 32, flexShrink: 0,
                      border: "1px solid var(--border)", borderRadius: 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: form.bgColor, overflow: "hidden",
                    }}>
                      {icon ? (
                        <img src={icon} alt={type} style={{ width: 26, height: 26, objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>–</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{ELEMENT_TYPE_LABELS[type]}</div>
                      <div style={{ fontSize: 10, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {icon ? "Eigen icoon" : "Geen icoon (standaard)"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      {/* Upload knop */}
                      <label
                        data-testid={`upload-icon-${type}`}
                        title="SVG uploaden"
                        style={{
                          cursor: "pointer",
                          padding: "3px 6px",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          fontSize: 10,
                          display: "flex", alignItems: "center",
                          background: "var(--background)",
                        }}
                      >
                        <Upload size={11} />
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          style={{ display: "none" }}
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) await handleIconFile(type, file);
                          }}
                        />
                      </label>
                      {/* Verwijder icoon */}
                      {icon && (
                        <button
                          data-testid={`remove-icon-${type}`}
                          title="Icoon verwijderen"
                          onClick={() => {
                            setForm(prev => {
                              const icons = { ...prev.elementIcons };
                              delete icons[type];
                              return { ...prev, elementIcons: icons };
                            });
                          }}
                          style={{
                            cursor: "pointer",
                            padding: "3px 6px",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            background: "var(--background)",
                            color: "#ef4444",
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <Button variant="outline" onClick={onClose} size="sm" style={{ fontSize: 12 }}>
            Annuleren
          </Button>
          <Button
            data-testid="button-save-style"
            onClick={handleSubmit}
            disabled={saving}
            size="sm"
            style={{ fontSize: 12, minWidth: 100 }}
          >
            {saving ? <RefreshCw size={12} style={{ marginRight: 4, animation: "spin 1s linear infinite" }} /> : <Check size={12} style={{ marginRight: 4 }} />}
            {isEdit ? "Bijwerken" : "Stijl aanmaken"}
          </Button>
        </div>
      </div>
    </div>
  );
}
