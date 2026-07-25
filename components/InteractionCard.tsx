import React, { useState } from "react";
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
  const [confirmingFlag, setConfirmingFlag] = useState(false);

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingFlag) {
      setConfirmingFlag(true);
      return;
    }
    setConfirmingFlag(false);
    onFlag(interaction);
  };

  const handleCancelFlag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingFlag(false);
  };

  return (
    <div
      className={`group relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 border-l-4 ${tier.borderColor}`}
    >
      {/* Header Row */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex items-start sm:items-center justify-between cursor-pointer select-none bg-slate-900/40 hover:bg-slate-800/40 transition gap-3"
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 mt-1 sm:mt-0 shrink-0">
            <span className={`h-2.5 w-2.5 rounded-full ${tier.barColor} shadow-md`} />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
              <span>{interaction.drugNames[0]}</span>
              <span className="text-slate-500 font-normal">↔</span>
              <span>{interaction.drugNames[1]}</span>
              {interaction.source === "reference" && (
                <span className="text-[9px] sm:text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                  Ref Dataset
                </span>
              )}
            </div>
            <div
              className="text-[11px] sm:text-xs text-slate-500 font-mono mt-1 sm:mt-0.5"
              title={`RxNorm Pair: [${interaction.pair[0]}, ${interaction.pair[1]}]`}
            >
              RxNorm: {interaction.pair[0]} · {interaction.pair[1]}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full border shadow-sm ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
          >
            {tier.label}
          </span>
          <div className="h-7 w-7 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-slate-200 transition">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 bg-slate-950/60 text-xs text-slate-300 border-t border-slate-800/50">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Clinical Explanation &amp; Mechanism</span>
            </div>
            <p className="leading-relaxed bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 text-slate-200 shadow-inner text-xs sm:text-sm">
              {interaction.plainLanguageExplanation}
            </p>
          </div>

          {interaction.mechanismOrAncestors && interaction.mechanismOrAncestors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ontological Drug Classes &amp; Ancestor Nodes
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {interaction.mechanismOrAncestors.map((anc, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] sm:text-[11px] bg-slate-900/90 text-sky-300 px-2.5 py-1 rounded-lg border border-sky-500/20 font-medium shadow-sm"
                  >
                    {anc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flag Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              Flagging writes an immutable clinical safety event to the Digital Twin.
            </span>

            {confirmingFlag && !flagStatus?.success && !flagStatus?.loading ? (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-[11px] text-amber-300 font-medium shrink-0">
                  Confirm immutable write?
                </span>
                <button
                  onClick={handleCancelFlag}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagClick}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white border border-red-500 transition shadow-md"
                >
                  Confirm Flag
                </button>
              </div>
            ) : (
              <button
                onClick={handleFlagClick}
                disabled={flagStatus?.loading || flagStatus?.success}
                className={`w-full sm:w-auto justify-center px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-md flex items-center gap-2 ${
                  flagStatus?.success
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-default"
                    : flagStatus?.loading
                    ? "bg-slate-800 text-slate-400 border-slate-700 cursor-wait animate-pulse"
                    : "bg-gradient-to-r from-red-600/20 to-amber-600/20 hover:from-red-600/30 hover:to-amber-600/30 text-red-300 border-red-500/40"
                }`}
              >
                {flagStatus?.loading
                  ? "Writing Flag..."
                  : flagStatus?.success
                  ? "✓ Flagged to Digital Twin"
                  : "🚩 Flag Risk to Digital Twin"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
