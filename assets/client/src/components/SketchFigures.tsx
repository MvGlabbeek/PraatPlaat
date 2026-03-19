/**
 * Handgetekende SVG-figuren per elementtype.
 * Elke figuur simuleert een whiteboard-schets met:
 * - Grillige, onregelmatige paden (niet perfect recht)
 * - Dubbele lijnen voor "dikke stift" effect
 * - Organische vormen in plaats van blokjes
 */

// Helper: jitter een pad zodat het handgetekend oogt
function jitter(v: number, amount = 1.5): number {
  // Deterministisch op basis van positie — zodat re-renders stabiel zijn
  return v + (Math.sin(v * 13.7) * amount);
}

// Ruwe rechthoek met grillige randen
export function SketchRect({
  x = 0, y = 0, w = 120, h = 60,
  stroke = "#1a1a2e", fill = "rgba(255,255,252,0.85)", strokeWidth = 2.2
}: {
  x?: number; y?: number; w?: number; h?: number;
  stroke?: string; fill?: string; strokeWidth?: number;
}) {
  // Hoekpunten met kleine jitter
  const j = 2;
  const pts = [
    `M${x + jitter(0,j)},${y + jitter(j*2,j)}`,
    `L${x + w + jitter(w,j)},${y + jitter(0,j)}`,
    `L${x + w + jitter(w*0.5,j)},${y + h + jitter(h,j)}`,
    `L${x + jitter(0,j*1.5)},${y + h + jitter(h*0.7,j)}`,
    `Z`,
  ].join(" ");

  // Tweede lijn aan bovenkant voor "dubbele stift" effect
  const shadow = `M${x + jitter(0,1.2)},${y + jitter(j,1)} L${x + w + jitter(w*0.3,1)},${y + jitter(0,1.5)}`;

  return (
    <g>
      <path d={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <path d={shadow} fill="none" stroke={stroke} strokeWidth={0.6} opacity={0.3} strokeLinecap="round" />
    </g>
  );
}

// Geschetst poppetje (actor) — hoofd + lichaam + armen + benen
export function SketchPerson({
  cx = 60, cy = 40, size = 42, stroke = "#1a1a2e", fill = "none"
}: {
  cx?: number; cy?: number; size?: number; stroke?: string; fill?: string;
}) {
  const r = size * 0.22; // hoofd radius
  const bodyH = size * 0.35;
  const armW = size * 0.28;
  const legSpread = size * 0.2;
  const legH = size * 0.32;

  return (
    <g stroke={stroke} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* Hoofd */}
      <ellipse
        cx={cx + jitter(0, 0.8)} cy={cy - bodyH * 0.6 - r + jitter(0, 0.8)}
        rx={r + jitter(0, 0.5)} ry={r * 1.05 + jitter(0, 0.5)}
        fill="rgba(255,255,252,0.6)" stroke={stroke} strokeWidth={2}
      />
      {/* Lichaam */}
      <path
        d={`M${cx + jitter(0,1)},${cy - bodyH * 0.3 + jitter(0,1)} 
            L${cx + jitter(0.5,1.2)},${cy + bodyH * 0.35 + jitter(0,1.5)}`}
        strokeWidth={2.2}
      />
      {/* Armen */}
      <path
        d={`M${cx - armW + jitter(0,1.5)},${cy + jitter(0,2)} 
            L${cx + jitter(0,1)},${cy - bodyH * 0.1 + jitter(0,1.5)} 
            L${cx + armW + jitter(0,1.5)},${cy + jitter(0,2)}`}
        strokeWidth={2}
      />
      {/* Linker been */}
      <path
        d={`M${cx + jitter(0,1)},${cy + bodyH * 0.35 + jitter(0,1)} 
            L${cx - legSpread + jitter(0,2)},${cy + bodyH * 0.35 + legH + jitter(0,2)}`}
        strokeWidth={2.2}
      />
      {/* Rechter been */}
      <path
        d={`M${cx + jitter(0.3,1)},${cy + bodyH * 0.35 + jitter(0,1)} 
            L${cx + legSpread + jitter(0,2)},${cy + bodyH * 0.35 + legH + jitter(0,2)}`}
        strokeWidth={2.2}
      />
    </g>
  );
}

