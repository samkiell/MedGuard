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

const client = createHolonClient({ apiKey, apiUrl } as any);

async function testAll() {
  console.log("Available interaction methods on client.interactions:", Object.keys(client.interactions || {}));
  console.log("Prototype interaction methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client.interactions || {})));

  const combinations = [
    { label: "RxNorm numeric [1191, 11289]", ids: [1191, 11289] },
    { label: "Concept IDs [5789167, 5790975]", ids: [5789167, 5790975] },
    { label: "Mixed [5789167, 5790975, 1191, 11289]", ids: [5789167, 5790975, 1191, 11289] },
  ];

  for (const c of combinations) {
    console.log(`\n=== Testing ${c.label} ===`);
    try {
      const checkRes = await (client.interactions as any).check(c.ids[0], c.ids[1]);
      console.log(`check(${c.ids[0]}, ${c.ids[1]}):`, JSON.stringify(checkRes, null, 2));
    } catch (e: any) {
      console.log(`check error:`, e?.message || e);
    }

    try {
      const checkListRes = await (client.interactions as any).checkList(c.ids);
      console.log(`checkList(${JSON.stringify(c.ids)}):`, JSON.stringify(checkListRes, null, 2));
    } catch (e: any) {
      console.log(`checkList error:`, e?.message || e);
    }
  }

  // Direct fetch to HOLON endpoints
  console.log("\n=== Testing Direct Fetch to HOLON Endpoints ===");
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "X-API-Key": apiKey,
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch(`${apiUrl}/v1/interactions/check?drugA=1191&drugB=11289`, { headers });
    console.log("GET /v1/interactions/check?drugA=1191&drugB=11289 status:", res.status, await res.json().catch(() => ({})));
  } catch (err: any) {
    console.log("GET /v1/interactions/check 1191/11289 err:", err?.message || err);
  }

  try {
    const res = await fetch(`${apiUrl}/v1/interactions/check?drugA=5789167&drugB=5790975`, { headers });
    console.log("GET /v1/interactions/check?drugA=5789167&drugB=5790975 status:", res.status, await res.json().catch(() => ({})));
  } catch (err: any) {
    console.log("GET /v1/interactions/check 5789167/5790975 err:", err?.message || err);
  }

  try {
    const res = await fetch(`${apiUrl}/v1/interactions/check-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ conceptIds: [1191, 11289] })
    });
    console.log("POST /v1/interactions/check-list [1191, 11289] status:", res.status, await res.json().catch(() => ({})));
  } catch (err: any) {
    console.log("POST /v1/interactions/check-list [1191, 11289] err:", err?.message || err);
  }

  try {
    const res = await fetch(`${apiUrl}/v1/interactions/check-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ conceptIds: [5789167, 5790975] })
    });
    console.log("POST /v1/interactions/check-list [5789167, 5790975] status:", res.status, await res.json().catch(() => ({})));
  } catch (err: any) {
    console.log("POST /v1/interactions/check-list [5789167, 5790975] err:", err?.message || err);
  }
}

testAll();
