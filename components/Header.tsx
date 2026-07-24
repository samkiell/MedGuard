import React from "react";

interface HeaderProps {
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSync, isSyncing }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center shadow-inner">
            <img src="/assets/favicon.ico" alt="MedGuard Logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight leading-none">
                MedGuard
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                Clinical Portal
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Polypharmacy & Safety Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            HOLON Knowledge Graph
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="px-2.5 sm:px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 whitespace-nowrap"
            aria-label="Refresh twin medication data"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden xs:inline">{isSyncing ? "Syncing..." : "Sync Twin Data"}</span>
            <span className="xs:hidden">{isSyncing ? "..." : "Sync"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