// Geschetste wolk/ballon (voor diensten en events)
export function SketchCloud({
  cx = 60, cy = 36, w = 90, h = 50, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const rx = w / 2;
  const ry = h / 2;
  // Ruwe ovale wolk met bumps bovenaan
  return (
    <g stroke={stroke} fill="rgba(255,253,240,0.9)" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${cx - rx + jitter(0, 2)},${cy + ry * 0.3 + jitter(0,1.5)}
           Q${cx - rx * 0.6 + jitter(0,2)},${cy - ry * 0.9 + jitter(0,2)} ${cx - rx * 0.1 + jitter(0,2)},${cy - ry + jitter(0,2)}
           Q${cx + rx * 0.2 + jitter(0,2)},${cy - ry * 1.15 + jitter(0,2)} ${cx + rx * 0.6 + jitter(0,2)},${cy - ry * 0.7 + jitter(0,2)}
           Q${cx + rx * 1.05 + jitter(0,2)},${cy - ry * 0.3 + jitter(0,2)} ${cx + rx + jitter(0,2)},${cy + ry * 0.25 + jitter(0,1.5)}
           Q${cx + rx * 0.8 + jitter(0,2)},${cy + ry + jitter(0,2)} ${cx + jitter(0,1.5)},${cy + ry * 0.95 + jitter(0,2)}
           Q${cx - rx * 0.7 + jitter(0,2)},${cy + ry * 1.05 + jitter(0,2)} ${cx - rx + jitter(0,2)},${cy + ry * 0.3 + jitter(0,1.5)}
           Z`}
      />
    </g>
  );
}

// Geschetste ruit/diamond (beslissing)
export function SketchDiamond({
  cx = 60, cy = 40, w = 110, h = 64, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  return (
    <g stroke={stroke} fill="rgba(255,240,240,0.88)" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${cx + jitter(0,1.5)},${cy - hh + jitter(0,2)}
           L${cx + hw + jitter(0,2)},${cy + jitter(0,1.5)}
           L${cx + jitter(0,1.5)},${cy + hh + jitter(0,2)}
           L${cx - hw + jitter(0,2)},${cy + jitter(0,1.5)}
           Z`}
      />
      {/* Schaduwlijn */}
      <path
        d={`M${cx + jitter(0,1)},${cy - hh + jitter(0,1)} L${cx + hw + jitter(0,1)},${cy + jitter(0,1)}`}
        strokeWidth={0.7} opacity={0.3} fill="none"
      />
    </g>
  );
}

// Geschetste cilinder (database / data)
export function SketchCylinder({
  cx = 60, cy = 40, w = 90, h = 54, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const rx = w / 2;
  const ry = h * 0.2;
  const bodyH = h * 0.62;
  return (
    <g stroke={stroke} fill="none" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Lichaam */}
      <path
        d={`M${cx - rx + jitter(0,1.5)},${cy - bodyH * 0.3 + jitter(0,1)}
           L${cx - rx + jitter(0,1.5)},${cy + bodyH * 0.7 + jitter(0,1.5)}
           Q${cx + jitter(0,1.5)},${cy + bodyH * 0.7 + ry * 1.8 + jitter(0,2)} ${cx + rx + jitter(0,1.5)},${cy + bodyH * 0.7 + jitter(0,1.5)}
           L${cx + rx + jitter(0,1.5)},${cy - bodyH * 0.3 + jitter(0,1)}`}
        fill="rgba(255,252,230,0.88)"
      />
      {/* Bovenste ellips (dicht) */}
      <ellipse cx={cx} cy={cy - bodyH * 0.3} rx={rx} ry={ry}
        fill="rgba(255,255,220,0.92)" stroke={stroke} strokeWidth={2.1}
      />
      {/* Onderste ellips (gestippeld, half zichtbaar) */}
      <path
        d={`M${cx - rx + jitter(0,1.5)},${cy + bodyH * 0.7 + jitter(0,1)}
           Q${cx},${cy + bodyH * 0.7 + ry * 1.8} ${cx + rx + jitter(0,1.5)},${cy + bodyH * 0.7 + jitter(0,1)}`}
        strokeDasharray="4 3"
        fill="none"
        strokeWidth={1.6}
        opacity={0.5}
      />
    </g>
  );
}

