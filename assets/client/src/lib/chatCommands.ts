import type { CanvasElement, CanvasRelation } from "@shared/schema";

interface ChatResult {
  reply: string;
  operations?: any[];
}

export function processChatCommand(
  message: string,
  currentData: { elements: CanvasElement[]; relations: CanvasRelation[] },
): ChatResult {
  const msg = message.toLowerCase();
  const ops: any[] = [];

  const actorMatch =
    msg.match(/voeg\s+(?:een\s+)?actor\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?actor\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+actor\s+['"]?([^'"]+?)['"]?/i);
  const processMatch =
    msg.match(/voeg\s+(?:een\s+)?proces\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?proces\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+process\s+['"]?([^'"]+?)['"]?/i);
  const appMatch =
    msg.match(/voeg\s+(?:een\s+)?applicatie\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?applicatie\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+application\s+['"]?([^'"]+?)['"]?/i);
  const dataMatch =
    msg.match(/voeg\s+(?:een?\s+)?(?:data|gegeven)\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een?\s+)?(?:data|gegeven)\s+['"]?([^'"]+?)['"]?/i);
  const systemMatch =
    msg.match(/voeg\s+(?:een\s+)?systeem\s+['"]?([^'"]+?)['"]?\s+toe/i) ||
    msg.match(/maak\s+(?:een\s+)?systeem\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/add\s+system\s+['"]?([^'"]+?)['"]?/i);

  const deleteMatch =
    msg.match(/verwijder\s+['"]?([^'"]+?)['"]?(?:\s+van\s+de\s+praatplaat)?$/i) ||
    msg.match(/delete\s+['"]?([^'"]+?)['"]?/i);

  const connectMatch =
    msg.match(/verbind\s+['"]?([^'"]+?)['"]?\s+met\s+['"]?([^'"]+?)['"]?/i) ||
    msg.match(/connect\s+['"]?([^'"]+?)['"]?\s+(?:to|with)\s+['"]?([^'"]+?)['"]?/i);

  const clearMatch = msg.match(
    /leeg\s+de\s+praatplaat|verwijder\s+alles|wis\s+alles|clear\s+all/i,
  );

  if (clearMatch) {
    ops.push({ type: "CLEAR_ALL" });
    return { reply: "Ik heb de praatplaat leeggemaakt.", operations: ops };
  }

  if (deleteMatch) {
    const label = deleteMatch[1].trim();
    const found = currentData.elements.find(
      (e) => e.label.toLowerCase() === label.toLowerCase(),
    );
    if (found) {
      ops.push({ type: "DELETE_ELEMENT", id: found.id });
      return {
        reply: `Ik heb "${found.label}" verwijderd van de praatplaat.`,
        operations: ops,
      };
    }
    return {
      reply: `Ik kon "${label}" niet vinden op de praatplaat. Controleer de naam.`,
    };
  }

  if (connectMatch) {
    const fromLabel = connectMatch[1].trim();
    const toLabel = connectMatch[2].trim();
    const from = currentData.elements.find((e) =>
      e.label.toLowerCase().includes(fromLabel.toLowerCase()),
    );
    const to = currentData.elements.find((e) =>
      e.label.toLowerCase().includes(toLabel.toLowerCase()),
    );
    if (from && to) {
      ops.push({
        type: "ADD_RELATION",
        relation: {
          id: `r_${Date.now()}`,
          sourceId: from.id,
          targetId: to.id,
          type: "association",
          label: "",
        },
      });
      return {
        reply: `Ik heb een relatie aangelegd tussen "${from.label}" en "${to.label}".`,
        operations: ops,
      };
    }
    return {
      reply: `Ik kon de opgegeven elementen niet vinden. Zijn "${fromLabel}" en "${toLabel}" al op de praatplaat?`,
    };
  }

  let matched = false;
  const typeMap: Record<string, string> = {
    actor: actorMatch?.[1] ?? "",
    process: processMatch?.[1] ?? "",
    application: appMatch?.[1] ?? "",
    data: dataMatch?.[1] ?? "",
    system: systemMatch?.[1] ?? "",
  };

  for (const [elemType, label] of Object.entries(typeMap)) {
    if (label) {
      const existingCount = currentData.elements.filter(
        (e) => e.type === elemType,
      ).length;
      const col = Math.floor(existingCount % 4);
      const row = Math.floor(existingCount / 4);
      ops.push({
        type: "ADD_ELEMENT",
        element: {
          id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: elemType,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          position: { x: 80 + col * 220, y: 80 + row * 200 },
          style: "corporate",
          description: "",
        },
      });
      matched = true;
    }
  }

  if (matched) {
    const addedLabels = ops.map((o) => `"${o.element?.label}"`).join(", ");
    return {
      reply: `Ik heb ${addedLabels} toegevoegd aan de praatplaat.`,
      operations: ops,
    };
  }

  return {
    reply: `Ik begreep je opdracht niet helemaal. Probeer bijvoorbeeld:\n- "Voeg een actor 'Klant' toe"\n- "Maak een applicatie 'CRM Systeem'"\n- "Voeg een proces 'Facturering' toe"\n- "Verbind 'Klant' met 'Digitaal Loket'"\n- "Verwijder 'Behandelaar'"\n- "Leeg de praatplaat"`,
  };
}
