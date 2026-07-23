import { NextResponse } from "next/server";
import { DTP } from "@ontomorph/dtp-sdk";

export interface MedicationEvent {
  id: string;
  name: string;
  code: string;
  dosage?: string;
  date?: string;
}

export async function GET() {
  try {
    const grantToken = process.env.DTP_GRANT_TOKEN;
    const apiKey = process.env.DTP_KEY;
    if (!grantToken || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "DTP credentials (DTP_GRANT_TOKEN / DTP_KEY) not configured.",
        medications: [],
      });
    }

    const dtp = new DTP({ apiKey });
    const twin = dtp.twins.connect(grantToken);
    
    console.log("[Digital Twin Connected ID]:", (twin as any).id || (twin as any).twinId || grantToken);
    
    // Read health events from twin
    let rawEvents: any[] = [];
    try {
      rawEvents = await twin.events.list();
      console.log("[Digital Twin Raw Events List]:", JSON.stringify(rawEvents, null, 2));
    } catch (eventsErr: any) {
      console.warn("[Digital Twin Raw Events Fetch Warning]:", eventsErr?.message || eventsErr);
      console.log("[Digital Twin Raw Events List]: []");
    }

    // Filter medication events
    const medications: MedicationEvent[] = (rawEvents || [])
      .filter((event: any) => event.type === "medication" || event.category === "medication" || event.drugCode || event.code)
      .map((event: any) => ({
        id: event.id || String(Math.random()),
        name: event.name || event.drugName || event.title || "Unknown Drug",
        code: String(event.code || event.drugCode || event.rxNormCode || ""),
        dosage: event.dosage || event.instructions || "",
        date: event.date || event.timestamp || "",
      }));

    return NextResponse.json({
      success: true,
      medications,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to connect to digital twin",
      medications: [],
    });
  }
}
