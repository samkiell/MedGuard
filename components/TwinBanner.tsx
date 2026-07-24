import React from "react";
import { PlainLanguageInteraction } from "@/lib/types";

interface TwinBannerProps {
  medCount: number;
  interactions: PlainLanguageInteraction[];
}

export const TwinBanner: React.FC<TwinBannerProps> = ({ medCount, interactions }) => {
  const severeCount = interactions.filter(
    (i) => i.severity === "high" || i.severity === "severe"
  ).length;
  const moderateCount = interactions.filter((i) => i.severity === "moderate").length;
  const mildCount = interactions.filter(
    (i) => i.severity === "low" || i.severity === "mild"
  ).length;

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold tracking-wider uppercase text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Patient Twin Active
            </span>
            <span className="text-slate-600 hidden xs:inline">•</span>
            <span className="font-mono text-slate-400 text-[11px]">sandbox-twin-1</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
            Live Polypharmacy Safety Profile
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Real-time multi-drug interaction intelligence powered by Digital Twin Protocol (DTP) & ONTOMORPH Holon Knowledge Graph.
          </p>
        </div>

        {/* Responsive Risk Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-slate-950/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-xl shadow-inner w-full md:w-auto">
          <div className="text-center px-1 sm:px-2">
            <div className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Regimen</div>
            <div className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">{medCount} Rx</div>
          </div>
          <div className="text-center px-1 sm:px-2 border-l border-slate-800">
            <div className="text-[9px] sm:text-[10px] uppercase font-semibold text-red-400 tracking-wider">Severe</div>
            <div className={`text-base sm:text-lg font-bold mt-0.5 ${severeCount > 0 ? "text-red-400" : "text-slate-500"}`}>
              {severeCount}
            </div>
          </div>
          <div className="text-center px-1 sm:px-2 border-l border-slate-800">
            <div className="text-[9px] sm:text-[10px] uppercase font-semibold text-amber-400 tracking-wider">Moderate</div>
            <div className={`text-base sm:text-lg font-bold mt-0.5 ${moderateCount > 0 ? "text-amber-400" : "text-slate-500"}`}>
              {moderateCount}
            </div>
          </div>
          <div className="text-center px-1 sm:px-2 border-l border-slate-800">
            <div className="text-[9px] sm:text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Mild</div>
            <div className={`text-base sm:text-lg font-bold mt-0.5 ${mildCount > 0 ? "text-emerald-400" : "text-slate-500"}`}>
              {mildCount}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
