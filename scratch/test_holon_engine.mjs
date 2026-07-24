import fs from 'fs';
import path from 'path';
import { createHolonClient } from "@ontomorph/holon-client";

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

const holonKey = process.env.HOLON_KEY;
const holonApiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";

const client = createHolonClient({ apiKey: holonKey, apiUrl: holonApiUrl });

async function runTests() {
  console.log("=== TEST 1A: Numbers [5789167, 5790975] ===");
  try {
    const res = await client.interactions.checkList([5789167, 5790975]);
    console.log("RESULT (Numbers):", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR (Numbers):", err.message, err.details);
  }

  console.log("\n=== TEST 1B: Strings ['5789167', '5790975'] ===");
  try {
    const res = await client.interactions.checkList(["5789167", "5790975"]);
    console.log("RESULT (Strings):", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR (Strings):", err.message, err.details);
  }

  console.log("\n=== TEST 2A: Numbers check(5789167, 5790975) ===");
  try {
    const res = await client.interactions.check(5789167, 5790975);
    console.log("RESULT (Numbers):", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR (Numbers):", err.message, err.details);
  }

  console.log("\n=== TEST 2B: Strings check('5789167', '5790975') ===");
  try {
    const res = await client.interactions.check("5789167", "5790975");
    console.log("RESULT (Strings):", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR (Strings):", err.message, err.details);
  }
}

runTests();
