export const ENABLE_REFERENCE_FALLBACK = true;

export interface ReferenceInteraction {
  drugAName: string;
  drugBName: string;
  severity: "contraindicated" | "major" | "moderate" | "minor" | "high" | "low";
  clinicalEffect: string;
}

/**
 * Table of known clinical drug interactions keyed by sorted RxNorm code pairs (e.g. "1191-11289").
 * Code pairs must be sorted numerically/lexicographically to ensure consistent lookup.
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

/**
 * Helper to get reference interaction data for a pair of RxNorm codes.
 */
export function getReferenceInteraction(codeA: string, codeB: string): ReferenceInteraction | undefined {
  if (!ENABLE_REFERENCE_FALLBACK) return undefined;
  const sortedKey = [String(codeA), String(codeB)].sort().join("-");
  return INTERACTION_REFERENCE_TABLE[sortedKey];
}
