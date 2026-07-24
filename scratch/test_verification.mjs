import fs from 'fs';
import path from 'path';
import { createHolonClient } from "@ontomorph/holon-client";
import { DTP } from "@ontomorph/dtp-sdk";

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

console.log("=========================================================================");
console.log("1. RE-TESTING HOLON INTERACTION CHECK (Aspirin 1191 + Warfarin 11289)");
console.log("=========================================================================");

const holonKey = process.env.HOLON_KEY;
const holonApiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";

async function testTask1() {
  const holonClient = createHolonClient({ apiKey: holonKey, apiUrl: holonApiUrl });

  console.log("[HOLON Pipeline Step 1] client.concepts.getByCode('1191', 'RxNorm')");
  const aspirinRes = await holonClient.concepts.getByCode("1191", "RxNorm");
  console.log("Aspirin getByCode Result:", JSON.stringify(aspirinRes, null, 2));

  console.log("[HOLON Pipeline Step 1] client.concepts.getByCode('11289', 'RxNorm')");
  const warfarinRes = await holonClient.concepts.getByCode("11289", "RxNorm");
  console.log("Warfarin getByCode Result:", JSON.stringify(warfarinRes, null, 2));

  const cidAspirin = aspirinRes?.concept?.conceptId;
  const cidWarfarin = warfarinRes?.concept?.conceptId;

  console.log(`\nResolved Concept IDs -> Aspirin: ${cidAspirin}, Warfarin: ${cidWarfarin}`);

  console.log("\n[HOLON Pipeline Step 2] client.interactions.checkList([cidAspirin, cidWarfarin])");
  const rawInteractions = await holonClient.interactions.checkList([cidAspirin, cidWarfarin]);
  console.log("\nRAW CHECKLIST RESULT:");
  console.log(JSON.stringify(rawInteractions, null, 2));
}

async function testTask2() {
  console.log("\n=========================================================================");
  console.log("2. TESTING dtp.sandbox.grants() RETURN SHAPE & AUTH REQUIREMENT");
  console.log("=========================================================================");

  const dtpKey = process.env.DTP_KEY;

  // Test 1: Without sessionToken
  console.log("--- Test A: Without sessionToken ---");
  try {
    const dtpNoSession = new DTP({ apiKey: dtpKey });
    await dtpNoSession.sandbox.grants();
  } catch (err) {
    console.log("Caught Error:", err.message);
  }

  // Test 2: With sessionToken
  console.log("\n--- Test B: With sessionToken ---");
  const mockSessionToken = process.env.DTP_GRANT_TOKEN || "mock_session_token";
  try {
    const dtpWithSession = new DTP({
      apiKey: dtpKey,
      sessionToken: mockSessionToken
    });
    const grants = await dtpWithSession.sandbox.grants();
    console.log("Returned Grants Output:", JSON.stringify(grants, null, 2));
  } catch (err) {
    console.log("Caught Response Error:", err.message || err);
  }
}

async function run() {
  await testTask1();
  await testTask2();
}

run();
