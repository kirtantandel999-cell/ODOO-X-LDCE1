const BASE_URL = `http://localhost:5000`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runScreen7Tests() {
  console.log(`\n===============================================================`);
  console.log(`👤 SCREEN 7: USER PROFILE & DASHBOARD TEST SUITE`);
  console.log(`===============================================================\n`);

  let totalTests = 0;
  let passed = 0;
  let failed = 0;

  function test(condition, name, details = "") {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  // 1. Login as test user
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "rudra@example.com", password: "Password@123" }),
  });
  test(loginRes.status === 200 && !!loginRes.data.token, "Login as test user");
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. GET /api/auth/profile
  const getProfileRes = await request("/api/auth/profile", { headers: authHeaders });
  test(
    getProfileRes.status === 200 &&
    getProfileRes.data.user.email === "rudra@example.com" &&
    getProfileRes.data.user.password === undefined,
    "GET /api/auth/profile (Password excluded)"
  );

  // 3. PUT /api/auth/profile (Full update)
  const putProfileRes = await request("/api/auth/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      firstName: "Rudra Updated",
      lastName: "Patel",
      phoneNumber: "9876543210",
      city: "Ahmedabad",
      country: "India",
      additionalInformation: "Updated traveler profile",
      photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
    }),
  });
  test(
    putProfileRes.status === 200 &&
    putProfileRes.data.user.firstName === "Rudra Updated" &&
    putProfileRes.data.user.additionalInformation === "Updated traveler profile",
    "PUT /api/auth/profile (Update profile fields)"
  );

  // 4. PATCH /api/auth/profile (Partial update)
  const patchProfileRes = await request("/api/auth/profile", {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      city: "Gandhinagar",
    }),
  });
  test(
    patchProfileRes.status === 200 &&
    patchProfileRes.data.user.city === "Gandhinagar" &&
    patchProfileRes.data.user.firstName === "Rudra Updated",
    "PATCH /api/auth/profile (Partial update)"
  );

  // 5. GET /api/users/me (Screen 7 Profile Dashboard)
  const dashboardRes = await request("/api/users/me", { headers: authHeaders });
  test(
    dashboardRes.status === 200 &&
    dashboardRes.data.data.user !== undefined &&
    Array.isArray(dashboardRes.data.data.preplannedTrips) &&
    Array.isArray(dashboardRes.data.data.previousTrips) &&
    dashboardRes.data.data.summary !== undefined &&
    dashboardRes.data.data.summary.preplannedCount >= 2 &&
    dashboardRes.data.data.summary.previousCount >= 2,
    "GET /api/users/me (Profile Dashboard with User, Preplanned, Previous & Summary)"
  );

  // 6. GET /api/users/me/trips/preplanned
  const preplannedRes = await request("/api/users/me/trips/preplanned", { headers: authHeaders });
  test(
    preplannedRes.status === 200 &&
    Array.isArray(preplannedRes.data.data) &&
    preplannedRes.data.data.length >= 2,
    "GET /api/users/me/trips/preplanned (Array of Preplanned Trips)"
  );

  // Check card structure of preplanned trip
  const preTrip = preplannedRes.data.data[0];
  test(
    preTrip &&
    typeof preTrip.id === "number" &&
    preTrip.title &&
    preTrip.destinationCount !== undefined &&
    preTrip.activityCount !== undefined &&
    preTrip.sectionCount !== undefined,
    "Preplanned Trip Card Summary Verification"
  );

  // 7. GET /api/users/me/trips/previous
  const prevTripsRes = await request("/api/users/me/trips/previous", { headers: authHeaders });
  test(
    prevTripsRes.status === 200 &&
    Array.isArray(prevTripsRes.data.data) &&
    prevTripsRes.data.data.length >= 2,
    "GET /api/users/me/trips/previous (Array of Previous Trips)"
  );

  // 8. GET /api/users/me/trips/summary
  const summaryRes = await request("/api/users/me/trips/summary", { headers: authHeaders });
  test(
    summaryRes.status === 200 &&
    summaryRes.data.data.totalTrips >= 5 &&
    summaryRes.data.data.preplannedTrips >= 2 &&
    summaryRes.data.data.previousTrips >= 2 &&
    summaryRes.data.data.ongoingTrips >= 1,
    "GET /api/users/me/trips/summary (Counts: total, preplanned, previous, ongoing)"
  );

  // 9. View Single Trip by ID (Screen 7 View Button)
  const singleTripRes = await request(`/api/trips/${preTrip.id}`, { headers: authHeaders });
  test(
    singleTripRes.status === 200 && singleTripRes.data.data.id === preTrip.id,
    `GET /api/trips/:id (View button on Profile Trip Card)`
  );

  // 10. Validation Checks
  const emptyName = await request("/api/auth/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ firstName: "" }),
  });
  test(emptyName.status === 400, "Validation: Reject empty firstName -> 400 Bad Request");

  const invalidPhone = await request("/api/auth/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ phoneNumber: "123" }),
  });
  test(invalidPhone.status === 400, "Validation: Reject short phoneNumber -> 400 Bad Request");

  const invalidPhoto = await request("/api/auth/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ photo: "not-a-valid-url" }),
  });
  test(invalidPhoto.status === 400, "Validation: Reject invalid photo URL -> 400 Bad Request");

  // 11. Security Checks
  const unauthMe = await request("/api/users/me");
  test(unauthMe.status === 401, "Security: 401 Unauthorized on /api/users/me without token");

  const unauthPre = await request("/api/users/me/trips/preplanned");
  test(unauthPre.status === 401, "Security: 401 Unauthorized on /api/users/me/trips/preplanned");

  // Cross-user test: User 2 cannot access User 1 dashboard or trip
  const user2Email = `user2_prof_${Date.now()}@example.com`;
  await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "User2",
      lastName: "Tester",
      email: user2Email,
      password: "Password@123",
      phoneNumber: "9876543210",
      city: "Paris",
      country: "France",
    }),
  });
  const login2 = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: user2Email, password: "Password@123" }),
  });
  const headers2 = { Authorization: `Bearer ${login2.data.token}` };

  const user2Dashboard = await request("/api/users/me", { headers: headers2 });
  test(
    user2Dashboard.status === 200 &&
    user2Dashboard.data.data.user.email === user2Email &&
    user2Dashboard.data.data.preplannedTrips.length === 0,
    "Security: User 2 gets own dashboard (0 preplanned trips)"
  );

  const crossTrip = await request(`/api/trips/${preTrip.id}`, { headers: headers2 });
  test(crossTrip.status === 403, "Security: User 2 cannot view User 1 private trip -> 403 Forbidden");

  console.log(`\n===============================================================`);
  console.log(`🎯 TOTAL TESTS RUN : ${totalTests}`);
  console.log(`✅ PASSED           : ${passed}`);
  console.log(`❌ FAILED           : ${failed}`);
  console.log(`📊 SUCCESS RATE     : ${((passed / totalTests) * 100).toFixed(1)}%`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runScreen7Tests().catch((e) => {
  console.error("Screen 7 test suite failed:", e);
  process.exit(1);
});
