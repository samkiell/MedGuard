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

const holonKey = process.env.HOLON_KEY;
const holonApiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";

async function testVariations() {
  const holonClient = createHolonClient({ apiKey: holonKey, apiUrl: holonApiUrl });
  
  console.log("--- Testing checkList with string codes ['1191', '11289'] ---");
  const res1 = await holonClient.interactions.checkList(["1191", "11289"]).catch(e => e.message);
  console.log("Result string codes:", res1);

  console.log("--- Testing checkList with RxNorm URIs ['holon:rxnorm:1191', 'holon:rxnorm:11289'] ---");
  const res2 = await holonClient.interactions.checkList(["holon:rxnorm:1191", "holon:rxnorm:11289"]).catch(e => e.message);
  console.log("Result URIs:", res2);

  console.log("--- Testing getAncestors for Aspirin (5789167) ---");
  const ancA = await holonClient.concepts.getAncestors(5789167).catch(e => e.message);
  console.log("Aspirin Ancestors:", JSON.stringify(ancA, null, 2));

  console.log("--- Testing getAncestors for Warfarin (5790975) ---");
  const ancW = await holonClient.concepts.getAncestors(5790975).catch(e => e.message);
  console.log("Warfarin Ancestors:", JSON.stringify(ancW, null, 2));
}

testVariations();
