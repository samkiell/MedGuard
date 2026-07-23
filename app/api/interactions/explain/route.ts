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
    const concept1: any = await client.concepts.getByCode(targetPair[0], "RxNorm").catch(() => null);
    const concept2: any = await client.concepts.getByCode(targetPair[1], "RxNorm").catch(() => null);
    
    const numId0 = parseInt(targetPair[0], 10);
    const numId1 = parseInt(targetPair[1], 10);

    const ancestors1: any = !isNaN(numId0) ? await client.concepts.getAncestors(numId0).catch(() => null) : null;
    const ancestors2: any = !isNaN(numId1) ? await client.concepts.getAncestors(numId1).catch(() => null) : null;

    // interactions check for specific pair
    const res: any = !isNaN(numId0) && !isNaN(numId1)
      ? await client.interactions.checkList([numId0, numId1]).catch(() => null)
      : null;
      
    const rawInteraction = res?.pairs?.[0]?.interactions?.[0] || res?.interactions?.[0];

    const med1Name = medications.find((m) => m.code === targetPair[0])?.name || concept1?.concept?.conceptName || targetPair[0];
    const med2Name = medications.find((m) => m.code === targetPair[1])?.name || concept2?.concept?.conceptName || targetPair[1];

    const anc1List = ancestors1?.ancestors || [];
    const anc2List = ancestors2?.ancestors || [];

    const class1 = anc1List[0]?.conceptName ? ` (${anc1List[0].conceptName})` : "";
    const class2 = anc2List[0]?.conceptName ? ` (${anc2List[0].conceptName})` : "";

    const clinicalEffect = rawInteraction?.clinicalEffect || rawInteraction?.description;
    const explanation = `Combining ${med1Name}${class1} and ${med2Name}${class2}: ${
      clinicalEffect || "increases risk of adverse pharmacological interactions and toxicity. Monitor patient closely."
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
        description: clinicalEffect || "Interaction detected.",
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
