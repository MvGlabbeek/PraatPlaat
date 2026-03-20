import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Je bent een expert in het analyseren van Nederlandse teksten en het vertalen ervan naar een architectuurdiagram (praatplaat). Je ontvangt een tekst (e-mail, procesbeschrijving, notitie, etc.) en extraheert:

1. **Elementen** met hun type:
   - actor: personen, rollen, afdelingen, organisaties
   - process: werkwoorden/activiteiten, procedures, workflows
   - application: systemen, software, portalen, platforms, databases
   - data: documenten, dossiers, formulieren, rapporten, gegevens
   - service: diensten, producten, voorzieningen
   - event: gebeurtenissen, triggers, meldingen, signalen
   - decision: beslissingen, keuzes, goedkeuringen, afwijzingen
   - system: technische systemen, servers, infrastructuur
   - transaction: transacties, betalingen, overdrachten
   - infrastructure: netwerken, hardware, fysieke middelen

2. **Relaties** tussen elementen met type:
   - uses: element A gebruikt element B
   - triggers: element A triggert element B
   - flows: data/informatie stroomt van A naar B
   - association: element A is geassocieerd met B
   - assignment: element A is toegewezen aan B
   - access: element A heeft toegang tot B
   - influence: element A beinvloedt B
   - realization: element A realiseert B
   - composition: element A is onderdeel van B
   - aggregation: element A is een aggregaat van B

Analyseer de tekst grondig. Identificeer ALLE relevante elementen en relaties. Wees creatief in het herkennen van impliciete relaties.

Antwoord UITSLUITEND in JSON-formaat:
{
  "elements": [
    { "label": "Naam", "type": "actor|process|application|data|...", "description": "korte beschrijving" }
  ],
  "relations": [
    { "sourceLabel": "Van element", "targetLabel": "Naar element", "type": "uses|triggers|flows|...", "label": "beschrijving van de relatie" }
  ],
  "summary": "Korte samenvatting van de analyse in het Nederlands",
  "confidence": "hoog|gemiddeld|laag"
}`;

interface AnalysisRequest {
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text }: AnalysisRequest = await req.json();

    if (!text || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Tekst te kort. Minimaal 20 tekens vereist." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "AI service niet geconfigureerd." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyseer de volgende tekst en extraheer alle elementen en relaties voor een praatplaat:\n\n${text}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Kon geen geldig antwoord van AI krijgen." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Analyse mislukt: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
