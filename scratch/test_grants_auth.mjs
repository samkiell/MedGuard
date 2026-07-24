import fs from 'fs';
import path from 'path';
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

console.log("Checking environment variables:");
console.log("DTP_KEY:", process.env.DTP_KEY ? "Present" : "Missing");
console.log("DTP_SESSION_TOKEN:", process.env.DTP_SESSION_TOKEN ? "Present" : "Missing");
console.log("SESSION_TOKEN:", process.env.SESSION_TOKEN ? "Present" : "Missing");

async function test() {
  const dtp = new DTP({
    apiKey: process.env.DTP_KEY,
    sessionToken: process.env.DTP_SESSION_TOKEN || process.env.SESSION_TOKEN || process.env.DTP_KEY
  });

  try {
    const grants = await dtp.sandbox.grants();
    console.log("Grants success:", grants);
  } catch (err) {
    console.log("Grants error message:", err.message);
    if (err.statusCode || err.status) {
      console.log("Status code:", err.statusCode || err.status);
    }
  }
}

test();
