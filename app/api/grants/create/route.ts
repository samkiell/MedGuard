import { DTP } from "@ontomorph/dtp-sdk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.DTP_KEY;
    const holonApiKey = process.env.HOLON_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "DTP_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    const dtp = new DTP({
      apiKey,
      holonApiUrl: "https://holon-api.ontomorph.com",
      holonApiKey,
    }) as any;

    const sdkSurface = {
      dtpInstanceKeys: Object.keys(dtp),
      dtpKeysMethods: dtp.keys ? Object.getOwnPropertyNames(Object.getPrototypeOf(dtp.keys)) : null,
      dtpTwinsMethods: dtp.twins ? Object.getOwnPropertyNames(Object.getPrototypeOf(dtp.twins)) : null,
      dtpConfig: dtp.config ? Object.keys(dtp.config) : null,
    };

    console.log("[DTP SDK Surface Inspection]", JSON.stringify(sdkSurface, null, 2));

    return NextResponse.json({
      status: "NO_GRANT_CREATION_METHOD_IN_SDK_0_1_2",
      message: "Version 0.1.2 of @ontomorph/dtp-sdk is the latest npm release, but does not expose any grant creation method (dtp.grants does not exist). Grants must be issued out-of-band or provided via DTP_GRANT_TOKEN.",
      sdkSurface,
    });
  } catch (error: any) {
    console.error("[DTP Grants Create Error]:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}


