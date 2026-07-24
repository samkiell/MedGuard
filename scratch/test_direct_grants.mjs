import fs from 'fs';
import path from 'path';

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

const dtpKey = process.env.DTP_KEY;

async function testFetch() {
  console.log("Testing fetch to https://sandbox-api.ontomorph.com/grants with X-DTP-API-Key...");
  const res1 = await fetch("https://sandbox-api.ontomorph.com/grants", {
    headers: { "X-DTP-API-Key": dtpKey }
  });
  console.log("X-DTP-API-Key Status:", res1.status, await res1.text());

  console.log("Testing fetch with Bearer dtpKey...");
  const res2 = await fetch("https://sandbox-api.ontomorph.com/grants", {
    headers: { "Authorization": `Bearer ${dtpKey}` }
  });
  console.log("Bearer dtpKey Status:", res2.status, await res2.text());
}

testFetch();
