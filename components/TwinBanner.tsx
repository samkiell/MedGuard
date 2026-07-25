import React from "react";
import { PlainLanguageInteraction } from "@/lib/types";

interface TwinBannerProps {
  medCount: number;
  interactions: PlainLanguageInteraction[];
  twinId?: string;
}

export const TwinBanner: React.FC<TwinBannerProps> = ({
  medCount,
  interactions,
  twinId = "sandbox-twin-1",
}) => {
  const severeCount = interactions.filter(
    (i) => i.severity === "high" || i.severity === "severe"
  ).length;
  const moderateCount = interactions.filter((i) => i.severity === "moderate").length;
  const mildCount = interactions.filter(
    (i) => i.severity === "low" || i.severity === "mild"
  ).length;

  const scrollToInteractions = () => {
    const el = document.querySelector("[data-section='interactions']");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold tracking-wider uppercase text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Patient Twin Active
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400 text-[11px]">{twinId}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-editorial">
            Live Polypharmacy Safety Profile
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Real-time multi-drug interaction intelligence powered by Digital Twin Protocol (DTP) &amp; ONTOMORPH Holon Knowledge Graph.
          </p>
        </div>

        {/* Stat Grid — clickable, severity-aware */}
        <div className="grid grid-cols-4 gap-px bg-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner w-full md:w-auto shrink-0">
          {/* Regimen */}
          <div className="text-center px-4 py-3 bg-slate-950/80">
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">
              Regimen
            </div>
            <div className="text-2xl font-bold text-slate-100 leading-none">
              {medCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Rx</div>
          </div>

          {/* Severe */}
          <button
            onClick={scrollToInteractions}
            className={`text-center px-4 py-3 transition group ${
              severeCount > 0
                ? "bg-red-950/40 hover:bg-red-950/60 cursor-pointer"
                : "bg-slate-950/80 cursor-default"
            }`}
            title={severeCount > 0 ? "Jump to severe interactions" : undefined}
          >
            <div className="text-[9px] uppercase font-bold text-red-400 tracking-widest mb-1">
              Severe
            </div>
            <div
              className={`text-2xl font-bold leading-none transition ${
                severeCount > 0
                  ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                  : "text-slate-600"
              }`}
            >
              {severeCount}
            </div>
            {severeCount > 0 && (
              <div className="text-[10px] text-red-400/60 mt-0.5 group-hover:text-red-400 transition">
                ↓ view
              </div>
            )}
          </button>

          {/* Moderate */}
          <button
            onClick={scrollToInteractions}
            className={`text-center px-4 py-3 transition group ${
              moderateCount > 0
                ? "bg-amber-950/40 hover:bg-amber-950/60 cursor-pointer"
                : "bg-slate-950/80 cursor-default"
            }`}
            title={moderateCount > 0 ? "Jump to moderate interactions" : undefined}
          >
            <div className="text-[9px] uppercase font-bold text-amber-400 tracking-widest mb-1">
              Moderate
            </div>
            <div
              className={`text-2xl font-bold leading-none transition ${
                moderateCount > 0
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "text-slate-600"
              }`}
            >
              {moderateCount}
            </div>
            {moderateCount > 0 && (
              <div className="text-[10px] text-amber-400/60 mt-0.5 group-hover:text-amber-400 transition">
                ↓ view
              </div>
            )}
          </button>

          {/* Mild */}
          <button
            onClick={scrollToInteractions}
            className={`text-center px-4 py-3 transition group ${
              mildCount > 0
                ? "bg-emerald-950/30 hover:bg-emerald-950/50 cursor-pointer"
                : "bg-slate-950/80 cursor-default"
            }`}
            title={mildCount > 0 ? "Jump to mild interactions" : undefined}
          >
            <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest mb-1">
              Mild
            </div>
            <div
              className={`text-2xl font-bold leading-none transition ${
                mildCount > 0
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                  : "text-slate-600"
              }`}
            >
              {mildCount}
            </div>
            {mildCount > 0 && (
              <div className="text-[10px] text-emerald-400/60 mt-0.5 group-hover:text-emerald-400 transition">
                ↓ view
              </div>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
