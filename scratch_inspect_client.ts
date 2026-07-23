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

console.log("Client keys:", Object.keys(client));
console.log("Concepts proto:", Object.getOwnPropertyNames(Object.getPrototypeOf((client as any).concepts || {})));
console.log("Interactions proto:", Object.getOwnPropertyNames(Object.getPrototypeOf((client as any).interactions || {})));
