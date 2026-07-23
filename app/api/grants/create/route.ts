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

    let grant: any = null;
    let token: string = "";

    if (dtp.grants && typeof dtp.grants.create === "function") {
      grant = await dtp.grants.create({
        scope: ["events:read", "events:write"],
        expiresAt: "2026-12-31",
      });
      console.log("[DTP Grants Create] Full grant object from dtp.grants.create:", JSON.stringify(grant, null, 2));
      token = grant?.token || grant?.grantToken || grant?.data?.token || grant?.data?.grantToken || "";
    } else {
      console.log("[DTP Grants Create] dtp.grants is undefined in @ontomorph/dtp-sdk 0.1.2. Available properties on dtp instance:", Object.keys(dtp));
      token = process.env.DTP_GRANT_TOKEN || "dtp_grant_sandbox-twin-1_1784765181304";
      grant = {
        notice: "dtp.grants is not exposed on @ontomorph/dtp-sdk 0.1.2 instance",
        token,
        scope: ["events:read", "events:write"],
        expiresAt: "2026-12-31",
      };
      console.log("[DTP Grants Create] Full grant object fallback:", JSON.stringify(grant, null, 2));
    }

    let twin: any = null;
    let twinError: any = null;
    if (token) {
      try {
        twin = await dtp.twins.connect(token);
        console.log("[DTP Grants Create] Connected twin handle:", {
          id: twin.id,
          grant: twin.grant,
        });
      } catch (err: any) {
        twinError = {
          message: err?.message,
          code: err?.code,
        };
        console.log("[DTP Grants Create] Twin connect error:", err?.message);
      }
    }

    return NextResponse.json({
      grant,
      twinId: twin?.id || twin?.grant?.twinId || null,
      token: token || null,
      twinConnected: Boolean(twin),
      twinError,
      availableSdkKeys: Object.keys(dtp),
    });
  } catch (error: any) {
    console.error("[DTP Grants Create Error]:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
      },
      { status: 500 }
    );
  }
}


