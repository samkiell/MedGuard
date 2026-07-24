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
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCode.trim()) return;
    onAddMedication(customName.trim(), customCode.trim());
    setCustomName("");
    setCustomCode("");
    setShowAddForm(false);
  };

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Active Regimen Medications</h3>
          <p className="text-xs text-slate-400">Current RxNorm coded drugs associated with this Digital Twin.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition shadow-sm flex items-center gap-1"
        >
          {showAddForm ? "Cancel" : "+ Add Sandbox Drug"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-3">
          <div className="text-xs font-semibold text-slate-300">Add Test / Custom Drug</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Drug Name</label>
              <input
                type="text"
                placeholder="e.g. Lisinopril"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">RxNorm Code</label>
              <input
                type="text"
                placeholder="e.g. 29046"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded transition"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition"
            >
              Add to Regimen
            </button>
          </div>
        </form>
      )}

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
              className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-between group transition"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{med.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">RxNorm: {med.code}</div>
              </div>
              <button
                onClick={() => onRemoveMedication(med.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 transition px-2 py-1"
                title="Remove medication"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
