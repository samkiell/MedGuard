async function testFetchRawToken() {
  const apiKey = "dtp_test_personal_d9b85e95979fd7cd7abc1b1ce5183bc2bfd5bf31a335e10544591b62c807bed8";
  const token = "dtp_grant_sandbox-twin-1_1784765181304";

  const res = await fetch("https://api.ontomorph.com/provider/twins/sandbox-twin-1/events", {
    headers: {
      "X-DTP-API-Key": apiKey,
      "Authorization": `Bearer ${token}`,
    },
  });

  console.log("Raw Token Status:", res.status);
  const text = await res.text();
  console.log("Raw Token Response:", text);
}

testFetchRawToken();
