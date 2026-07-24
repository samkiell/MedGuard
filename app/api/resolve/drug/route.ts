import { NextResponse } from "next/server";
import { createHolonClient } from "@ontomorph/holon-client";
import { VocabularyId } from "@ontomorph/holon-types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Drug name parameter is required." },
        { status: 400 }
      );
    }

    // 1. Call RxNav's findRxcuiByString endpoint
    const rxNavUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=2`;
    const rxNavRes = await fetch(rxNavUrl);
    if (!rxNavRes.ok) {
      return NextResponse.json(
        { error: `RxNav lookup failed with status ${rxNavRes.status}` },
        { status: 502 }
      );
    }

    const rxNavData = await rxNavRes.json();
    const rxnormIds: string[] = rxNavData?.idGroup?.rxnormId || [];

    if (!rxnormIds || rxnormIds.length === 0) {
      return NextResponse.json(
        { error: `No RxNorm match found for '${name}'` },
        { status: 404 }
      );
    }

    const rxcui = rxnormIds[0];
    const apiKey = process.env.HOLON_KEY;
    const apiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";

    let holonCode: string | null = null;
    let resolvedName: string = name;
    let holonMappingFailed = false;

    if (apiKey) {
      try {
        const client = createHolonClient({ apiKey, apiUrl } as any);
        // Call HOLON's mappings/translate with VocabularyId.RXNORM ("RxNorm") as source
        const translation: any = await client.mappings.translate(rxcui, VocabularyId.RXNORM).catch((err: any) => {
          console.warn(`[HOLON translate warning for RXCUI ${rxcui}]:`, err?.message || err);
          return null;
        });

        if (translation && translation.target) {
          holonCode = translation.target;
        } else if (translation && Array.isArray(translation.mappings) && translation.mappings.length > 0) {
          holonCode = translation.mappings[0].targetConceptCode || String(translation.mappings[0].targetConceptId);
          resolvedName = translation.mappings[0].targetConceptName || resolvedName;
        } else {
          holonMappingFailed = true;
        }
      } catch (err: any) {
        console.warn(`[HOLON translate error for RXCUI ${rxcui}]:`, err?.message || err);
        holonMappingFailed = true;
      }
    } else {
      holonMappingFailed = true;
    }

    const result: any = {
      inputName: name,
      rxcui,
      holonCode: holonCode || rxcui,
      resolvedName,
    };

    if (holonMappingFailed) {
      result.holonMappingFailed = true;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /api/resolve/drug Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
