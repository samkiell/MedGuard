export interface Medication {
  id: string;
  name: string;
  code: string;
  dosage?: string;
  date?: string;
}

export type SeverityLevel = "high" | "moderate" | "low" | "unknown" | "severe" | "mild";

export interface PlainLanguageInteraction {
  pair: [string, string];
  drugNames: [string, string];
  severity: SeverityLevel;
  description: string;
  plainLanguageExplanation: string;
  mechanismOrAncestors?: string[];
  source?: "holon_live" | "reference";
}

export interface FlagStatusItem {
  loading: boolean;
  success: boolean;
  message?: string;
}

export type FlagStatusMap = Record<string, FlagStatusItem>;
