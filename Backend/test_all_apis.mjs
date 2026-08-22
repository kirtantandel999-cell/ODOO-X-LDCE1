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

async function runCompleteTestSuite() {
  console.log(`\n===============================================================`);
  console.log(`🌍 GLOBETROTTER COMPLETE API TEST SUITE`);
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

  // 1. HEALTH
  const health = await request("/");
  test(health.status === 200 && health.data.success === true, "GET / (Health Check)");

  // 2. AUTH
  const email = `final_test_${Date.now()}@example.com`;
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Rudra",
      lastName: "Patel",
      email,
      password: "Password@123",
      phoneNumber: "9876543210",
      city: "Ahmedabad",
      country: "India",
    }),
  });
  test(regRes.status === 201, "POST /api/auth/register");

  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password@123" }),
  });
  test(loginRes.status === 200 && !!loginRes.data.token, "POST /api/auth/login");
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const profRes = await request("/api/auth/profile", { headers: authHeaders });
  test(profRes.status === 200, "GET /api/auth/profile");

  const updateProfRes = await request("/api/auth/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ city: "Mumbai", additionalInformation: "Backpacker" }),
  });
  test(updateProfRes.status === 200 && updateProfRes.data.user.city === "Mumbai", "PUT /api/auth/profile");

  const patchProfRes = await request("/api/auth/profile", {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ city: "Pune" }),
  });
  test(patchProfRes.status === 200 && patchProfRes.data.user.city === "Pune", "PATCH /api/auth/profile");

  // Screen 7 Dashboard endpoints
  const userDashRes = await request("/api/users/me", { headers: authHeaders });
  test(userDashRes.status === 200 && userDashRes.data.data.user !== undefined, "GET /api/users/me (Screen 7 Profile Dashboard)");

  const preplannedTripsRes = await request("/api/users/me/trips/preplanned", { headers: authHeaders });
  test(preplannedTripsRes.status === 200 && Array.isArray(preplannedTripsRes.data.data), "GET /api/users/me/trips/preplanned");

  const prevTripsRes = await request("/api/users/me/trips/previous", { headers: authHeaders });
  test(prevTripsRes.status === 200 && Array.isArray(prevTripsRes.data.data), "GET /api/users/me/trips/previous");

  const tripSummaryRes = await request("/api/users/me/trips/summary", { headers: authHeaders });
  test(tripSummaryRes.status === 200 && typeof tripSummaryRes.data.data.totalTrips === "number", "GET /api/users/me/trips/summary");

  // 3. REGIONS
  const regionsRes = await request("/api/regions");
  test(regionsRes.status === 200 && regionsRes.data.data.length > 0, "GET /api/regions");
  const regionId = regionsRes.data.data[0].id;

  const regById = await request(`/api/regions/${regionId}`);
  test(regById.status === 200, `GET /api/regions/${regionId}`);

  const createReg = await request("/api/regions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: `TestReg_${Date.now()}` }),
  });
  test(createReg.status === 201, "POST /api/regions");
  const tempRegId = createReg.data.data.id;

  const updateReg = await request(`/api/regions/${tempRegId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ description: "Updated" }),
  });
  test(updateReg.status === 200, "PUT /api/regions/:id");

  const delReg = await request(`/api/regions/${tempRegId}`, { method: "DELETE", headers: authHeaders });
  test(delReg.status === 200, "DELETE /api/regions/:id");

  // 4. DESTINATIONS
  const destsRes = await request("/api/destinations");
  test(destsRes.status === 200, "GET /api/destinations");

  const destSearch = await request("/api/destinations/search?q=tokyo");
  test(destSearch.status === 200, "GET /api/destinations/search?q=tokyo");

  const destFilter = await request("/api/destinations?region=Asia&sort=popularity_desc");
  test(destFilter.status === 200, "GET /api/destinations (Filter & Sort)");

  const destGroup = await request("/api/destinations?groupBy=region");
  test(destGroup.status === 200, "GET /api/destinations?groupBy=region");

  const destId = destsRes.data.data.destinations[0].id;
  const singleDest = await request(`/api/destinations/${destId}`);
  test(singleDest.status === 200, `GET /api/destinations/${destId}`);

  const createDest = await request("/api/destinations", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: "Temp Dest", country: "Country", city: "City", regionId: 1 }),
  });
  test(createDest.status === 201, "POST /api/destinations");
  const tempDestId = createDest.data.data.id;

  const updateDest = await request(`/api/destinations/${tempDestId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ popularity: 99 }),
  });
  test(updateDest.status === 200, "PUT /api/destinations/:id");

  const delDest = await request(`/api/destinations/${tempDestId}`, { method: "DELETE", headers: authHeaders });
  test(delDest.status === 200, "DELETE /api/destinations/:id");

  // 5. ACTIVITIES
  const actsRes = await request("/api/activities?city=Tokyo");
  test(actsRes.status === 200, "GET /api/activities");

  const actSearch = await request("/api/activities/search?q=sushi");
  test(actSearch.status === 200, "GET /api/activities/search?q=sushi");

  const actId = actsRes.data.data.activities[0].id;
  const singleAct = await request(`/api/activities/${actId}`);
  test(singleAct.status === 200, `GET /api/activities/${actId}`);

  const createAct = await request("/api/activities", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: "Temp Act", category: "Sightseeing", city: "Tokyo", country: "Japan" }),
  });
  test(createAct.status === 201, "POST /api/activities");
  const tempActId = createAct.data.data.id;

  const updateAct = await request(`/api/activities/${tempActId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ popularity: 95 }),
  });
  test(updateAct.status === 200, "PUT /api/activities/:id");

  const delAct = await request(`/api/activities/${tempActId}`, { method: "DELETE", headers: authHeaders });
  test(delAct.status === 200, "DELETE /api/activities/:id");

  // 6. SCREEN 4: PLACES & SUGGESTIONS
  const placeSearch = await request("/api/trips/places/search?q=tokyo");
  test(placeSearch.status === 200, "GET /api/trips/places/search");

  const placesRegion = await request("/api/trips/places?regionId=1&city=Tokyo");
  test(placesRegion.status === 200, "GET /api/trips/places");

  const suggestions = await request("/api/trips/suggestions?destinationId=1&startDate=2026-10-10&endDate=2026-10-20&limit=6");
  test(suggestions.status === 200 && suggestions.data.data.places.length > 0, "GET /api/trips/suggestions");

  // 7. TRIPS & PLAN TRIP
  const planTrip = await request("/api/trips/plan", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Master Trip",
      destinationId: 1,
      destinationIds: [2],
      activityIds: [1, 2],
      startDate: "2026-10-10",
      endDate: "2026-10-20",
      budget: 200000,
    }),
  });
  test(planTrip.status === 201, "POST /api/trips/plan");
  const tripId = planTrip.data.data.id;

  // Screen 6 User Trips listing
  const allUserTrips = await request("/api/trips", { headers: authHeaders });
  test(allUserTrips.status === 200 && allUserTrips.data.data.ongoing !== undefined, "GET /api/trips (Screen 6 Main Listing)");

  const ongoingTrips = await request("/api/trips/ongoing", { headers: authHeaders });
  test(ongoingTrips.status === 200 && Array.isArray(ongoingTrips.data.data.ongoing), "GET /api/trips/ongoing");

  const upcomingTrips = await request("/api/trips/upcoming", { headers: authHeaders });
  test(upcomingTrips.status === 200 && Array.isArray(upcomingTrips.data.data.upcoming), "GET /api/trips/upcoming");

  const completedTrips = await request("/api/trips/completed", { headers: authHeaders });
  test(completedTrips.status === 200 && Array.isArray(completedTrips.data.data.completed), "GET /api/trips/completed");

  const searchTrips = await request("/api/trips?search=master", { headers: authHeaders });
  test(searchTrips.status === 200, "GET /api/trips?search=master");

  const filterTrips = await request("/api/trips?status=upcoming&sort=budget_desc", { headers: authHeaders });
  test(filterTrips.status === 200, "GET /api/trips?status=upcoming&sort=budget_desc");

  const groupTrips = await request("/api/trips?groupBy=destination", { headers: authHeaders });
  test(groupTrips.status === 200, "GET /api/trips?groupBy=destination");

  const paginateTrips = await request("/api/trips?page=1&limit=5", { headers: authHeaders });
  test(paginateTrips.status === 200 && paginateTrips.data.pagination.page === 1, "GET /api/trips?page=1&limit=5");

  const myTrips = await request("/api/trips/my", { headers: authHeaders });
  test(myTrips.status === 200, "GET /api/trips/my");

  const prevTrips = await request("/api/trips/previous", { headers: authHeaders });
  test(prevTrips.status === 200, "GET /api/trips/previous");

  const getTrip = await request(`/api/trips/${tripId}`, { headers: authHeaders });
  test(getTrip.status === 200 && getTrip.data.data.destinations.length === 2, `GET /api/trips/${tripId}`);

  const updateTrip = await request(`/api/trips/${tripId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "ONGOING" }),
  });
  test(updateTrip.status === 200, "PUT /api/trips/:id");

  // 8. TRIP DESTINATIONS SUB-RESOURCE
  const addDest = await request(`/api/trips/${tripId}/destinations`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ destinationId: 3, visitDate: "2026-10-15" }),
  });
  test(addDest.status === 201, "POST /api/trips/:tripId/destinations");
  const tdId = addDest.data.data.id;

  const getDests = await request(`/api/trips/${tripId}/destinations`, { headers: authHeaders });
  test(getDests.status === 200, "GET /api/trips/:tripId/destinations");

  const updateTD = await request(`/api/trips/${tripId}/destinations/${tdId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ notes: "Updated note" }),
  });
  test(updateTD.status === 200, "PUT /api/trips/:tripId/destinations/:tdId");

  const delTD = await request(`/api/trips/${tripId}/destinations/${tdId}`, { method: "DELETE", headers: authHeaders });
  test(delTD.status === 200, "DELETE /api/trips/:tripId/destinations/:tdId");

  // 9. TRIP ACTIVITIES SUB-RESOURCE
  const addAct = await request(`/api/trips/${tripId}/activities`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ activityId: 3, plannedDate: "2026-10-12" }),
  });
  test(addAct.status === 201, "POST /api/trips/:tripId/activities");
  const taId = addAct.data.data.id;

  const getActs = await request(`/api/trips/${tripId}/activities`, { headers: authHeaders });
  test(getActs.status === 200, "GET /api/trips/:tripId/activities");

  const updateTA = await request(`/api/trips/${tripId}/activities/${taId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ notes: "Updated act note" }),
  });
  test(updateTA.status === 200, "PUT /api/trips/:tripId/activities/:taId");

  const delTA = await request(`/api/trips/${tripId}/activities/${taId}`, { method: "DELETE", headers: authHeaders });
  test(delTA.status === 200, "DELETE /api/trips/:tripId/activities/:taId");

  // 10. SCREEN 5: TRIP SECTIONS
  const sec1 = await request(`/api/trips/${tripId}/sections`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Hotel Stay",
      type: "HOTEL",
      startDate: "2026-10-10",
      endDate: "2026-10-12",
      budget: 40000,
      order: 1,
    }),
  });
  test(sec1.status === 201, "POST /api/trips/:tripId/sections (Sec 1)");
  const sId1 = sec1.data.data.id;

  const sec2 = await request(`/api/trips/${tripId}/sections`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Sightseeing",
      type: "SIGHTSEEING",
      startDate: "2026-10-12",
      endDate: "2026-10-14",
      budget: 25000,
      order: 2,
    }),
  });
  test(sec2.status === 201, "POST /api/trips/:tripId/sections (Sec 2)");
  const sId2 = sec2.data.data.id;

  const sec3 = await request(`/api/trips/${tripId}/sections`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Kyoto Travel",
      type: "TRAVEL",
      startDate: "2026-10-15",
      endDate: "2026-10-16",
      budget: 30000,
    }),
  });
  test(sec3.status === 201, "POST /api/trips/:tripId/sections (Sec 3)");
  const sId3 = sec3.data.data.id;

  const getSecs = await request(`/api/trips/${tripId}/sections`, { headers: authHeaders });
  test(getSecs.status === 200 && getSecs.data.data.length === 3, "GET /api/trips/:tripId/sections");

  const getSingleSec = await request(`/api/trips/${tripId}/sections/${sId1}`, { headers: authHeaders });
  test(getSingleSec.status === 200, "GET /api/trips/:tripId/sections/:sectionId");

  const updateSec = await request(`/api/trips/${tripId}/sections/${sId1}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ budget: 45000 }),
  });
  test(updateSec.status === 200, "PUT /api/trips/:tripId/sections/:sectionId");

  const reorderSecs = await request(`/api/trips/${tripId}/sections/reorder`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ sectionIds: [sId3, sId1, sId2] }),
  });
  test(reorderSecs.status === 200 && reorderSecs.data.data[0].id === sId3, "PUT /api/trips/:tripId/sections/reorder");

  const linkDest = await request(`/api/trips/${tripId}/sections/${sId1}/destination`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ destinationId: 1 }),
  });
  test(linkDest.status === 200, "POST /api/trips/:tripId/sections/:id/destination");

  const unlinkDest = await request(`/api/trips/${tripId}/sections/${sId1}/destination`, {
    method: "DELETE",
    headers: authHeaders,
  });
  test(unlinkDest.status === 200, "DELETE /api/trips/:tripId/sections/:id/destination");

  const linkAct = await request(`/api/trips/${tripId}/sections/${sId1}/activity`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ activityId: 1 }),
  });
  test(linkAct.status === 200, "POST /api/trips/:tripId/sections/:id/activity");

  const unlinkAct = await request(`/api/trips/${tripId}/sections/${sId1}/activity`, {
    method: "DELETE",
    headers: authHeaders,
  });
  test(unlinkAct.status === 200, "DELETE /api/trips/:tripId/sections/:id/activity");

  const delSec = await request(`/api/trips/${tripId}/sections/${sId2}`, { method: "DELETE", headers: authHeaders });
  test(delSec.status === 200, "DELETE /api/trips/:tripId/sections/:sectionId");

  // 11. ITINERARY & BUDGET
  const itinerary = await request(`/api/trips/${tripId}/itinerary`, { headers: authHeaders });
  test(itinerary.status === 200 && Array.isArray(itinerary.data.data.sections), "GET /api/trips/:tripId/itinerary");

  const budget = await request(`/api/trips/${tripId}/budget`, { headers: authHeaders });
  test(budget.status === 200 && typeof budget.data.data.remainingBudget === "number", "GET /api/trips/:tripId/budget");

  // 12. HOMEPAGE & BANNERS
  const home = await request("/api/home", { headers: authHeaders });
  test(home.status === 200, "GET /api/home");

  const homeBanner = await request("/api/home/banner");
  test(homeBanner.status === 200, "GET /api/home/banner");

  const homeRegSel = await request("/api/home/regional-selections");
  test(homeRegSel.status === 200, "GET /api/home/regional-selections");

  const createBanner = await request("/api/banners", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ title: "Banner Test" }),
  });
  test(createBanner.status === 201, "POST /api/banners");
  const bId = createBanner.data.data.id;

  const getBanners = await request("/api/banners");
  test(getBanners.status === 200, "GET /api/banners");

  const getSingleBanner = await request(`/api/banners/${bId}`);
  test(getSingleBanner.status === 200, "GET /api/banners/:id");

  const updateBanner = await request(`/api/banners/${bId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ subtitle: "Updated" }),
  });
  test(updateBanner.status === 200, "PUT /api/banners/:id");

  const delBanner = await request(`/api/banners/${bId}`, { method: "DELETE", headers: authHeaders });
  test(delBanner.status === 200, "DELETE /api/banners/:id");

  // 13. SECURITY GUARDS
  const unauth = await request("/api/trips/my");
  test(unauth.status === 401, "Guard: 401 Unauthorized");

  const badDate = await request(`/api/trips/${tripId}/sections`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ title: "Bad", type: "HOTEL", startDate: "2026-10-20", endDate: "2026-10-10" }),
  });
  test(badDate.status === 400, "Guard: 400 Bad Request on invalid date order");

  // Cleanup trip
  await request(`/api/trips/${tripId}`, { method: "DELETE", headers: authHeaders });

  console.log(`\n===============================================================`);
  console.log(`🎯 TOTAL TESTS RUN : ${totalTests}`);
  console.log(`✅ PASSED           : ${passed}`);
  console.log(`❌ FAILED           : ${failed}`);
  console.log(`📊 SUCCESS RATE     : ${((passed / totalTests) * 100).toFixed(1)}%`);
  console.log(`===============================================================\n`);

  if (passed === totalTests && failed === 0) {
    console.log(`\n🎉🎉🎉 ============================== 🎉🎉🎉`);
    console.log(`            All API DONE`);
    console.log(`🎉🎉🎉 ============================== 🎉🎉🎉\n`);
  } else {
    process.exit(1);
  }
}

runCompleteTestSuite().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
