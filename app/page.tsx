"use client";

import { useEffect, useState } from "react";

interface Medication {
  id: string;
  name: string;
  code: string;
  dosage?: string;
  date?: string;
}

interface PlainLanguageInteraction {
  pair: [string, string];
  drugNames: [string, string];
  severity: "high" | "moderate" | "low" | "unknown";
  description: string;
  plainLanguageExplanation: string;
  mechanismOrAncestors?: string[];
}

export default function Home() {
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<PlainLanguageInteraction[]>([]);
  
  // Track flagged items status
  const [flagStatus, setFlagStatus] = useState<Record<string, { loading: boolean; success: boolean; message?: string }>>({});

  // Form state for adding custom/sandbox drug
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");

  const runInteractionCheck = async (medsList: Medication[]) => {
    if (medsList.length < 2) {
      setInteractions([]);
      return;
    }
    setCheckingInteractions(true);
    try {
      const res = await fetch("/api/interactions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications: medsList }),
      });
      const data = await res.json();
      if (data.success) {
        setInteractions(data.interactions);
      }
    } catch (err: any) {
      console.error("Interaction check failed:", err);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const fetchMedications = async () => {
    setLoadingMeds(true);
    setError(null);
    try {
      const res = await fetch("/api/twin/medications");
      const data = await res.json();
      let meds: Medication[] = [];
      if (data.success && Array.isArray(data.medications)) {
        meds = data.medications;
      }
      if (data.error) {
        setError(data.error);
      }
      setMedications(meds);
      runInteractionCheck(meds);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleFlagToTwin = async (item: PlainLanguageInteraction) => {
    const key = `${item.pair[0]}-${item.pair[1]}`;
    setFlagStatus((prev) => ({ ...prev, [key]: { loading: true, success: false } }));

    try {
      const res = await fetch("/api/twin/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interaction: item }),
      });
      const data = await res.json();

      if (data.success) {
        setFlagStatus((prev) => ({
          ...prev,
          [key]: { loading: false, success: true, message: data.message },
        }));
      } else {
        setFlagStatus((prev) => ({
          ...prev,
          [key]: { loading: false, success: false, message: data.error },
        }));
      }
    } catch (err: any) {
      setFlagStatus((prev) => ({
        ...prev,
        [key]: { loading: false, success: false, message: err.message },
      }));
    }
  };

  const handleAddCustomMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCode) return;
    const updated = [
      ...medications,
      {
        id: String(Date.now()),
        name: customName,
        code: customCode,
        dosage: "Prescribed",
      },
    ];
    setMedications(updated);
    runInteractionCheck(updated);
    setCustomName("");
    setCustomCode("");
  };

  const removeMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    runInteractionCheck(updated);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "moderate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Polypharmacy Guardian</h1>
              <p className="text-xs text-slate-400">AI Safety & Interaction Monitor for Ontomorph Digital Twins</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Digital Twin Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Patient / Twin Summary Bar */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">Active Twin Context</span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-400">ID: TWIN-OM-89421</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Patient Polypharmacy Safety Portal</h2>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-300">
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-xs">Active Meds</span>
              <span className="font-bold text-slate-100 text-base">{medications.length}</span>
            </div>
            <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-xs">Flagged Risks</span>
              <span className="font-bold text-rose-400 text-base">{interactions.length}</span>
            </div>
            <button
              onClick={fetchMedications}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
            >
              🔄 Refresh Twin Data
            </button>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active Medications & Add Form */}
          <div className="space-y-6">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <span>💊</span> Active Prescriptions
              </h3>

              {loadingMeds ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                  Syncing twin medication list...
                </div>
              ) : medications.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-sm">
                  No active prescriptions detected.
                </div>
              ) : (
                <div className="space-y-2">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition group"
                    >
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{med.name}</p>
                        <p className="text-xs font-mono text-slate-500">RxNorm: {med.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-md">
                          {med.dosage || "Active"}
                        </span>
                        <button
                          onClick={() => removeMedication(med.id)}
                          className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition px-1 text-xs"
                          title="Remove prescription"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Add Prescription Card */}
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-300">Add Prescription to Twin Profile</h4>
              <form onSubmit={handleAddCustomMed} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Drug Name (e.g. Lisinopril)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="RxNorm Code (e.g. 29046)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
                >
                  Add & Cross-Check Risk
                </button>
              </form>
            </section>
          </div>

          {/* Right Column: Interaction Check & Flag Findings */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🚨</span> HOLON Risk Findings & Explanations
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clinical knowledge graph analysis cross-checked against active twin prescriptions
                  </p>
                </div>
                {checkingInteractions && (
                  <span className="text-xs text-indigo-400 font-medium animate-pulse bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Running HOLON Clinical Graph Check...
                  </span>
                )}
              </div>

              {checkingInteractions ? (
                <div className="py-12 text-center text-slate-400 text-sm space-y-2">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Cross-referencing medication concepts & mechanisms...</p>
                </div>
              ) : interactions.length === 0 ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <strong className="block text-emerald-300 font-semibold">No Interactions Flagged</strong>
                    <p className="text-xs text-emerald-400/80 mt-0.5">
                      All active prescriptions cross-checked cleanly with no known high or moderate risk combinations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((item, idx) => {
                    const key = `${item.pair[0]}-${item.pair[1]}`;
                    const status = flagStatus[key];

                    return (
                      <div
                        key={idx}
                        className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-sm hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-slate-100">
                                {item.drugNames[0]} + {item.drugNames[1]}
                              </h4>
                            </div>
                            <p className="text-xs font-mono text-slate-500">
                              RxNorm Pair: {item.pair[0]} & {item.pair[1]}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg border ${getSeverityBadge(
                                item.severity
                              )}`}
                            >
                              {item.severity} severity
                            </span>

                            {status?.success ? (
                              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm">
                                ✓ Flagged on Twin Record
                              </span>
                            ) : (
                              <button
                                onClick={() => handleFlagToTwin(item)}
                                disabled={status?.loading}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                              >
                                {status?.loading ? "Writing Flag..." : "🚩 Write Flag to Twin"}
                              </button>
                            )}
                          </div>
                        </div>

                        {item.mechanismOrAncestors && item.mechanismOrAncestors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 items-center pt-1">
                            <span className="text-xs text-slate-400 font-medium">Drug Classes:</span>
                            {item.mechanismOrAncestors.map((cls, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2.5 py-0.5 bg-slate-900 text-slate-300 text-xs rounded-md border border-slate-800 font-medium"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block">
                            Plain-Language Clinical Explanation
                          </span>
                          <p className="text-sm text-slate-200 leading-relaxed font-normal">
                            {item.plainLanguageExplanation}
                          </p>
                        </div>

                        {status?.message && (
                          <div className="text-xs text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                            {status.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
