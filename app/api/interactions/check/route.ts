import { NextResponse } from "next/server";
import { createHolonClient } from "@ontomorph/holon-client";
import { getReferenceInteraction, ENABLE_REFERENCE_FALLBACK } from "@/lib/interactionReference";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface PlainLanguageInteraction {
  pair: [string, string];
  drugNames: [string, string];
  severity: "high" | "moderate" | "low" | "unknown";
  description: string;
  plainLanguageExplanation: string;
  mechanismOrAncestors?: string[];
  source?: "holon_live" | "reference";
}

export async function POST(req: Request) {
  console.log("==================================================================");
  console.log("[API /api/interactions/check] POST request handler hit at:", new Date().toISOString());

  try {
    const apiKey = process.env.HOLON_KEY;
    const body = await req.json().catch(() => ({}));
    const medications: any[] = body.medications || [];

    console.log("[API /api/interactions/check] Received medications payload:", JSON.stringify(medications, null, 2));

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      console.log("[API /api/interactions/check] Fewer than 2 medications provided. Returning empty interactions.");
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
    const codeToConceptIdMap: Record<string, number> = {};
    const conceptIdToCodeMap: Record<number, string> = {};

    if (apiKey) {
      try {
        const apiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";
        const client = createHolonClient({ apiKey, apiUrl } as any);
        
        // Step 1: Resolve conceptId and ancestors for each RxNorm code FIRST
        const holonConceptIds: number[] = [];
        const resolutionErrors: { code: string; reason: string }[] = [];

        for (const code of drugCodes) {
          try {
            console.log(`[HOLON Concept Resolution] Resolving concept & ancestors for RxNorm code: ${code}`);
            let conceptRes: any = null;
            let getByCodeError: any = null;

            try {
              conceptRes = await client.concepts.getByCode(code, "RxNorm");
            } catch (err: any) {
              getByCodeError = err;
            }

            const conceptObj = conceptRes?.concept;
            const cid = conceptObj?.conceptId;

            if (cid) {
              holonConceptIds.push(cid);
              codeToConceptIdMap[code] = cid;
              conceptIdToCodeMap[cid] = code;

              const ancestors = await client.concepts.getAncestors(cid).catch(() => null);
              conceptDetailsMap[code] = { concept: conceptRes, ancestors };
            } else {
              const reason = getByCodeError?.message || (conceptRes ? "conceptId missing in concept response" : "getByCode returned null/undefined");
              console.error(`[HOLON Concept Resolution Failed] RxNorm code '${code}' failed to resolve to conceptId. Reason: ${reason}`);
              resolutionErrors.push({ code, reason });
            }
          } catch (cErr: any) {
            const reason = cErr?.message || String(cErr);
            console.error(`[HOLON Concept Resolution Error] RxNorm code '${code}' failed to resolve. Reason: ${reason}`);
            resolutionErrors.push({ code, reason });
          }
        }

        if (resolutionErrors.length > 0) {
          console.error(`[HOLON checkList Aborted] ${resolutionErrors.length} RxNorm code(s) failed to resolve:`, resolutionErrors);
        } else {
          // Pass ONLY the array of resolved conceptIds into checkList(), never raw RxNorm codes
          const conceptIdsToQuery = holonConceptIds;
          console.log("[HOLON Step 1] Calling client.interactions.checkList with clean conceptIds:", conceptIdsToQuery);

          const res: any = await client.interactions.checkList(conceptIdsToQuery).catch((err: any) => {
            console.warn("[HOLON checkList warning]:", err?.message || err);
            return null;
          });
          console.log("[HOLON Step 1 Output] Raw interactions returned from HOLON for THIS request:", JSON.stringify(res, null, 2));

          if (res && res.interactions) {
            rawInteractions = res.interactions;
          } else if (res && res.pairs) {
            rawInteractions = res.pairs.flatMap((p: any) => p.interactions || []);
          }
        }
      } catch (clientErr: any) {
        console.warn("[HOLON API Client Error]:", clientErr.message);
      }
    } else {
      console.warn("[API /api/interactions/check] HOLON_KEY not present in environment variables.");
    }

    // Step 2: Process interactions into plain-language explanations
    let processedInteractions: PlainLanguageInteraction[] = [];

    if (rawInteractions.length > 0) {
      processedInteractions = rawInteractions.map((item: any) => {
        const cidA = Number(item.pair?.[0] || item.drugAConceptId);
        const cidB = Number(item.pair?.[1] || item.drugBConceptId);

        const codeA = item.drugACode || conceptIdToCodeMap[cidA] || String(cidA);
        const codeB = item.drugBCode || conceptIdToCodeMap[cidB] || String(cidB);

        const med1 = medications.find((m) => String(m.code) === codeA || codeToConceptIdMap[m.code] === cidA)?.name || item.drugAName || codeA;
        const med2 = medications.find((m) => String(m.code) === codeB || codeToConceptIdMap[m.code] === cidB)?.name || item.drugBName || codeB;
        
        const ancestors1Obj = (conceptDetailsMap[codeA] || conceptDetailsMap[cidA])?.ancestors?.ancestors || [];
        const ancestors2Obj = (conceptDetailsMap[codeB] || conceptDetailsMap[cidB])?.ancestors?.ancestors || [];

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
          pair: [codeA, codeB],
          drugNames: [med1, med2],
          severity: item.severity === "contraindicated" ? "high" : ((item.severity || "moderate").toLowerCase() as any),
          description: desc || "Interaction detected.",
          plainLanguageExplanation: explanation,
          mechanismOrAncestors: [...ancestors1, ...ancestors2],
          source: "holon_live",
        };
      });
    }

    // Step 3: Reference Layer Fallback (used for any pair where HOLON returned no interaction)
    if (ENABLE_REFERENCE_FALLBACK) {
      const holonLivePairs = new Set(
        processedInteractions.map((item) => [String(item.pair[0]), String(item.pair[1])].sort().join("-"))
      );

      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const codeA = String(medications[i].code);
          const codeB = String(medications[j].code);
          if (!codeA || !codeB) continue;

          const pairKey = [codeA, codeB].sort().join("-");

          if (!holonLivePairs.has(pairKey)) {
            const refData = getReferenceInteraction(codeA, codeB);
            if (refData) {
              console.log(`[API /api/interactions/check] HOLON returned 0 interactions for pair ${pairKey}. Using reference table fallback.`);
              const med1Name = medications[i].name || refData.drugAName;
              const med2Name = medications[j].name || refData.drugBName;

              let severity: "high" | "moderate" | "low" | "unknown" = "moderate";
              if (refData.severity === "contraindicated" || refData.severity === "major" || refData.severity === "high") {
                severity = "high";
              } else if (refData.severity === "moderate") {
                severity = "moderate";
              } else if (refData.severity === "minor" || refData.severity === "low") {
                severity = "low";
              }

              processedInteractions.push({
                pair: [codeA, codeB],
                drugNames: [med1Name, med2Name],
                severity,
                description: refData.clinicalEffect,
                plainLanguageExplanation: `Taking ${med1Name} together with ${med2Name} may lead to adverse effects: ${refData.clinicalEffect}`,
                source: "reference",
              });
            }
          }
        }
      }
    }

    console.log("[HOLON Step 2 Output] Final Processed Plain-Language Interactions:", JSON.stringify(processedInteractions, null, 2));

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

    console.log("[HOLON Step 2 Output] Final Processed Plain-Language Interactions:", JSON.stringify(processedInteractions, null, 2));

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

