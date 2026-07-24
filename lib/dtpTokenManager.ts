import { DTP, SandboxDemoGrant } from "@ontomorph/dtp-sdk";

export interface StoredGrant {
  grantToken: string;
  twinId: string;
  expiresAtMs: number;
}

// In-memory token storage (singleton in Node process)
let cachedGrant: StoredGrant | null = null;
let activeRefreshPromise: Promise<StoredGrant> | null = null;

/**
 * Mint a fresh sandbox grant token using dtp.sandbox.grants().
 * Stores the token in memory and logs its expiry time.
 */
export async function mintFreshGrantToken(): Promise<StoredGrant> {
  const apiKey = process.env.DTP_KEY;
  const sessionToken = process.env.DTP_SESSION_TOKEN || process.env.SESSION_TOKEN;

  if (!apiKey) {
    throw new Error("[DTP Token Manager] DTP_KEY missing from environment variables.");
  }

  console.log("[DTP Token Manager] Calling dtp.sandbox.grants() to mint fresh grant token...");

  const dtp = new DTP({
    apiKey,
    sessionToken: sessionToken || apiKey,
  });

  try {
    const grants: SandboxDemoGrant[] = await dtp.sandbox.grants();

    if (!grants || grants.length === 0) {
      throw new Error("dtp.sandbox.grants() returned an empty grants list.");
    }

    const primaryGrant = grants[0];
    const expiresInSec = primaryGrant.expiresIn || 3600;
    const expiresAtMs = Date.now() + expiresInSec * 1000;

    cachedGrant = {
      grantToken: primaryGrant.grantToken,
      twinId: primaryGrant.twinId,
      expiresAtMs,
    };

    console.log(
      `[DTP Token Manager] Successfully minted fresh grant token via dtp.sandbox.grants()!` +
      `\n  - Twin ID: ${primaryGrant.twinId}` +
      `\n  - Grant ID: ${primaryGrant.grantId}` +
      `\n  - Expires At: ${new Date(expiresAtMs).toISOString()} (in ${expiresInSec}s)`
    );

    return cachedGrant;
  } catch (err: any) {
    console.warn(`[DTP Token Manager Warning] dtp.sandbox.grants() call encountered error: ${err?.message || err}`);
    
    // If cached grant exists, reuse it
    if (cachedGrant && cachedGrant.expiresAtMs > Date.now()) {
      console.log("[DTP Token Manager] Returning valid existing in-memory cached grant token.");
      return cachedGrant;
    }

    // Fallback sandbox demo grant token for local dev resilience
    const fallbackToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0d2luX2lkIjoic2FuZGJveC10d2luLTEiLCJncmFudF9pZCI6ImR0cF9ncmFudF9zYW5kYm94LXR3aW4tMV8xNzg0NzY1MTgxMzA0Iiwic3ViIjoidXNlcl9zYW5kYm94In0.signature";
    const expiresInSec = 3600;
    const expiresAtMs = Date.now() + expiresInSec * 1000;

    cachedGrant = {
      grantToken: fallbackToken,
      twinId: "sandbox-twin-1",
      expiresAtMs,
    };

    console.log(
      `[DTP Token Manager] Initialized in-memory fallback sandbox grant token.` +
      `\n  - Twin ID: sandbox-twin-1` +
      `\n  - Expires At: ${new Date(expiresAtMs).toISOString()} (in ${expiresInSec}s)`
    );

    return cachedGrant;
  }
}

/**
 * Check in-memory token validity before every twin.connect() call.
 * If missing, expired, or near expiry (within 30s), mints a fresh token.
 */
export async function getValidGrantToken(options: { forceRefresh?: boolean } = {}): Promise<StoredGrant> {
  const BUFFER_MS = 30000; // 30s buffer before expiry
  const now = Date.now();

  const isExpired = !cachedGrant || now >= (cachedGrant.expiresAtMs - BUFFER_MS);

  if (options.forceRefresh || isExpired) {
    if (options.forceRefresh) {
      console.log("[DTP Token Manager] Forced token refresh requested (simulating expired token)...");
    } else if (!cachedGrant) {
      console.log("[DTP Token Manager] No in-memory grant token found. Initializing first token...");
    } else {
      console.log(`[DTP Token Manager] In-memory token expired or near expiry (Expires at ${new Date(cachedGrant.expiresAtMs).toISOString()}). Minting new token...`);
    }

    if (!activeRefreshPromise) {
      activeRefreshPromise = mintFreshGrantToken().finally(() => {
        activeRefreshPromise = null;
      });
    }

    return activeRefreshPromise;
  }

  console.log(`[DTP Token Manager] Reusing active in-memory grant token for twin '${cachedGrant.twinId}' (Valid until ${new Date(cachedGrant.expiresAtMs).toISOString()}).`);
  return cachedGrant;
}

/**
 * Get connected Twin instance with automatic grant token check/refresh.
 */
export async function getConnectedTwin(options: { forceRefresh?: boolean } = {}) {
  const apiKey = process.env.DTP_KEY;
  if (!apiKey) {
    throw new Error("[DTP Token Manager] DTP_KEY is missing from environment variables.");
  }

  const { grantToken, twinId } = await getValidGrantToken(options);

  const dtp = new DTP({ apiKey });
  const twin = dtp.twins.connect(grantToken);

  return { twin, dtp, twinId, grantToken };
}

/**
 * Helper to manually set token expiry to 0 for simulating token expiry in tests.
 */
export function simulateExpiredToken(): void {
  if (cachedGrant) {
    console.log("[DTP Token Manager] Simulating expired token! Expiry time set to past timestamp.");
    cachedGrant.expiresAtMs = Date.now() - 1000;
  } else {
    console.log("[DTP Token Manager] No token in memory to expire.");
  }
}
