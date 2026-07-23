import { NextResponse } from "next/server";
import { createHolonClient } from "@ontomorph/holon-client";
import { MOCK_MEDICATIONS } from "../check/route";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.HOLON_KEY;
    const useMockMeds = process.env.USE_MOCK_MEDS === "true";
    let medications: any[] = [];

    if (useMockMeds) {
      console.log("[/api/interactions/explain] USE_MOCK_MEDS=true flag set, using MOCK_MEDICATIONS");
      medications = MOCK_MEDICATIONS;
    } else {
      const body = await req.json().catch(() => ({}));
      medications = body.medications || [];
    }

    const { pair } = await req.json().catch(() => ({ pair: null }));
    const targetPair = pair || (medications.length >= 2 ? [medications[0].code, medications[1].code] : null);

    if (!targetPair || !Array.isArray(targetPair) || targetPair.length < 2) {
      return NextResponse.json({
        success: false,
        error: "Target interaction pair [code1, code2] is required.",
      });
    }

    console.log("[/api/interactions/explain] Target pair for explanation:", targetPair);

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HOLON_KEY missing in environment.",
      });
    }

    const apiUrl = process.env.HOLON_API_URL;
    const client = createHolonClient(apiUrl ? ({ apiKey, apiUrl } as any) : ({ apiKey } as any));

    // concepts.getByCode resolution
    console.log(`[HOLON explain] Fetching concepts for codes: ${targetPair[0]}, ${targetPair[1]}`);
    const concept1 = await client.concepts.getByCode({ code: targetPair[0] }).catch(() => null);
    const concept2 = await client.concepts.getByCode({ code: targetPair[1] }).catch(() => null);
    
    const ancestors1 = await client.concepts.getAncestors({ code: targetPair[0] }).catch(() => []);
    const ancestors2 = await client.concepts.getAncestors({ code: targetPair[1] }).catch(() => []);

    // interactions check for specific pair
    const res = await client.interactions.checkList({ drugCodes: targetPair }).catch(() => null);
    const rawInteraction = res?.interactions?.[0];

    const med1Name = medications.find((m) => m.code === targetPair[0])?.name || concept1?.name || targetPair[0];
    const med2Name = medications.find((m) => m.code === targetPair[1])?.name || concept2?.name || targetPair[1];

    const class1 = ancestors1?.[0]?.name ? ` (${ancestors1[0].name})` : "";
    const class2 = ancestors2?.[0]?.name ? ` (${ancestors2[0].name})` : "";

    const explanation = `Combining ${med1Name}${class1} and ${med2Name}${class2}: ${
      rawInteraction?.description || "increases risk of adverse pharmacological interactions and toxicity. Monitor patient closely."
    }`;

    console.log("[/api/interactions/explain Output]:", {
      pair: targetPair,
      drugNames: [med1Name, med2Name],
      explanation,
    });

    return NextResponse.json({
      success: true,
      explanation: {
        pair: targetPair,
        drugNames: [med1Name, med2Name],
        severity: rawInteraction?.severity || "high",
        description: rawInteraction?.description || "Interaction detected.",
        plainLanguageExplanation: explanation,
        concepts: { concept1, concept2 },
        ancestors: { ancestors1, ancestors2 },
      },
    });
  } catch (error: any) {
    console.error("[/api/interactions/explain Error]:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to generate explanation" }, { status: 500 });
  }
}
