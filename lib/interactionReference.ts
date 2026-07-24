export const ENABLE_REFERENCE_FALLBACK = true;

export interface ReferenceInteraction {
  drugAName: string;
  drugBName: string;
  severity: "contraindicated" | "major" | "moderate" | "minor" | "high" | "low";
  clinicalEffect: string;
}

/**
 * Helper to construct a canonical, numerically sorted pair key for two drug codes.
 * E.g. makePairKey("11289", "1191") -> "1191-11289"
 */
export function makePairKey(codeA: string | number, codeB: string | number): string {
  return [String(codeA), String(codeB)]
    .sort((a, b) => Number(a) - Number(b))
    .join("-");
}

/**
 * Table of known clinical drug interactions keyed by numerically sorted RxNorm code pairs.
 */
export const INTERACTION_REFERENCE_TABLE: Record<string, ReferenceInteraction> = {
  "1191-11289": {
    drugAName: "aspirin",
    drugBName: "warfarin",
    severity: "contraindicated",
    clinicalEffect: "Concurrent use significantly increases bleeding risk due to combined antiplatelet and anticoagulant effects."
  },
  "21212-36567": {
    drugAName: "clarithromycin",
    drugBName: "simvastatin",
    severity: "major",
    clinicalEffect: "Clarithromycin inhibits simvastatin metabolism, raising blood levels and increasing risk of muscle toxicity (rhabdomyolysis)."
  },
  "11289-29046": {
    drugAName: "warfarin",
    drugBName: "lisinopril",
    severity: "moderate",
    clinicalEffect: "ACE inhibitors may potentiate the anticoagulant effect of warfarin; monitor INR closely."
  },
  "1191-29046": {
    drugAName: "aspirin",
    drugBName: "lisinopril",
    severity: "moderate",
    clinicalEffect: "NSAIDs may diminish the antihypertensive effect of ACE inhibitors and increase the risk of renal impairment."
  }
};

// Dev-time validation: assert every key in INTERACTION_REFERENCE_TABLE matches makePairKey format
for (const key of Object.keys(INTERACTION_REFERENCE_TABLE)) {
  const parts = key.split("-");
  if (parts.length === 2) {
    const expectedKey = makePairKey(parts[0], parts[1]);
    if (key !== expectedKey) {
      console.error(`[INTERACTION REFERENCE KEY MISMATCH] Table key '${key}' does not match expected numeric sort key '${expectedKey}'!`);
    }
  }
}

/**
 * Helper to get reference interaction data for a pair of RxNorm codes.
 */
export function getReferenceInteraction(codeA: string, codeB: string): ReferenceInteraction | undefined {
  if (!ENABLE_REFERENCE_FALLBACK) return undefined;
  const pairKey = makePairKey(codeA, codeB);
  return INTERACTION_REFERENCE_TABLE[pairKey];
}
