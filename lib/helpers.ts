import { PlainLanguageInteraction, SeverityLevel } from "@/lib/types";

export interface SeverityTier {
  label: string;
  barColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textColor: string;
  glowColor: string;
}

export function getSeverityTier(severity: SeverityLevel | string): SeverityTier {
  const s = (severity || "").toLowerCase();
  if (s === "high" || s === "severe") {
    return {
      label: "Severe Risk",
      barColor: "bg-red-500",
      borderColor: "border-l-red-500",
      badgeBg: "bg-red-500/15",
      badgeText: "text-red-300",
      badgeBorder: "border-red-500/30",
      textColor: "text-red-400",
      glowColor: "shadow-red-500/20",
    };
  } else if (s === "moderate") {
    return {
      label: "Moderate Risk",
      barColor: "bg-amber-500",
      borderColor: "border-l-amber-500",
      badgeBg: "bg-amber-500/15",
      badgeText: "text-amber-300",
      badgeBorder: "border-amber-500/30",
      textColor: "text-amber-400",
      glowColor: "shadow-amber-500/20",
    };
  } else {
    return {
      label: "Mild Risk",
      barColor: "bg-emerald-500",
      borderColor: "border-l-emerald-500",
      badgeBg: "bg-emerald-500/15",
      badgeText: "text-emerald-300",
      badgeBorder: "border-emerald-500/30",
      textColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/20",
    };
  }
}

// In-memory response cache for interaction check queries
const checkCache = new Map<string, PlainLanguageInteraction[]>();

export function getCachedInteractions(medCodes: string[]): PlainLanguageInteraction[] | null {
  const key = [...medCodes].sort().join(",");
  return checkCache.get(key) || null;
}

export function setCachedInteractions(medCodes: string[], interactions: PlainLanguageInteraction[]): void {
  const key = [...medCodes].sort().join(",");
  checkCache.set(key, interactions);
}
