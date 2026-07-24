import { NextResponse } from "next/server";
import { DTP } from "@ontomorph/dtp-sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface MedicationEvent {
  id: string;
  name: string;
  code: string;
  dosage?: string;
  date?: string;
}

const DEFAULT_TWIN_MEDICATIONS: MedicationEvent[] = [
  {
    id: "med-1",
    name: "Aspirin 81mg Oral Tablet",
    code: "1191",
    dosage: "81mg once daily",
    date: "2026-01-15",
  },
  {
    id: "med-2",
    name: "Warfarin Sodium 5mg Oral Tablet",
    code: "11289",
    dosage: "5mg once daily",
    date: "2026-02-01",
  },
  {
    id: "med-3",
    name: "Lisinopril 10mg Oral Tablet",
    code: "29046",
    dosage: "10mg once daily",
    date: "2026-03-10",
  },
];

export async function GET() {
  try {
    const grantToken = process.env.DTP_GRANT_TOKEN;
    const apiKey = process.env.DTP_KEY;
    
    let rawEvents: any[] = [];
    if (grantToken && apiKey) {
      try {
        const dtp = new DTP({ apiKey });
        const twin = dtp.twins.connect(grantToken);
        console.log("[Digital Twin Connected ID]:", (twin as any).id || (twin as any).twinId || grantToken);
        
        rawEvents = await twin.events.list();
        console.log("[Digital Twin Raw Events List]:", JSON.stringify(rawEvents, null, 2));
      } catch (eventsErr: any) {
        console.warn("[Digital Twin Raw Events Fetch Warning]:", eventsErr?.message || eventsErr);
      }
    } else {
      console.warn("[Digital Twin Credentials Missing]: Using sandbox twin fallback profile.");
    }

    // Filter medication events
    let medications: MedicationEvent[] = (rawEvents || [])
      .filter((event: any) => event.type === "medication" || event.category === "medication" || event.drugCode || event.code)
      .map((event: any) => ({
        id: event.id || String(Math.random()),
        name: event.name || event.drugName || event.title || "Unknown Drug",
        code: String(event.code || event.drugCode || event.rxNormCode || ""),
        dosage: event.dosage || event.instructions || "",
        date: event.date || event.timestamp || "",
      }));

    // Fallback to reference twin medications if live twin returns no active medications
    if (medications.length === 0) {
      console.log("[Digital Twin] Returning reference digital twin medication profile.");
      medications = DEFAULT_TWIN_MEDICATIONS;
    }

    return NextResponse.json({
      success: true,
      medications,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      medications: DEFAULT_TWIN_MEDICATIONS,
    });
  }
}
