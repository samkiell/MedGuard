import { NextResponse } from "next/server";
import { DTP } from "@ontomorph/dtp-sdk";

export async function POST(req: Request) {
  try {
    const grantToken = process.env.DTP_GRANT_TOKEN;
    const body = await req.json();
    const { interaction } = body; // { drugNames, severity, plainLanguageExplanation, pair }

    if (!interaction) {
      return NextResponse.json(
        { success: false, error: "Missing interaction payload." },
        { status: 400 }
      );
    }

    const platformKey = process.env.DTP_PLATFORM_KEY;
    if (!grantToken || !platformKey) {
      return NextResponse.json(
        { success: false, error: "DTP credentials (DTP_GRANT_TOKEN / DTP_PLATFORM_KEY) not configured." },
        { status: 400 }
      );
    }

    const dtp = new DTP({ apiKey: platformKey });
    const twin = dtp.twins.connect(grantToken);

    // Write flag back to the twin
    await twin.flag("pharmacology", {
      eventType: "POLYPHARMACY_INTERACTION_RISK",
      title: `Drug Interaction: ${interaction.drugNames[0]} + ${interaction.drugNames[1]}`,
      description: interaction.plainLanguageExplanation,
      data: {
        pair: interaction.pair,
        drugNames: interaction.drugNames,
        severity: interaction.severity,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Flag successfully written to Digital Twin.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to flag interaction back to twin.",
      },
      { status: 500 }
    );
  }
}