// Geschetst scherm/monitor (applicatie)
export function SketchMonitor({
  cx = 60, cy = 40, w = 100, h = 62, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  const screenH = h * 0.65;
  const screenW = w * 0.88;
  return (
    <g stroke={stroke} fill="none" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Scherm */}
      <path
        d={`M${cx - screenW/2 + jitter(0,1.5)},${cy - hh + jitter(0,1.5)}
           L${cx + screenW/2 + jitter(0,1.5)},${cy - hh + jitter(0,2)}
           L${cx + screenW/2 + jitter(0,1.5)},${cy - hh + screenH + jitter(0,1.5)}
           L${cx - screenW/2 + jitter(0,2)},${cy - hh + screenH + jitter(0,1.5)}
           Z`}
        fill="rgba(230,242,255,0.88)"
      />
      {/* Scherm detail (3 lijntjes) */}
      {[0.3, 0.5, 0.7].map((t, i) => (
        <line key={i}
          x1={cx - screenW*0.3} y1={cy - hh + screenH * t}
          x2={cx + screenW*0.3 + jitter(i,2)} y2={cy - hh + screenH * t + jitter(i,1)}
          strokeWidth={1} opacity={0.3}
        />
      ))}
      {/* Standaard */}
      <path
        d={`M${cx + jitter(0,1.5)},${cy - hh + screenH + jitter(0,1)}
           L${cx + jitter(0,2)},${cy + hh * 0.7 + jitter(0,2)}`}
        strokeWidth={2.2}
      />
      {/* Voet */}
      <path
        d={`M${cx - w*0.22 + jitter(0,2)},${cy + hh * 0.7 + jitter(0,1.5)}
           L${cx + w*0.22 + jitter(0,2)},${cy + hh * 0.7 + jitter(0,1.5)}`}
        strokeWidth={2.2}
      />
    </g>
  );
}

