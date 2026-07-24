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
    <div className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl overflow-hidden shadow-lg transition-all duration-200">
      {/* Visual Header Bar */}
      <div
        onClick={onToggleExpand}
        className="p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${tier.barColor} shadow-md`} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2.5 flex-wrap">
              <span>{interaction.drugNames[0]}</span>
              <span className="text-slate-500 font-normal">↔</span>
              <span>{interaction.drugNames[1]}</span>
              {interaction.source === "reference" && (
                <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                  Reference Dataset
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>RxNorm Pair: [{interaction.pair[0]}, {interaction.pair[1]}]</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-sm ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
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

      {/* Visual Mechanism Relationship Connector Diagram */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-300 font-medium">{interaction.drugNames[0]}</span>
          <span className="text-slate-600">────⚡────</span>
          <span className={`font-semibold ${tier.textColor}`}>Interaction Cascade</span>
          <span className="text-slate-600">────⚡────</span>
          <span className="text-slate-300 font-medium">{interaction.drugNames[1]}</span>
        </div>
        <span className="text-slate-500 text-[10px]">HOLON Concept Node</span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-slate-950/60 text-xs text-slate-300">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Clinical Explanation & Mechanism</span>
            </div>
            <p className="leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 text-slate-200 shadow-inner">
              {interaction.plainLanguageExplanation}
            </p>
          </div>

          {interaction.mechanismOrAncestors && interaction.mechanismOrAncestors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ontological Drug Classes & Ancestor Nodes
              </div>
              <div className="flex flex-wrap gap-2">
                {interaction.mechanismOrAncestors.map((anc, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-slate-900/90 text-sky-300 px-3 py-1 rounded-lg border border-sky-500/20 font-medium shadow-sm"
                  >
                    {anc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              Flagging writes an immutable clinical safety event directly to Digital Twin.
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlag(interaction);
              }}
              disabled={flagStatus?.loading || flagStatus?.success}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-md flex items-center gap-2 ${
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
          </div>
        </div>
      )}
    </div>
  );
};
