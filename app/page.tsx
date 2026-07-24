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
  severity: "high" | "moderate" | "low" | "unknown" | "severe" | "mild";
  description: string;
  plainLanguageExplanation: string;
  mechanismOrAncestors?: string[];
  source?: "holon_live" | "reference";
}

export default function Home() {
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<PlainLanguageInteraction[]>([]);
  
  // Track expanded state for interaction cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Track flagged items status
  const [flagStatus, setFlagStatus] = useState<Record<string, { loading: boolean; success: boolean; message?: string }>>({});

  // Form state for adding custom/sandbox drug
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

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
      if (data.success && Array.isArray(data.interactions)) {
        setInteractions(data.interactions);
        // Default expand all cards for live demonstration scanability
        const initialExpanded: Record<string, boolean> = {};
        data.interactions.forEach((item: PlainLanguageInteraction) => {
          initialExpanded[`${item.pair[0]}-${item.pair[1]}`] = true;
        });
        setExpandedCards(initialExpanded);
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
      runInteractionCheck([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    try {
      const savedFlags = localStorage.getItem("medguard_flagged_interactions");
      if (savedFlags) {
        const flaggedMap = JSON.parse(savedFlags);
        setFlagStatus(flaggedMap);
      }
    } catch (e) {
      console.warn("Failed to load flagged interactions from localStorage:", e);
    }
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
        setFlagStatus((prev) => {
          const next = {
            ...prev,
            [key]: { loading: false, success: true, message: data.message },
          };
          try {
            localStorage.setItem("medguard_flagged_interactions", JSON.stringify(next));
          } catch (e) {
            console.warn("Failed to save flagged status to localStorage:", e);
          }
          return next;
        });
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
    setShowAddForm(false);
  };

  const removeMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    runInteractionCheck(updated);
  };

  const toggleExpand = (key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper for 3-tier severity color system
  const getSeverityTier = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "high" || s === "severe") {
      return {
        label: "Severe Risk",
        barColor: "bg-[#F87171]",
        badgeBg: "bg-[#F87171]/15",
        badgeText: "text-[#FCA5A5]",
        badgeBorder: "border-[#F87171]/30",
      };
    } else if (s === "moderate") {
      return {
        label: "Moderate Risk",
        barColor: "bg-[#FB923C]",
        badgeBg: "bg-[#FB923C]/15",
        badgeText: "text-[#FDBA74]",
        badgeBorder: "border-[#FB923C]/30",
      };
    } else {
      return {
        label: "Mild Risk",
        barColor: "bg-[#FACC15]",
        badgeBg: "bg-[#FACC15]/15",
        badgeText: "text-[#FDE047]",
        badgeBorder: "border-[#FACC15]/30",
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans antialiased pb-16">
      {/* Top Clinical Header */}
      <header className="border-b border-[#28354D] bg-[#162032]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#1E293B] border border-[#28354D] flex items-center justify-center text-[#2DD4BF] font-semibold text-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#F8FAFC] tracking-tight">MedGuard</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] border border-[#28354D]">
                  Clinical Portal
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">Polypharmacy & Drug Safety Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E293B] border border-[#28354D] text-xs font-medium text-[#94A3B8]">
              <span className="h-2 w-2 rounded-full bg-[#2DD4BF]" />
              HOLON Knowledge Graph Active
            </div>
            <button
              onClick={fetchMedications}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#26334D] text-[#F8FAFC] text-xs font-medium rounded-lg border border-[#28354D] transition flex items-center gap-1.5"
              aria-label="Refresh twin medication data"
            >
              <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Twin Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Single Vertical Flow Container */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        {/* 1. Patient / Twin Identity Banner */}
        <section className="bg-[#162032] border border-[#28354D] rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span className="font-semibold uppercase tracking-wider text-[#38BDF8]">Patient Twin Context</span>
              <span>•</span>
              <span className="font-mono text-[#F8FAFC]">TWIN-OM-89421</span>
            </div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Digital Twin Safety Profile</h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-[#0F172A] px-3.5 py-2 rounded-lg border border-[#28354D]">
              <span className="text-[#94A3B8] block text-[11px] uppercase tracking-wider">Active Regimen</span>
              <span className="font-bold text-[#F8FAFC] text-base">{medications.length} Prescriptions</span>
            </div>
            <div className="bg-[#0F172A] px-3.5 py-2 rounded-lg border border-[#28354D]">
              <span className="text-[#94A3B8] block text-[11px] uppercase tracking-wider">Flagged Interactions</span>
              <span className="font-bold text-[#FB923C] text-base">{interactions.length} Findings</span>
            </div>
          </div>
        </section>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl text-[#FCA5A5] text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">⚠️</span>
              <span>Clinical Sync Notice: {error}</span>
            </div>
            <button
              onClick={fetchMedications}
              className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#26334D] text-[#F8FAFC] text-xs rounded border border-[#28354D] transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Active Medication Regimen (Clean Scannable List) */}
        <section className="bg-[#162032] border border-[#28354D] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#28354D] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Active Medication Regimen</h3>
              <p className="text-xs text-[#94A3B8]">Current patient prescriptions cross-checked for interactions</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#26334D] text-[#F8FAFC] text-xs font-semibold rounded-lg border border-[#28354D] transition flex items-center gap-1"
            >
              {showAddForm ? "Cancel" : "+ Add Prescription"}
            </button>
          </div>

          {/* Add Prescription Drawer Form */}
          {showAddForm && (
            <form onSubmit={handleAddCustomMed} className="p-4 bg-[#0F172A] border border-[#28354D] rounded-xl space-y-3">
              <div className="text-xs font-semibold text-[#F8FAFC]">Add Medication to Current Regimen</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Drug Name (e.g. Lisinopril)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-3 py-2 bg-[#1E293B] border border-[#28354D] rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="RxNorm Code (e.g. 29046)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="px-3 py-2 bg-[#1E293B] border border-[#28354D] rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2DD4BF] hover:bg-[#26B2A1] text-[#0F172A] text-xs font-bold rounded-lg transition"
                >
                  Add & Check Interactions
                </button>
              </div>
            </form>
          )}

          {/* Scannable Medication List */}
          {loadingMeds ? (
            <div className="py-6 space-y-2">
              <div className="h-10 bg-[#0F172A] rounded-lg animate-pulse border border-[#28354D]" />
              <div className="h-10 bg-[#0F172A] rounded-lg animate-pulse border border-[#28354D]" />
            </div>
          ) : medications.length === 0 ? (
            <div className="py-6 text-center text-[#94A3B8] text-xs border border-dashed border-[#28354D] rounded-lg">
              No active prescriptions loaded in twin context.
            </div>
          ) : (
            <div className="divide-y divide-[#28354D]/60 border border-[#28354D] rounded-lg overflow-hidden bg-[#0F172A]">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#1E293B]/50 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[#94A3B8] text-xs font-mono">💊</span>
                    <div className="truncate">
                      <span className="text-sm font-semibold text-[#F8FAFC]">{med.name}</span>
                      <span className="text-xs text-[#94A3B8] ml-2">RxNorm: {med.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs px-2.5 py-0.5 bg-[#1E293B] text-[#94A3B8] rounded border border-[#28354D] font-mono">
                      {med.dosage || "Active"}
                    </span>
                    <button
                      onClick={() => removeMedication(med.id)}
                      className="text-[#64748B] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition px-1 text-xs"
                      title="Remove prescription"
                      aria-label={`Remove ${med.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Clinical Risk Findings (Signature Expandable Card Flow) */}
        <section className="bg-[#162032] border border-[#28354D] rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#28354D] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Clinical Interaction Findings</h3>
              <p className="text-xs text-[#94A3B8]">Cross-referenced against active digital twin prescriptions</p>
            </div>
            {checkingInteractions && (
              <span className="text-xs text-[#38BDF8] font-medium bg-[#38BDF8]/10 px-3 py-1 rounded-full border border-[#38BDF8]/20 animate-pulse">
                Analyzing HOLON Graph...
              </span>
            )}
          </div>

          {checkingInteractions ? (
            <div className="py-12 text-center text-[#94A3B8] text-xs space-y-3">
              <div className="h-5 w-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cross-referencing medication concepts & pharmacological mechanisms...</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="p-5 bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 rounded-xl text-[#2DD4BF] text-xs flex items-center gap-3">
              <span className="text-lg">✓</span>
              <div>
                <strong className="block text-[#F8FAFC] font-semibold text-sm">No Interactions Flagged</strong>
                <p className="text-[#94A3B8] mt-0.5">
                  All active prescriptions cross-checked cleanly with no known drug-drug risks detected in knowledge base.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((item, idx) => {
                const key = `${item.pair[0]}-${item.pair[1]}`;
                const tier = getSeverityTier(item.severity);
                const isExpanded = expandedCards[key] !== false; // Default expanded
                const status = flagStatus[key];

                return (
                  <div
                    key={idx}
                    className="relative bg-[#0F172A] border border-[#28354D] rounded-xl overflow-hidden shadow-sm transition hover:border-[#38BDF8]/40"
                  >
                    {/* Signature left-edge severity color bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${tier.barColor}`} />

                    <div className="pl-5 pr-5 pt-4 pb-4 space-y-3">
                      {/* Card Header Row */}
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-[#F8FAFC]">
                              {item.drugNames[0]} + {item.drugNames[1]}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-mono text-[#94A3B8]">
                              RxNorm Pair: {item.pair[0]} • {item.pair[1]}
                            </p>
                            {item.source === "reference" ? (
                              <span
                                className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#334155]/60 text-[#CBD5E1] border border-[#475569]/60 flex items-center gap-1"
                                title="HOLON live check returned no result for this pair. Sourced from local reference data fallback."
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
                                Reference data (HOLON live check returned no result for this pair)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
                                HOLON Live Finding
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* 3-Tier Severity Badge */}
                          <span
                            className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
                          >
                            {tier.label}
                          </span>

                          {item.source === "reference" && (
                            <span
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-[#334155] text-[#F1F5F9] border border-[#475569] flex items-center gap-1.5"
                              title="HOLON live check returned no result for this pair. Sourced from local reference data fallback."
                            >
                              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                              Reference data
                            </span>
                          )}

                          {/* Inline Flag Status Badge / Action */}
                          {status?.success ? (
                            <span className="px-3 py-1 bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 text-xs font-bold rounded-lg flex items-center gap-1">
                              ✓ Flagged on Twin Record
                            </span>
                          ) : (
                            <button
                              onClick={() => handleFlagToTwin(item)}
                              disabled={status?.loading}
                              className="px-3 py-1 bg-[#1E293B] hover:bg-[#26334D] disabled:opacity-50 text-[#F8FAFC] border border-[#28354D] rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              {status?.loading ? "Writing Flag..." : "🚩 Write Flag to Twin"}
                            </button>
                          )}

                          {/* Expand/Collapse Toggle Button */}
                          <button
                            onClick={() => toggleExpand(key)}
                            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] transition"
                            aria-label={isExpanded ? "Collapse explanation" : "Expand explanation"}
                          >
                            <svg
                              className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Mechanism / Ancestor Tags */}
                      {item.mechanismOrAncestors && item.mechanismOrAncestors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold">Pharmacological Classes:</span>
                          {item.mechanismOrAncestors.map((cls, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2 py-0.5 bg-[#1E293B] text-[#94A3B8] text-xs rounded border border-[#28354D]"
                            >
                              {cls}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Plain-Language Explanation (Humanist Typography) */}
                      {isExpanded && (
                        <div className="pt-2">
                          <div className="p-4 bg-[#162032] border border-[#28354D] rounded-lg space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                              Clinical Plain-Language Explanation
                            </span>
                            <p className="font-narrative text-sm text-[#F8FAFC] leading-relaxed font-normal">
                              {item.plainLanguageExplanation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Flagging Result Message */}
                      {status?.message && (
                        <div className="text-xs text-[#2DD4BF] font-mono bg-[#162032] p-2.5 rounded-lg border border-[#2DD4BF]/30">
                          {status.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
