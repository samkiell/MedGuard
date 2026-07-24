import React from "react";
import { Medication } from "@/lib/types";

interface TwinBannerProps {
  medCount: number;
  medications: Medication[];
}

export const TwinBanner: React.FC<TwinBannerProps> = ({ medCount, medications }) => {
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-sky-400">Patient Twin Context</span>
          <span>•</span>
          <span>ID: sandbox-twin-1</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Live Polypharmacy Profile</h2>
        <p className="text-xs text-slate-400 max-w-xl">
          Monitored automatically via Digital Twin Protocol (DTP) and ONTOMORPH Holon Knowledge Graph.
        </p>
      </div>

      <div className="flex items-center gap-6 border-l border-slate-800 pl-6">
        <div>
          <div className="text-xs text-slate-400">Active Regimen</div>
          <div className="text-xl font-bold text-slate-100">{medCount} Rx</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Status</div>
          <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Monitored
          </div>
        </div>
      </div>
    </section>
  );
};
