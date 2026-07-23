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
    const platformKey = process.env.DTP_PLATFORM_KEY;
    if (!grantToken || !platformKey) {
      return NextResponse.json({
        success: false,
        error: "DTP credentials (DTP_GRANT_TOKEN / DTP_PLATFORM_KEY) not configured.",
        medications: [],
      });
    }

    const dtp = new DTP({ apiKey: platformKey });
    const twin = dtp.twins.connect(grantToken);
    
    // Read health events from twin
    const healthEvents = await twin.events.list();
    
    // Filter medication events
    const medications: MedicationEvent[] = (healthEvents || [])
      .filter((event: any) => event.type === "medication" || event.category === "medication" || event.drugCode)
      .map((event: any) => ({
        id: event.id || "",
        name: event.name || event.drugName || "Unknown Drug",
        code: event.code || event.drugCode || "",
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
