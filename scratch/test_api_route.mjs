async function testApiRoutes() {
  console.log("Fetching /api/twin/medications (normal call)...");
  try {
    const res1 = await fetch("http://localhost:3000/api/twin/medications");
    const json1 = await res1.json();
    console.log("Response 1 status:", res1.status, "Medications count:", json1.medications?.length);
  } catch (err) {
    console.error("Fetch 1 error:", err.message);
  }

  console.log("\nFetching /api/twin/medications?simulateExpired=true (simulating expired token)...");
  try {
    const res2 = await fetch("http://localhost:3000/api/twin/medications?simulateExpired=true");
    const json2 = await res2.json();
    console.log("Response 2 status:", res2.status, "Medications count:", json2.medications?.length);
  } catch (err) {
    console.error("Fetch 2 error:", err.message);
  }
}

testApiRoutes();
