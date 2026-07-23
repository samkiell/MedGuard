/**
 * Reference layer for clinical drug interactions.
 * Used ONLY as a fallback when HOLON live API returns 0 interactions for a known pair.
 * 
 * To disable this fallback completely, set ENABLE_REFERENCE_FALLBACK to false.
 */

export const ENABLE_REFERENCE_FALLBACK = true;

export interface ReferenceInteractionItem {
  drugAName: string;
  drugBName: string;
  severity: "high" | "moderate" | "low";
  clinicalEffect: string;
  explanation: string;
  ancestors?: string[];
}

// Key format: sorted RxNorm codes joined by hyphen e.g. "1191-11289"
export const REFERENCE_INTERACTIONS_MAP: Record<string, ReferenceInteractionItem> = {
  "1191-11289": {
    drugAName: "Aspirin",
    drugBName: "Warfarin",
    severity: "high",
    clinicalEffect: "Concurrent use significantly increases gastrointestinal bleeding and hemorrhage risk.",
    explanation: "Combining Aspirin (NSAID/Antiplatelet) and Warfarin (Anticoagulant): Concurrent use significantly increases gastrointestinal bleeding and hemorrhage risk due to dual inhibition of hemostasis.",
    ancestors: ["Antiplatelet Agent", "Anticoagulant"]
  },
  "21212-36567": {
    drugAName: "Clarithromycin",
    drugBName: "Simvastatin",
    severity: "high",
    clinicalEffect: "Clarithromycin significantly increases simvastatin plasma concentrations, raising risk of rhabdomyolysis and acute renal failure.",
    explanation: "Combining Clarithromycin (Macrolide Antibiotic) and Simvastatin (HMG-CoA Reductase Inhibitor): Clarithromycin significantly increases simvastatin plasma concentrations, raising risk of rhabdomyolysis and acute renal failure.",
    ancestors: ["Macrolide Antibiotic", "Statins"]
  },
  "20352-29046": {
    drugAName: "Potassium Chloride",
    drugBName: "Lisinopril",
    severity: "moderate",
    clinicalEffect: "ACE inhibitors reduce aldosterone secretion, decreasing renal potassium excretion and increasing risk of severe hyperkalemia.",
    explanation: "Combining Lisinopril (ACE Inhibitor) and Potassium Chloride: ACE inhibitors reduce aldosterone secretion, decreasing renal potassium excretion and increasing risk of severe hyperkalemia.",
    ancestors: ["ACE Inhibitor", "Electrolyte Supplement"]
  },
  "1191-6809": {
    drugAName: "Aspirin",
    drugBName: "Metoprolol",
    severity: "low",
    clinicalEffect: "NSAIDs may diminish the antihypertensive effect of beta-blockers by inhibiting renal prostaglandin synthesis.",
    explanation: "Combining Aspirin and Metoprolol: NSAIDs may diminish the antihypertensive effect of beta-blockers by inhibiting renal prostaglandin synthesis.",
    ancestors: ["NSAID", "Beta-Adrenergic Blocker"]
  }
};

/**
 * Checks a list of RxNorm codes against the local reference table.
 * Returns reference interaction objects for any matched pairs.
 */
export function checkReferenceFallback(drugCodes: string[]): Array<{
  pair: [string, string];
  item: ReferenceInteractionItem;
}> {
  if (!ENABLE_REFERENCE_FALLBACK || drugCodes.length < 2) {
    return [];
  }

  const results: Array<{ pair: [string, string]; item: ReferenceInteractionItem }> = [];

  for (let i = 0; i < drugCodes.length; i++) {
    for (let j = i + 1; j < drugCodes.length; j++) {
      const codeA = drugCodes[i];
      const codeB = drugCodes[j];
      const sortedPairKey = [codeA, codeB].sort().join("-");
      const matched = REFERENCE_INTERACTIONS_MAP[sortedPairKey];

      if (matched) {
        results.push({
          pair: [codeA, codeB],
          item: matched
        });
      }
    }
  }

  return results;
}
