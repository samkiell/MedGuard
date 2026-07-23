import { NextResponse } from "next/server";
import { createHolonClient } from "@ontomorph/holon-client";

export const MOCK_MEDICATIONS = [
  { id: "mock-1", name: "Warfarin", code: "11289", dosage: "5 mg daily", date: "2026-07-20" },
  { id: "mock-2", name: "Aspirin", code: "1191", dosage: "81 mg daily", date: "2026-07-21" },
  { id: "mock-3", name: "Simvastatin", code: "36567", dosage: "20 mg daily", date: "2026-07-22" },
  { id: "mock-4", name: "Clarithromycin", code: "21212", dosage: "500 mg twice daily", date: "2026-07-23" },
];

export interface PlainLanguageInteraction {
  pair: [string, string];
  drugNames: [string, string];
  severity: "high" | "moderate" | "low" | "unknown";
  description: string;
  plainLanguageExplanation: string;
  mechanismOrAncestors?: string[];
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.HOLON_KEY;
    const useMockMeds = process.env.USE_MOCK_MEDS === "true";
    let medications: any[] = [];

    if (useMockMeds) {
      console.log("[USE_MOCK_MEDS=true] Using MOCK_MEDICATIONS directly:", MOCK_MEDICATIONS);
      medications = MOCK_MEDICATIONS;
    } else {
      const body = await req.json().catch(() => ({}));
      medications = body.medications || [];
    }

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return NextResponse.json({
        success: true,
        interactions: [],
        message: "Need at least 2 medications to check for interactions.",
      });
    }

    const drugCodes = medications
      .map((m: any) => m.code)
      .filter((code: string) => Boolean(code));

    console.log("[API /api/interactions/check] Extracting RxNorm Drug Codes:", drugCodes);

    let rawInteractions: any[] = [];
    let conceptDetailsMap: Record<string, any> = {};

    if (apiKey) {
      try {
        const apiUrl = process.env.HOLON_API_URL;
        const client = createHolonClient(apiUrl ? ({ apiKey, apiUrl } as any) : ({ apiKey } as any));
        
        // Step 1: interactions.checkList
        console.log("[HOLON Step 1] Calling client.interactions.checkList with drugCodes:", drugCodes);
        const numericIds = drugCodes.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
        const res: any = await client.interactions.checkList(numericIds as any).catch((err: any) => {
          console.warn("[HOLON checkList warning]:", err?.message || err);
          return null;
        });
        console.log("[HOLON Step 1 Output] Raw interactions returned from HOLON:", JSON.stringify(res, null, 2));

        if (res && res.interactions) {
          rawInteractions = res.interactions;
        } else if (res && res.pairs) {
          rawInteractions = res.pairs.flatMap((p: any) => p.interactions || []);
        }

        // Step 2: concepts.getByCode & concepts.getAncestors resolution
        for (const code of drugCodes) {
          try {
            console.log(`[HOLON Step 2] Resolving concept & ancestors for RxNorm code: ${code}`);
            const concept = await client.concepts.getByCode(code, "RxNorm").catch(() => null);
            const numId = parseInt(code, 10);
            const ancestors = !isNaN(numId) ? await client.concepts.getAncestors(numId).catch(() => null) : null;
            console.log(`[HOLON Step 2 Output - ${code}] Concept:`, JSON.stringify(concept, null, 2));
            console.log(`[HOLON Step 2 Output - ${code}] Ancestors:`, JSON.stringify(ancestors, null, 2));
            conceptDetailsMap[code] = { concept, ancestors };
          } catch (cErr: any) {
            console.warn(`[HOLON Step 2 Error - ${code}]:`, cErr?.message || cErr);
          }
        }
      } catch (clientErr: any) {
        console.warn("[HOLON API Client Error]:", clientErr.message);
      }
    } else {
      console.warn("[API /api/interactions/check] HOLON_KEY not present in environment variables.");
    }

    // Step 3: Process interactions into plain-language explanations
    let processedInteractions: PlainLanguageInteraction[] = [];

    if (rawInteractions.length > 0) {
      processedInteractions = rawInteractions.map((item: any) => {
        const pair0 = String(item.drugAConceptId || item.pair?.[0] || drugCodes[0]);
        const pair1 = String(item.drugBConceptId || item.pair?.[1] || drugCodes[1]);

        const med1 = medications.find((m) => m.code === pair0)?.name || item.drugAName || pair0;
        const med2 = medications.find((m) => m.code === pair1)?.name || item.drugBName || pair1;
        
        const concept1Obj = conceptDetailsMap[pair0]?.concept?.concept;
        const concept2Obj = conceptDetailsMap[pair1]?.concept?.concept;

        const ancestors1Obj = conceptDetailsMap[pair0]?.ancestors?.ancestors || [];
        const ancestors2Obj = conceptDetailsMap[pair1]?.ancestors?.ancestors || [];

        const ancestors1 = ancestors1Obj.map((a: any) => a.conceptName || a.name);
        const ancestors2 = ancestors2Obj.map((a: any) => a.conceptName || a.name);

        const desc = item.clinicalEffect || item.description || item.management;

        let explanation = desc || "";
        if (ancestors1.length > 0 || ancestors2.length > 0) {
          const class1 = ancestors1[0] ? ` (${ancestors1[0]})` : "";
          const class2 = ancestors2[0] ? ` (${ancestors2[0]})` : "";
          explanation = `Combining ${med1}${class1} and ${med2}${class2}: ${desc || "increases adverse clinical risk. Monitor patient closely."}`;
        } else {
          explanation = `Taking ${med1} together with ${med2} may lead to adverse effects: ${desc || "increased risk of side effects."}`;
        }

        return {
          pair: [pair0, pair1],
          drugNames: [med1, med2],
          severity: (item.severity || "moderate").toLowerCase() as any,
          description: desc || "Interaction detected.",
          plainLanguageExplanation: explanation,
          mechanismOrAncestors: [...ancestors1, ...ancestors2],
        };
      });
    }

    console.log("[HOLON Step 3 Output] Final Processed Plain-Language Interactions:", JSON.stringify(processedInteractions, null, 2));

    return NextResponse.json({
      success: true,
      interactions: processedInteractions,
    });
  } catch (error: any) {
    console.error("[API /api/interactions/check Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to perform interaction check",
        interactions: [],
      },
      { status: 500 }
    );
  }
}
