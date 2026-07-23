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

    // 1. Resolve or create a twin with detailed debugging
    console.log(`[DTP Twins Debug] Fetching twins from GET ${baseUrl}/twins?environment=test`);
    const twinsRes = await fetch(`${baseUrl}/twins?environment=test`, {
      headers: {
        "X-DTP-API-Key": platformKey,
        Accept: "application/json",
      },
    });

    const twinsStatus = twinsRes.status;
    const twinsBody = await twinsRes.json().catch(() => null);
    console.log(`[DTP Twins Debug] GET /twins status: ${twinsStatus}`, JSON.stringify(twinsBody));

    let twinId = "";
    if (twinsRes.ok && twinsBody) {
      const twins = twinsBody.data || twinsBody;
      if (Array.isArray(twins) && twins.length > 0) {
        twinId = twins[0].id || twins[0].twinId || "";
        console.log(`[DTP Twins Debug] Found existing twinId: ${twinId}`);
      }
    }

    if (!twinId) {
      const createTwinEndpoint = `${baseUrl}/twins`;
      const createTwinMethod = "POST";
      const createTwinBody = { environment: "test", name: "Sandbox Test Twin" };

      console.log(`[DTP Twins Debug] Creating twin via ${createTwinMethod} ${createTwinEndpoint} with body:`, JSON.stringify(createTwinBody));

      const createTwinRes = await fetch(createTwinEndpoint, {
        method: createTwinMethod,
        headers: {
          "X-DTP-API-Key": platformKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(createTwinBody),
      });

      const createTwinStatus = createTwinRes.status;
      const createTwinResponseBody = await createTwinRes.json().catch(() => null);

      console.log(`[DTP Twins Debug] POST /twins status: ${createTwinStatus}`, JSON.stringify(createTwinResponseBody));

      if (createTwinRes.ok && createTwinResponseBody) {
        twinId = createTwinResponseBody.data?.id || createTwinResponseBody.id || createTwinResponseBody.twinId || "";
      } else {
        return NextResponse.json(
          {
            error: "Failed to resolve or create a Digital Twin on the DTP platform.",
            debug: {
              getTwins: { status: twinsStatus, body: twinsBody },
              postTwinRequest: { endpoint: createTwinEndpoint, method: createTwinMethod, body: createTwinBody },
              postTwinResponse: { status: createTwinStatus, body: createTwinResponseBody },
            },
          },
          { status: createTwinStatus || 500 }
        );
      }
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
      return NextResponse.json(
        {
          error: "Failed to issue grant token from DTP platform API",
          apiStatus: grantRes.status,
          apiResponseBody: grantBody,
        },
        { status: grantRes.status || 500 }
      );
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


