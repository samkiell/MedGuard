async function runTest() {
  const medications = [
    { name: "aspirin", code: "1191" },
    { name: "warfarin", code: "11289" },
    { name: "lisinopril", code: "29046" }
  ];

  console.log("Testing POST http://localhost:3000/api/interactions/check...");
  try {
    const res = await fetch("http://localhost:3000/api/interactions/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medications })
    });

    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Interactions received:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Test error:", err);
  }
}

runTest();
