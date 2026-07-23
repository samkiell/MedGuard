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

    // 1. Create or select a sandbox test twin if one doesn't exist
    let twinId = "sandbox-twin-1";
    try {
      const twinsRes = await fetch(`${baseUrl}/twins?environment=test`, {
        headers: {
          "X-DTP-API-Key": platformKey,
          Accept: "application/json",
        },
      });

      if (twinsRes.ok) {
        const twinsData = await twinsRes.json();
        const twins = twinsData.data || twinsData;
        if (Array.isArray(twins) && twins.length > 0) {
          twinId = twins[0].id || twins[0].twinId || twinId;
        } else {
          const createTwinRes = await fetch(`${baseUrl}/twins`, {
            method: "POST",
            headers: {
              "X-DTP-API-Key": platformKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ environment: "test" }),
          });
          const createTwinData = await createTwinRes.json();
          twinId = createTwinData.data?.id || createTwinData.id || createTwinData.twinId || twinId;
        }
      } else {
        const createTwinRes = await fetch(`${baseUrl}/twins`, {
          method: "POST",
          headers: {
            "X-DTP-API-Key": platformKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ environment: "test" }),
        });
        const createTwinData = await createTwinRes.json();
        twinId = createTwinData.data?.id || createTwinData.id || createTwinData.twinId || twinId;
      }
    } catch (twinErr) {
      console.warn("Twin query/create warning, using default sandbox twinId:", twinErr);
    }

    // 2. Generate a grant token scoped to read/write twins and events using grants:write scope
    let grantToken = "";
    const grantRes = await fetch(`${baseUrl}/grants`, {
      method: "POST",
      headers: {
        "X-DTP-API-Key": platformKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        twinId,
        scopes: ["grants:write", "twins:read", "twins:write", "events:read", "events:write"],
      }),
    });


    const grantBody = await grantRes.json().catch(() => null);

    if (grantRes.ok && grantBody) {
      grantToken = grantBody.data?.token || grantBody.token || grantBody.data?.grantToken || grantBody.grantToken || "";
    }

    if (!grantToken) {
      grantToken = grantBody?.data?.token || grantBody?.token || `dtp_grant_${twinId}_${Date.now()}`;
    }

    // Log the resulting twin ID and grant token to the console
    console.log("[DTP Grants Create] Twin ID:", twinId);
    console.log("[DTP Grants Create] Grant Token:", grantToken);

    return NextResponse.json({
      twinId,
      grantToken,
      apiStatus: grantRes.status,
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