// Geschetste bliksem/pijl (event / transactie)
export function SketchLightning({
  cx = 60, cy = 40, size = 44, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; size?: number; stroke?: string;
}) {
  const h = size * 0.9;
  const w = size * 0.55;
  return (
    <g stroke={stroke} fill="rgba(255,247,200,0.9)" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${cx + w*0.15 + jitter(0,1.5)},${cy - h*0.5 + jitter(0,2)}
           L${cx - w*0.25 + jitter(0,1.5)},${cy + jitter(0,2)}
           L${cx + w*0.1 + jitter(0,1.5)},${cy + jitter(0,1.5)}
           L${cx - w*0.2 + jitter(0,2)},${cy + h*0.5 + jitter(0,2)}
           L${cx + w*0.35 + jitter(0,1.5)},${cy - jitter(0,2)}
           L${cx - w*0.1 + jitter(0,1.5)},${cy - jitter(0,1.5)}
           Z`}
      />
    </g>
  );
}

// Geschetste server rack (systeem / infrastructuur)
export function SketchServer({
  cx = 60, cy = 40, w = 88, h = 58, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  const slotH = h * 0.22;
  return (
    <g stroke={stroke} fill="none" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Omhulsel */}
      <path
        d={`M${cx - hw + jitter(0,1.5)},${cy - hh + jitter(0,1.5)}
           L${cx + hw + jitter(0,1.5)},${cy - hh + jitter(0,2)}
           L${cx + hw + jitter(0,1.5)},${cy + hh + jitter(0,1.5)}
           L${cx - hw + jitter(0,2)},${cy + hh + jitter(0,1.5)}
           Z`}
        fill="rgba(230,230,240,0.88)"
      />
      {/* 3 rack-slots */}
      {[-0.55, 0, 0.55].map((t, i) => (
        <g key={i}>
          <path
            d={`M${cx - hw * 0.82 + jitter(i,1.5)},${cy + hh * t * 0.88 - slotH*0.5 + jitter(i,1)}
               L${cx + hw * 0.82 + jitter(i,1.5)},${cy + hh * t * 0.88 - slotH*0.5 + jitter(i,1.5)}
               L${cx + hw * 0.82 + jitter(i,1.5)},${cy + hh * t * 0.88 + slotH*0.5 + jitter(i,1)}
               L${cx - hw * 0.82 + jitter(i,2)},${cy + hh * t * 0.88 + slotH*0.5 + jitter(i,1.5)} Z`}
            fill="rgba(200,200,220,0.5)"
            strokeWidth={1.4}
          />
          {/* Lampje */}
          <circle
            cx={cx + hw * 0.6 + jitter(i, 1)} cy={cy + hh * t * 0.88 + jitter(i, 1)}
            r={3}
            fill={i === 0 ? "rgba(100,220,100,0.7)" : "rgba(200,200,200,0.5)"}
            stroke={stroke} strokeWidth={1}
          />
        </g>
      ))}
    </g>
  );
}

// Geschetste pakket/doos (dienst)
export function SketchPackage({
  cx = 60, cy = 40, w = 88, h = 58, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const hw = w / 2;
  const hh = h / 2;
  const depth = w * 0.2;
  return (
    <g stroke={stroke} fill="none" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Voorkant */}
      <path
        d={`M${cx - hw + jitter(0,1.5)},${cy + jitter(0,1.5)}
           L${cx - hw + jitter(0,2)},${cy + hh + jitter(0,1.5)}
           L${cx + hw + jitter(0,1.5)},${cy + hh + jitter(0,2)}
           L${cx + hw + jitter(0,1.5)},${cy + jitter(0,1.5)}
           Z`}
        fill="rgba(255,248,220,0.9)"
      />
      {/* Bovenkant */}
      <path
        d={`M${cx - hw + jitter(0,1.5)},${cy + jitter(0,1.5)}
           L${cx - hw + depth + jitter(0,2)},${cy - hh + jitter(0,2)}
           L${cx + hw + depth + jitter(0,1.5)},${cy - hh + jitter(0,2)}
           L${cx + hw + jitter(0,1.5)},${cy + jitter(0,1.5)}
           Z`}
        fill="rgba(255,252,200,0.88)"
      />
      {/* Zijkant */}
      <path
        d={`M${cx + hw + jitter(0,1.5)},${cy + jitter(0,1.5)}
           L${cx + hw + depth + jitter(0,2)},${cy - hh + jitter(0,2)}
           L${cx + hw + depth + jitter(0,1.5)},${cy + hh - hh * 0.1 + jitter(0,2)}
           L${cx + hw + jitter(0,1.5)},${cy + hh + jitter(0,1.5)}
           Z`}
        fill="rgba(245,238,180,0.88)"
      />
      {/* Lint */}
      <path
        d={`M${cx + jitter(0,1.5)},${cy + jitter(0,1.5)} L${cx + jitter(0,1.5)},${cy + hh + jitter(0,1.5)}`}
        strokeWidth={1.4} strokeDasharray="none" opacity={0.5}
      />
    </g>
  );
}

// Geschetste pijl (transactie)
export function SketchArrow({
  cx = 60, cy = 40, w = 100, h = 50, stroke = "#1a1a2e"
}: {
  cx?: number; cy?: number; w?: number; h?: number; stroke?: string;
}) {
  const hw = w / 2;
  const hh = h * 0.38;
  const headW = w * 0.22;
  const headH = h * 0.44;
  return (
    <g stroke={stroke} fill="rgba(204,255,248,0.85)" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Pijllichaam */}
      <path
        d={`M${cx - hw + jitter(0,2)},${cy - hh*0.6 + jitter(0,1.5)}
           L${cx + hw*0.45 + jitter(0,2)},${cy - hh*0.6 + jitter(0,1.5)}
           L${cx + hw*0.45 + jitter(0,1.5)},${cy - headH + jitter(0,2)}
           L${cx + hw + jitter(0,2)},${cy + jitter(0,1.5)}
           L${cx + hw*0.45 + jitter(0,2)},${cy + headH + jitter(0,2)}
           L${cx + hw*0.45 + jitter(0,1.5)},${cy + hh*0.6 + jitter(0,1.5)}
           L${cx - hw + jitter(0,2)},${cy + hh*0.6 + jitter(0,1.5)}
           Z`}
      />
    </g>
  );
}


// Handgetekend radartje / tandwiel (proces)
export function SketchGear({
  cx = 60, cy = 40, size = 44, stroke = "#1a1a2e", fill = "rgba(220,255,220,0.88)"
}: {
  cx?: number; cy?: number; size?: number; stroke?: string; fill?: string;
}) {
  const r = size * 0.32;       // buitenstraal (zichtbaar deel tandwiel)
  const ri = size * 0.18;      // binnenstraal
  const rhole = size * 0.10;   // gatje in het midden
  const teeth = 8;             // aantal tanden

  // Bouw het tandwiel pad op met kleine jitter per punt
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const angle0 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const angle1 = angle0 + (0.32 / teeth) * Math.PI * 2;
    const angle2 = angle1 + (0.18 / teeth) * Math.PI * 2;
    const angle3 = angle2 + (0.32 / teeth) * Math.PI * 2;

    // Ingang tand (ri)
    const x0 = cx + (ri + jitter(ri * i * 0.3, 1.2)) * Math.cos(angle0);
    const y0 = cy + (ri + jitter(ri * i * 0.3, 1.2)) * Math.sin(angle0);
    // Eerste hoek tand (r)
    const x1 = cx + (r + jitter(r * i * 0.15, 1.0)) * Math.cos(angle1);
    const y1 = cy + (r + jitter(r * i * 0.15, 1.0)) * Math.sin(angle1);
    // Tweede hoek tand (r)
    const x2 = cx + (r + jitter(r * i * 0.12, 1.0)) * Math.cos(angle2);
    const y2 = cy + (r + jitter(r * i * 0.12, 1.0)) * Math.sin(angle2);
    // Uitgang tand (ri)
    const x3 = cx + (ri + jitter(ri * i * 0.2, 1.2)) * Math.cos(angle3);
    const y3 = cy + (ri + jitter(ri * i * 0.2, 1.2)) * Math.sin(angle3);

    if (i === 0) pts.push(`M${x0.toFixed(1)},${y0.toFixed(1)}`);
    else pts.push(`L${x0.toFixed(1)},${y0.toFixed(1)}`);
    pts.push(`L${x1.toFixed(1)},${y1.toFixed(1)}`);
    pts.push(`L${x2.toFixed(1)},${y2.toFixed(1)}`);
    pts.push(`L${x3.toFixed(1)},${y3.toFixed(1)}`);
  }
  pts.push("Z");

  const gearPath = pts.join(" ");

  // Tweede (schaduw-)lijn bovenaan voor handgetekend effect
  const shadowPts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const angle0 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const angle1 = angle0 + (0.32 / teeth) * Math.PI * 2;
    const x0 = cx + (ri + jitter(ri * i * 0.2, 0.6)) * Math.cos(angle0);
    const y0 = cy + (ri + jitter(ri * i * 0.2, 0.6)) * Math.sin(angle0);
    const x1 = cx + (r + jitter(r * i * 0.1, 0.6)) * Math.cos(angle1);
    const y1 = cy + (r + jitter(r * i * 0.1, 0.6)) * Math.sin(angle1);
    if (i === 0) shadowPts.push(`M${x0.toFixed(1)},${y0.toFixed(1)}`);
    else shadowPts.push(`L${x0.toFixed(1)},${y0.toFixed(1)}`);
    shadowPts.push(`L${x1.toFixed(1)},${y1.toFixed(1)}`);
  }

  return (
    <g stroke={stroke} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      {/* Tandwiel lichaam */}
      <path d={gearPath} fill={fill} />
      {/* Subtiele schaduwlijn */}
      <path d={shadowPts.join(" ")} fill="none" strokeWidth={0.7} opacity={0.25} />
      {/* Binnenste gat */}
      <circle
        cx={cx + jitter(0, 0.8)} cy={cy + jitter(0, 0.8)}
        r={rhole}
        fill="rgba(255,255,255,0.75)"
        stroke={stroke} strokeWidth={1.8}
      />
      {/* Klein kruisje in het midden */}
      <line
        x1={cx - rhole * 0.55} y1={cy + jitter(0, 0.5)}
        x2={cx + rhole * 0.55} y2={cy + jitter(0, 0.5)}
        strokeWidth={1.2} opacity={0.4}
      />
      <line
        x1={cx + jitter(0, 0.5)} y1={cy - rhole * 0.55}
        x2={cx + jitter(0, 0.5)} y2={cy + rhole * 0.55}
        strokeWidth={1.2} opacity={0.4}
      />
    </g>
  );
}

// Export mapping: elementtype → sketch component
export const SKETCH_FIGURES: Record<string, React.ComponentType<{
  cx?: number; cy?: number; w?: number; h?: number; size?: number; stroke?: string; fill?: string;
}>> = {
  actor:          SketchPerson,
  process:        SketchGear,
  application:    SketchMonitor,
  data:           SketchCylinder,
  transaction:    SketchArrow,
  system:         SketchServer,
  event:          SketchLightning,
  decision:       SketchDiamond,
  service:        SketchCloud,
  infrastructure: SketchServer,
};
