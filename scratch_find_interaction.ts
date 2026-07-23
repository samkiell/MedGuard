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

async function findInteractions() {
  const aspSearch = await client.concepts.search({ query: "aspirin" });
  const warSearch = await client.concepts.search({ query: "warfarin" });

  const aspIds = (aspSearch?.concepts || []).map((c: any) => c.conceptId);
  const warIds = (warSearch?.concepts || []).map((c: any) => c.conceptId);

  console.log("Aspirin Concept IDs:", aspIds);
  console.log("Warfarin Concept IDs:", warIds);

  for (const a of aspIds) {
    for (const w of warIds) {
      console.log(`Checking pair (${a}, ${w})...`);
      const checkRes = await (client.interactions as any).check(a, w).catch(() => null);
      if (checkRes && checkRes.hasInteraction) {
        console.log(`FOUND INTERACTION with check(${a}, ${w}):`, JSON.stringify(checkRes, null, 2));
      }

      const listRes = await client.interactions.checkList([a, w]).catch(() => null);
      if (listRes && listRes.totalInteractions > 0) {
        console.log(`FOUND INTERACTION with checkList([${a}, ${w}]):`, JSON.stringify(listRes, null, 2));
      }
    }
  }
}

findInteractions();
