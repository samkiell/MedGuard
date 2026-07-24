import fs from 'fs';
import path from 'path';
import { getValidGrantToken, getConnectedTwin, simulateExpiredToken } from "../lib/dtpTokenManager.ts";

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
}

async function testAutoRefresh() {
  console.log("=========================================================");
  console.log("TEST 1: First Twin API call / token initialization");
  console.log("=========================================================");
  const connection1 = await getConnectedTwin();
  console.log("Connected to twin ID:", connection1.twinId);
  console.log("Token in use (prefix):", connection1.grantToken.slice(0, 30) + "...");

  console.log("\n=========================================================");
  console.log("TEST 2: Second Twin API call (Token still valid)");
  console.log("=========================================================");
  const connection2 = await getConnectedTwin();
  console.log("Tokens match:", connection1.grantToken === connection2.grantToken ? "YES (Reused in-memory token)" : "NO");

  console.log("\n=========================================================");
  console.log("TEST 3: Simulating expired token & automatic refresh");
  console.log("=========================================================");
  simulateExpiredToken();
  const connection3 = await getConnectedTwin();
  console.log("Connected to twin ID:", connection3.twinId);
  console.log("Refreshed token in use (prefix):", connection3.grantToken.slice(0, 30) + "...");
  console.log("Auto-refresh generated new token:", connection1.grantToken !== connection3.grantToken ? "YES" : "NO");

  console.log("\n=========================================================");
  console.log("TEST 4: Live Twin Events List call using refreshed token");
  console.log("=========================================================");
  try {
    const events = await connection3.twin.events.list();
    console.log("Twin events list length:", Array.isArray(events) ? events.length : typeof events);
  } catch (err) {
    console.warn("Twin events call warning:", err.message || err);
  }
}

testAutoRefresh();
