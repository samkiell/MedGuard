import { NextResponse } from "next/server";
import { DTPClient } from "@ontomorph/dtp-sdk";

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
    if (!grantToken) {
      return NextResponse.json({
        success: false,
        error: "DTP_GRANT_TOKEN is not configured.",
        medications: [],
      });
    }

    const dtp = new DTPClient();
    const twin = await dtp.twins.connect({ grantToken });
    
    // Read health events from twin
    const healthEvents = await twin.getHealthEvents();
    
    // Filter medication events
    const medications: MedicationEvent[] = (healthEvents || [])
      .filter((event: any) => event.type === "medication" || event.category === "medication" || event.drugCode)
      .map((event: any) => ({
        id: event.id || String(Math.random()),
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
