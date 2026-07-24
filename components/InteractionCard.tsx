import React from "react";
import { PlainLanguageInteraction } from "@/lib/types";
import { getSeverityTier } from "@/lib/helpers";

interface InteractionCardProps {
  interaction: PlainLanguageInteraction;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFlag: (interaction: PlainLanguageInteraction) => void;
  flagStatus?: { loading: boolean; success: boolean; message?: string };
}

export const InteractionCard: React.FC<InteractionCardProps> = ({
  interaction,
  isExpanded,
  onToggleExpand,
  onFlag,
  flagStatus,
}) => {
  const tier = getSeverityTier(interaction.severity);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-700">
      {/* Header Bar */}
      <div
        onClick={onToggleExpand}
        className="p-4 flex items-center justify-between cursor-pointer select-none border-b border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${tier.barColor}`} />
          <div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>
                {interaction.drugNames[0]} + {interaction.drugNames[1]}
              </span>
              {interaction.source === "reference" && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                  Ref Data
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Pair: {interaction.pair[0]} • {interaction.pair[1]}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
          >
            {tier.label}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-950/40 text-xs text-slate-300">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Clinical Explanation & Impact
            </div>
            <p className="leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-slate-200">
              {interaction.plainLanguageExplanation}
            </p>
          </div>

          {interaction.mechanismOrAncestors && interaction.mechanismOrAncestors.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Ontological Class / Ancestors
              </div>
              <div className="flex flex-wrap gap-1.5">
                {interaction.mechanismOrAncestors.map((anc, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    {anc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              Flagging writes an immutable risk record back to Digital Twin.
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlag(interaction);
              }}
              disabled={flagStatus?.loading || flagStatus?.success}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition flex items-center gap-1.5 ${
                flagStatus?.success
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default"
                  : flagStatus?.loading
                  ? "bg-slate-800 text-slate-400 border-slate-700 cursor-wait"
                  : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {flagStatus?.loading
                ? "Writing Flag..."
                : flagStatus?.success
                ? "✓ Flagged to Twin"
                : "🚩 Flag to Digital Twin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
