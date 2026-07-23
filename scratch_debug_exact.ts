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

async function runExact() {
  console.log("=== Run 1: Calling check(5789167, 5790975) directly ===");
  const directCheck = await (client.interactions as any).check(5789167, 5790975);
  console.log("Direct check:", JSON.stringify(directCheck, null, 2));

  console.log("\n=== Run 2: Calling checkList([5789167, 5790975]) directly ===");
  const directCheckList = await client.interactions.checkList([5789167, 5790975]);
  console.log("Direct checkList:", JSON.stringify(directCheckList, null, 2));

  console.log("\n=== Run 3: Resolving concepts via getByCode first, THEN calling checkList ===");
  const resA = await client.concepts.getByCode("1191", "RxNorm");
  const resB = await client.concepts.getByCode("11289", "RxNorm");
  const cidA = resA?.concept?.conceptId;
  const cidB = resB?.concept?.conceptId;
  console.log("Resolved IDs:", cidA, cidB);

  const afterGetByCodeCheckList = await client.interactions.checkList([cidA!, cidB!]);
  console.log("CheckList after getByCode:", JSON.stringify(afterGetByCodeCheckList, null, 2));

  console.log("\n=== Run 4: Resolving ancestors too, THEN calling checkList ===");
  await client.concepts.getAncestors(cidA!);
  await client.concepts.getAncestors(cidB!);
  const afterAncestorsCheckList = await client.interactions.checkList([cidA!, cidB!]);
  console.log("CheckList after getAncestors:", JSON.stringify(afterAncestorsCheckList, null, 2));

  console.log("\n=== Run 5: Check with check(cidA, cidB) after resolution ===");
  const afterResolutionCheck = await (client.interactions as any).check(cidA!, cidB!);
  console.log("Check after resolution:", JSON.stringify(afterResolutionCheck, null, 2));
}

runExact();
