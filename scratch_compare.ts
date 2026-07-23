import { createHolonClient } from "@ontomorph/holon-client";
import fs from "fs";

let apiKey = process.env.HOLON_KEY;
let apiUrl = process.env.HOLON_API_URL || "https://holon-api.ontomorph.com";

if (!apiKey && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (key === "HOLON_KEY") apiKey = value.trim();
      if (key === "HOLON_API_URL") apiUrl = value.trim();
    }
  }
}

if (!apiKey) {
  console.error("No HOLON_KEY found in .env.local");
  process.exit(1);
}

const client = createHolonClient({ apiKey, apiUrl } as any);

async function compare() {
  const cidA = 5789167; // Aspirin
  const cidB = 5790975; // Warfarin

  console.log("=================================================");
  console.log(`Testing HOLON interactions methods for concept IDs ${cidA} and ${cidB}`);
  console.log("=================================================");

  // 1. client.interactions.check(cidA, cidB)
  try {
    console.log("\n--- Method 1: client.interactions.check(cidA, cidB) ---");
    const res1 = await (client.interactions as any).check(cidA, cidB);
    console.log("Result 1:", JSON.stringify(res1, null, 2));
  } catch (err: any) {
    console.log("Method 1 Error:", err?.message || err);
  }

  // 2. client.interactions.checkList([cidA, cidB])
  try {
    console.log("\n--- Method 2: client.interactions.checkList([cidA, cidB]) ---");
    const res2 = await client.interactions.checkList([cidA, cidB]);
    console.log("Result 2:", JSON.stringify(res2, null, 2));
  } catch (err: any) {
    console.log("Method 2 Error:", err?.message || err);
  }

  // 3. client.interactions.check with object arguments if any
  try {
    console.log("\n--- Method 3: client.interactions.check({ conceptA: cidA, conceptB: cidB }) ---");
    const res3 = await (client.interactions as any).check({ conceptA: cidA, conceptB: cidB });
    console.log("Result 3:", JSON.stringify(res3, null, 2));
  } catch (err: any) {
    console.log("Method 3 Error:", err?.message || err);
  }

  // 4. client.interactions.check with RxNorm strings
  try {
    console.log("\n--- Method 4: client.interactions.check('1191', '11289') ---");
    const res4 = await (client.interactions as any).check("1191", "11289");
    console.log("Result 4:", JSON.stringify(res4, null, 2));
  } catch (err: any) {
    console.log("Method 4 Error:", err?.message || err);
  }

  // 5. client.interactions.checkList with RxNorm strings
  try {
    console.log("\n--- Method 5: client.interactions.checkList(['1191', '11289']) ---");
    const res5 = await (client.interactions as any).checkList(["1191", "11289"]);
    console.log("Result 5:", JSON.stringify(res5, null, 2));
  } catch (err: any) {
    console.log("Method 5 Error:", err?.message || err);
  }
}

compare();
