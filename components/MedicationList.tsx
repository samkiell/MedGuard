import React, { useState } from "react";
import { Medication } from "@/lib/types";

interface MedicationListProps {
  medications: Medication[];
  loading: boolean;
  onRemoveMedication: (id: string) => void;
  onAddMedication: (medication: Medication) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  loading,
  onRemoveMedication,
  onAddMedication,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [inputNames, setInputNames] = useState("");
  const [isResolvingNames, setIsResolvingNames] = useState(false);
  
  // Fallback mode toggle for raw code entry
  const [useRawCodeFallback, setUseRawCodeFallback] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = inputNames.trim();
    if (!rawInput) return;

    // Support comma or newline separated drug names
    const names = rawInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    setIsResolvingNames(true);
    try {
      // Resolve drug names in parallel via /api/resolve/drug
      const resolvePromises = names.map(async (name) => {
        try {
          const res = await fetch("/api/resolve/drug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          const data = await res.json();

          if (!res.ok) {
            return {
              id: String(Date.now() + Math.random()),
              name,
              code: "",
              resolutionError: data.error || `Could not resolve '${name}'`,
              dosage: "Prescribed",
            };
          }

          return {
            id: String(Date.now() + Math.random()),
            name: data.resolvedName || name,
            code: data.holonCode || data.rxcui,
            rxcui: data.rxcui,
            holonMappingFailed: data.holonMappingFailed,
            dosage: "Prescribed",
          };
        } catch (err: any) {
          return {
            id: String(Date.now() + Math.random()),
            name,
            code: "",
            resolutionError: `Network error resolving '${name}'`,
            dosage: "Prescribed",
          };
        }
      });

      const resolvedMedications = await Promise.all(resolvePromises);
      resolvedMedications.forEach((med) => {
        onAddMedication(med);
      });

      setInputNames("");
      setShowModal(false);
    } finally {
      setIsResolvingNames(false);
    }
  };

  const handleRawCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customCode.trim()) return;
    onAddMedication({
      id: String(Date.now() + Math.random()),
      name: customName.trim(),
      code: customCode.trim(),
      dosage: "Prescribed",
    });
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
            <p className="text-xs text-slate-400">Current active drugs associated with this Digital Twin.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start sm:self-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span> Add Medication
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
                className={`p-3.5 rounded-xl flex items-center justify-between group transition shadow-sm border ${
                  med.resolutionError
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="min-w-0 pr-2 space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    {med.name}
                    {med.isResolving && (
                      <span className="text-[10px] text-blue-400 animate-pulse font-normal">Resolving...</span>
                    )}
                  </div>
                  {med.resolutionError ? (
                    <div className="text-[11px] text-amber-400/90 font-medium">
                      ⚠️ could not resolve — check spelling or enter code manually
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                      <span>Code: {med.code}</span>
                      {med.holonMappingFailed && (
                        <span title="HOLON translation unavailable; using RxCUI code fallback" className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1 rounded">
                          RxCUI
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRemoveMedication(med.id)}
                  className="text-xs text-slate-400 hover:text-red-300 transition p-1.5 rounded-md hover:bg-red-500/10 shrink-0"
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
                <h3 className="text-base font-bold text-slate-100">Add Medication</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter drug names (e.g. &quot;aspirin, warfarin&quot;) to resolve codes automatically.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {!useRawCodeFallback ? (
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Drug Name(s)</label>
                  <input
                    type="text"
                    placeholder="e.g. aspirin, lisinopril, metformin"
                    value={inputNames}
                    onChange={(e) => setInputNames(e.target.value)}
                    disabled={isResolvingNames}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500">
                    Separate multiple drugs with commas or line breaks. Brand names, salt forms, and common typos are resolved via RxNav.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUseRawCodeFallback(true)}
                    className="text-[11px] text-blue-400 hover:underline font-medium"
                  >
                    Enter Code Manually (Fallback)
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!inputNames.trim() || isResolvingNames}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isResolvingNames ? (
                        <>
                          <span className="animate-spin text-xs">⏳</span> Resolving...
                        </>
                      ) : (
                        "Resolve & Add"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRawCodeSubmit} className="space-y-4">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300">
                  Fallback Mode: Manually enter exact RxNorm or HOLON codes for offline demo compatibility.
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Medication Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Aspirin 81mg"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Exact RxNorm / HOLON Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 1191 or 5789167"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUseRawCodeFallback(false)}
                    className="text-[11px] text-blue-400 hover:underline font-medium"
                  >
                    ← Back to Name Resolution
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customName.trim() || !customCode.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Code
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
