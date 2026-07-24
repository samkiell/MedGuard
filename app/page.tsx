"use client";

import { useEffect, useState } from "react";
import { Medication, PlainLanguageInteraction, FlagStatusMap } from "@/lib/types";
import { getCachedInteractions, setCachedInteractions } from "@/lib/helpers";
import { Header } from "@/components/Header";
import { TwinBanner } from "@/components/TwinBanner";
import { MedicationList } from "@/components/MedicationList";
import { InteractionCard } from "@/components/InteractionCard";

export default function Home() {
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<PlainLanguageInteraction[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [flagStatus, setFlagStatus] = useState<FlagStatusMap>({});

  const runInteractionCheck = async (medsList: Medication[]) => {
    if (medsList.length < 2) {
      setInteractions([]);
      return;
    }

    const medCodes = medsList.map((m) => m.code).filter(Boolean);
    const cached = getCachedInteractions(medCodes);
    if (cached) {
      setInteractions(cached);
      const initialExpanded: Record<string, boolean> = {};
      cached.forEach((item) => {
        initialExpanded[`${item.pair[0]}-${item.pair[1]}`] = true;
      });
      setExpandedCards(initialExpanded);
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
        setCachedInteractions(medCodes, data.interactions);
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
        setFlagStatus(JSON.parse(savedFlags));
      }
    } catch (e) {
      console.warn("Failed to load flagged interactions:", e);
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
            console.warn("Failed to save flagged status:", e);
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

  const handleAddMedication = (name: string, code: string) => {
    const updated = [
      ...medications,
      {
        id: String(Date.now()),
        name,
        code,
        dosage: "Prescribed",
      },
    ];
    setMedications(updated);
    runInteractionCheck(updated);
  };

  const handleRemoveMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    runInteractionCheck(updated);
  };

  const toggleExpand = (key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16">
      <Header onSync={fetchMedications} isSyncing={loadingMeds} />

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            ⚠️ {error}
          </div>
        )}

        <TwinBanner medCount={medications.length} medications={medications} />

        <MedicationList
          medications={medications}
          loading={loadingMeds}
          onRemoveMedication={handleRemoveMedication}
          onAddMedication={handleAddMedication}
        />

        {/* Interaction Results Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Interaction & Polypharmacy Analysis</h3>
              <p className="text-xs text-slate-400">
                Automated pairwise evaluation across active regimen via HOLON & Reference fallback.
              </p>
            </div>
            {checkingInteractions && (
              <span className="text-xs text-blue-400 flex items-center gap-1.5 animate-pulse">
                Analyzing Rx Pairs...
              </span>
            )}
          </div>

          {checkingInteractions && interactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Running interaction pipeline across Digital Twin medications...
            </div>
          ) : interactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              No clinical interactions detected for current regimen configuration.
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map((item) => {
                const key = `${item.pair[0]}-${item.pair[1]}`;
                return (
                  <InteractionCard
                    key={key}
                    interaction={item}
                    isExpanded={!!expandedCards[key]}
                    onToggleExpand={() => toggleExpand(key)}
                    onFlag={handleFlagToTwin}
                    flagStatus={flagStatus[key]}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
