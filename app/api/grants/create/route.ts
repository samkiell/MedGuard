import { DTP } from "@ontomorph/dtp-sdk";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envVarName = "DTP_PLATFORM_KEY";
    const platformKey = process.env[envVarName];
    console.log(`[DTP Grants Create Debug] Env var name: ${envVarName}, Present: ${Boolean(platformKey)}, Length: ${platformKey?.length ?? 0}`);

    if (!platformKey) {
      return NextResponse.json(
        { error: "DTP_PLATFORM_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    const dtp = new DTP({ apiKey: platformKey });
    const baseUrl = process.env.DTP_BASE_URL || "https://api.ontomorph.com";

    // 1. Request grant token directly from POST /grants using the platform payload schema
    const grantEndpoint = `${baseUrl}/grants`;
    const grantPayload = {
      scope: ["cardiovascular:read", "events:read", "grants:write", "twins:read", "twins:write"],
      expiresAt: "2026-12-31",
    };

    console.log(`[DTP Grants Create Debug] POST ${grantEndpoint} with body:`, JSON.stringify(grantPayload));

    const grantRes = await fetch(grantEndpoint, {
      method: "POST",
      headers: {
        "X-DTP-API-Key": platformKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(grantPayload),
    });

    const grantStatus = grantRes.status;
    const grantBody = await grantRes.json().catch(() => null);
    console.log(`[DTP Grants Create Debug] Response status ${grantStatus}:`, JSON.stringify(grantBody));

    let grantToken = "";
    if (grantRes.ok && grantBody) {
      grantToken =
        grantBody.data?.token ||
        grantBody.token ||
        grantBody.data?.grantToken ||
        grantBody.grantToken ||
        grantBody.data?.grant?.token ||
        "";
    }

    if (!grantToken) {
      return NextResponse.json(
        {
          error: "Failed to issue grant token from DTP platform API",
          apiStatus: grantStatus,
          apiResponseBody: grantBody,
          requestPayload: grantPayload,
        },
        { status: grantStatus || 500 }
      );
    }

    const twinId = grantBody.data?.twinId || grantBody.twinId || "sandbox-twin-1";
    console.log("[DTP Grants Create] Twin ID:", twinId);
    console.log("[DTP Grants Create] Grant Token:", grantToken);

    return NextResponse.json({
      twinId,
      grantToken,
      apiStatus: grantStatus,
      apiResponseBody: grantBody,
    });
  } catch (error: any) {
    console.error("[DTP Grants Create Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}


