import React, { useState } from "react";
import { Medication } from "@/lib/types";

interface MedicationListProps {
  medications: Medication[];
  loading: boolean;
  onRemoveMedication: (id: string) => void;
  onAddMedication: (name: string, code: string) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  loading,
  onRemoveMedication,
  onAddMedication,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCode.trim()) return;
    onAddMedication(customName.trim(), customCode.trim());
    setCustomName("");
    setCustomCode("");
    setShowModal(false);
  };

  return (
    <>
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Active Regimen Medications</h3>
            <p className="text-xs text-slate-400">Current RxNorm coded drugs associated with this Digital Twin.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start sm:self-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span> Add Sandbox Drug
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading active twin medications...</div>
        ) : medications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
            No medications currently active in regimen.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {medications.map((med) => (
              <div
                key={med.id}
                className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between group transition shadow-sm"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{med.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">RxNorm: {med.code}</div>
                </div>
                <button
                  onClick={() => onRemoveMedication(med.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition p-1.5 rounded-md hover:bg-red-500/10 shrink-0"
                  title="Remove medication"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Add Sandbox Medication</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inject a custom prescription into the active Digital Twin profile.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Medication Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin 500mg"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">RxNorm Code</label>
                <input
                  type="text"
                  placeholder="e.g. 860975"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customName.trim() || !customCode.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Regimen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
