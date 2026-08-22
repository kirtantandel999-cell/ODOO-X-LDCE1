import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

// ─── Shared include for trip ───────────────────────────────
const tripInclude = {
  tripDestinations: {
    include: {
      destination: {
        include: { region: { select: { id: true, name: true } } },
      },
    },
    orderBy: { order: "asc" },
  },
  tripActivities: {
    include: {
      activity: true,
    },
    orderBy: { order: "asc" },
  },
  sections: {
    include: {
      destination: {
        include: { region: { select: { id: true, name: true } } },
      },
      activity: true,
    },
    orderBy: { order: "asc" },
  },
};

// ─── Validate dates ────────────────────────────────────────
const validateDates = (startDate, endDate) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime())) return "Invalid startDate.";
  if (isNaN(e.getTime())) return "Invalid endDate.";
  if (e < s) return "endDate must be after startDate.";
  return null;
};

// ─── Check if date is within trip range ────────────────────
const isDateWithinTrip = (date, tripStart, tripEnd) => {
  const d = new Date(date);
  const start = new Date(tripStart);
  const end = new Date(tripEnd);
  // Compare by start of day and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
};

// ─────────────────────────────────────────────
// GET /api/trips/places/search?q=
// ─────────────────────────────────────────────
export const searchPlaces = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return fail(res, "Search query 'q' is required.", 400);

  try {
    const places = await prisma.destination.findMany({
      where: {
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" } },
          { city: { contains: q.trim(), mode: "insensitive" } },
          { country: { contains: q.trim(), mode: "insensitive" } },
          { region: { name: { contains: q.trim(), mode: "insensitive" } } },
        ],
      },
      include: {
        region: { select: { id: true, name: true } },
      },
      orderBy: { popularity: "desc" },
    });

    return ok(res, places, `Places matching "${q}".`);
  } catch (e) {
    console.error("searchPlaces error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/places?regionId=&city=&country=&search=&sort=
// ─────────────────────────────────────────────
export const getPlaces = async (req, res) => {
  const { regionId, city, country, search, sort = "popularity_desc" } = req.query;

  const where = {};

  if (regionId) {
    const rId = parseInt(regionId);
    if (!isNaN(rId)) where.regionId = rId;
  }

  if (city?.trim()) where.city = { contains: city.trim(), mode: "insensitive" };
  if (country?.trim()) where.country = { contains: country.trim(), mode: "insensitive" };

  if (search?.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { city: { contains: search.trim(), mode: "insensitive" } },
      { country: { contains: search.trim(), mode: "insensitive" } },
      { region: { name: { contains: search.trim(), mode: "insensitive" } } },
    ];
  }

  const sortMap = {
    name_asc: { name: "asc" },
    name_desc: { name: "desc" },
    popularity_asc: { popularity: "asc" },
    popularity_desc: { popularity: "desc" },
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
  };

  const orderBy = sortMap[sort] || sortMap.popularity_desc;

  try {
    const places = await prisma.destination.findMany({
      where,
      orderBy,
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    return ok(res, places, "Places fetched successfully.");
  } catch (e) {
    console.error("getPlaces error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/suggestions?destinationId=&startDate=&endDate=&limit=6
// ─────────────────────────────────────────────
export const getSuggestions = async (req, res) => {
  const { destinationId, startDate, endDate, limit = 6 } = req.query;

  if (!destinationId) {
    return fail(res, "destinationId is required.", 400);
  }

  const dId = parseInt(destinationId);
  if (isNaN(dId)) {
    return fail(res, "Invalid destinationId.", 400);
  }

  if (startDate && endDate) {
    const dateErr = validateDates(startDate, endDate);
    if (dateErr) return fail(res, dateErr, 400);
  }

  const takeCount = Math.max(1, parseInt(limit) || 6);

  try {
    const destination = await prisma.destination.findUnique({
      where: { id: dId },
      include: { region: true },
    });

    if (!destination) {
      return fail(res, "Destination not found.", 404);
    }

    // 1. Suggest Places (destinations in same city, country, or region, excluding current destination)
    let suggestedPlaces = await prisma.destination.findMany({
      where: {
        id: { not: dId },
        OR: [
          { city: { equals: destination.city, mode: "insensitive" } },
          { country: { equals: destination.country, mode: "insensitive" } },
          { regionId: destination.regionId },
        ],
      },
      include: {
        region: { select: { id: true, name: true } },
      },
      orderBy: { popularity: "desc" },
      take: takeCount,
    });

    // If not enough in same region, grab top popular destinations
    if (suggestedPlaces.length < takeCount) {
      const existingIds = [dId, ...suggestedPlaces.map((p) => p.id)];
      const additional = await prisma.destination.findMany({
        where: { id: { notIn: existingIds } },
        include: {
          region: { select: { id: true, name: true } },
        },
        orderBy: { popularity: "desc" },
        take: takeCount - suggestedPlaces.length,
      });
      suggestedPlaces = [...suggestedPlaces, ...additional];
    }

    // 2. Suggest Activities (activities in same city or country, or top popular)
    let suggestedActivities = await prisma.activity.findMany({
      where: {
        OR: [
          { city: { equals: destination.city, mode: "insensitive" } },
          { country: { equals: destination.country, mode: "insensitive" } },
        ],
      },
      orderBy: { popularity: "desc" },
      take: takeCount,
    });

    // If not enough in city/country, grab top popular activities
    if (suggestedActivities.length < takeCount) {
      const existingActIds = suggestedActivities.map((a) => a.id);
      const additionalActivities = await prisma.activity.findMany({
        where: { id: { notIn: existingActIds } },
        orderBy: { popularity: "desc" },
        take: takeCount - suggestedActivities.length,
      });
      suggestedActivities = [...suggestedActivities, ...additionalActivities];
    }

    return ok(
      res,
      {
        selectedDestination: destination,
        places: suggestedPlaces,
        activities: suggestedActivities,
      },
      "Trip suggestions fetched successfully."
    );
  } catch (e) {
    console.error("getSuggestions error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/plan (Transaction — Create Trip with destinations & activities)
// ─────────────────────────────────────────────
export const planTrip = async (req, res) => {
  const {
    title,
    description,
    startDate,
    endDate,
    budget,
    currency,
    coverImage,
    destinationId,
    destinationIds = [],
    activityIds = [],
  } = req.body;

  const userId = req.user.id;

  if (!title?.trim() || !startDate || !endDate) {
    return fail(res, "title, startDate, and endDate are required.", 400);
  }

  const dateErr = validateDates(startDate, endDate);
  if (dateErr) return fail(res, dateErr, 400);
  if (budget !== undefined && budget !== null && budget < 0) {
    return fail(res, "Budget cannot be negative.", 400);
  }

  // Collect destination IDs from destinationId or destinationIds
  let allDestIds = [];
  if (destinationId) {
    const singleId = parseInt(destinationId);
    if (!isNaN(singleId)) allDestIds.push(singleId);
  }
  if (Array.isArray(destinationIds)) {
    for (const dId of destinationIds) {
      const parsed = parseInt(dId);
      if (!isNaN(parsed) && !allDestIds.includes(parsed)) {
        allDestIds.push(parsed);
      }
    }
  }

  if (allDestIds.length === 0) {
    return fail(res, "At least one destination (destinationId or destinationIds) is required.", 400);
  }

  // Parse activity IDs
  let allActIds = [];
  if (Array.isArray(activityIds)) {
    for (const aId of activityIds) {
      const parsed = parseInt(aId);
      if (!isNaN(parsed) && !allActIds.includes(parsed)) {
        allActIds.push(parsed);
      }
    }
  }

  try {
    // Validate destination existence
    const foundDests = await prisma.destination.findMany({
      where: { id: { in: allDestIds } },
      select: { id: true, image: true },
    });

    if (foundDests.length !== allDestIds.length) {
      const foundIds = foundDests.map((d) => d.id);
      const missing = allDestIds.filter((id) => !foundIds.includes(id));
      return fail(res, `Invalid destinationId(s): ${missing.join(", ")}`, 404);
    }

    // Validate activity existence if provided
    if (allActIds.length > 0) {
      const foundActs = await prisma.activity.findMany({
        where: { id: { in: allActIds } },
        select: { id: true },
      });

      if (foundActs.length !== allActIds.length) {
        const foundIds = foundActs.map((a) => a.id);
        const missing = allActIds.filter((id) => !foundIds.includes(id));
        return fail(res, `Invalid activityId(s): ${missing.join(", ")}`, 404);
      }
    }

    // Default coverImage to first destination image if not supplied
    const finalCover = coverImage || foundDests[0]?.image || null;

    // Execute atomic transaction
    const trip = await prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: {
          userId,
          title: title.trim(),
          description: description || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budget: budget !== undefined && budget !== null ? parseFloat(budget) : null,
          currency: currency || "INR",
          coverImage: finalCover,
        },
      });

      // Create TripDestination records
      if (allDestIds.length > 0) {
        await tx.tripDestination.createMany({
          data: allDestIds.map((destId, index) => ({
            tripId: newTrip.id,
            destinationId: destId,
            order: index + 1,
            visitDate: new Date(startDate), // default visit date to start
          })),
        });
      }

      // Create TripActivity records
      if (allActIds.length > 0) {
        await tx.tripActivity.createMany({
          data: allActIds.map((actId, index) => ({
            tripId: newTrip.id,
            activityId: actId,
            order: index + 1,
            plannedDate: new Date(startDate), // default planned date to start
          })),
        });
      }

      return tx.trip.findUnique({
        where: { id: newTrip.id },
        include: tripInclude,
      });
    });

    return ok(res, trip, "Trip planned successfully.", 201);
  } catch (e) {
    console.error("planTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips (Basic Trip Create)
// ─────────────────────────────────────────────
export const createTrip = async (req, res) => {
  const { title, description, startDate, endDate, budget, currency, coverImage } = req.body;
  const userId = req.user.id;

  if (!title?.trim() || !startDate || !endDate)
    return fail(res, "title, startDate, and endDate are required.", 400);

  const dateErr = validateDates(startDate, endDate);
  if (dateErr) return fail(res, dateErr, 400);
  if (budget !== undefined && budget !== null && budget < 0)
    return fail(res, "Budget cannot be negative.", 400);

  try {
    const trip = await prisma.trip.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget !== undefined && budget !== null ? parseFloat(budget) : null,
        currency: currency || "INR",
        coverImage: coverImage || null,
      },
      include: tripInclude,
    });
    return ok(res, trip, "Trip created successfully.", 201);
  } catch (e) {
    console.error("createTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─── Helper: Format Trip Summary Card for Listing ─────────
const formatTripCard = (trip, todayStart, todayEnd) => {
  let tripStatus = "upcoming";
  if (trip.status === "CANCELLED") {
    tripStatus = "cancelled";
  } else if (trip.status === "COMPLETED" || new Date(trip.endDate) < todayStart) {
    tripStatus = "completed";
  } else if (new Date(trip.startDate) <= todayEnd && new Date(trip.endDate) >= todayStart) {
    tripStatus = "ongoing";
  } else {
    tripStatus = "upcoming";
  }

  const mainDestination = trip.tripDestinations?.[0]?.destination || null;

  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    tripStatus,
    status: trip.status,
    coverImage: trip.coverImage,
    budget: trip.budget,
    currency: trip.currency,
    mainDestination: mainDestination
      ? {
          id: mainDestination.id,
          name: mainDestination.name,
          city: mainDestination.city,
          country: mainDestination.country,
          image: mainDestination.image,
        }
      : null,
    destinationCount: trip._count?.tripDestinations || trip.tripDestinations?.length || 0,
    activityCount: trip._count?.tripActivities || trip.tripActivities?.length || 0,
    sectionCount: trip._count?.sections || trip.sections?.length || 0,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
};

// ─────────────────────────────────────────────
// GET /api/trips (Screen 6 Main User Trip Listing)
// Supports: search, status, startDate, endDate, destinationId,
//           minBudget, maxBudget, sort, groupBy, page, limit
// ─────────────────────────────────────────────
export const getUserTrips = async (req, res) => {
  const userId = req.user.id;
  const {
    search,
    status,
    startDate,
    endDate,
    destinationId,
    minBudget,
    maxBudget,
    sort = "start_date_asc",
    groupBy = "status",
    page = 1,
    limit = 10,
  } = req.query;

  // 1. Parameter Validation
  const validStatuses = ["ongoing", "upcoming", "completed", "cancelled"];
  if (status && !validStatuses.includes(String(status).toLowerCase())) {
    return fail(res, `Invalid status. Allowed values: ${validStatuses.join(", ")}`, 400);
  }

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    start_date_asc: { startDate: "asc" },
    start_date_desc: { startDate: "desc" },
    end_date_asc: { endDate: "asc" },
    end_date_desc: { endDate: "desc" },
    budget_asc: { budget: "asc" },
    budget_desc: { budget: "desc" },
    title_asc: { title: "asc" },
    title_desc: { title: "desc" },
  };
  if (sort && !validSortMap[sort]) {
    return fail(res, `Invalid sort parameter. Allowed values: ${Object.keys(validSortMap).join(", ")}`, 400);
  }

  const validGroupBy = ["status", "destination"];
  if (groupBy && !validGroupBy.includes(String(groupBy).toLowerCase())) {
    return fail(res, `Invalid groupBy parameter. Allowed values: ${validGroupBy.join(", ")}`, 400);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) {
    return fail(res, "Invalid page parameter. Must be an integer >= 1.", 400);
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  if (minBudget !== undefined) {
    const minB = parseFloat(minBudget);
    if (isNaN(minB) || minB < 0) return fail(res, "Invalid minBudget. Must be >= 0.", 400);
  }
  if (maxBudget !== undefined) {
    const maxB = parseFloat(maxBudget);
    if (isNaN(maxB) || maxB < 0) return fail(res, "Invalid maxBudget. Must be >= 0.", 400);
  }
  if (minBudget !== undefined && maxBudget !== undefined) {
    if (parseFloat(maxBudget) < parseFloat(minBudget)) {
      return fail(res, "maxBudget cannot be less than minBudget.", 400);
    }
  }

  if (startDate && isNaN(new Date(startDate).getTime())) {
    return fail(res, "Invalid startDate parameter.", 400);
  }
  if (endDate && isNaN(new Date(endDate).getTime())) {
    return fail(res, "Invalid endDate parameter.", 400);
  }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return fail(res, "endDate cannot be before startDate.", 400);
  }

  // 2. Build Where Clause
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const where = { userId };

  if (search?.trim()) {
    const s = search.trim();
    where.OR = [
      { title: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
      {
        tripDestinations: {
          some: {
            destination: {
              OR: [
                { name: { contains: s, mode: "insensitive" } },
                { city: { contains: s, mode: "insensitive" } },
                { country: { contains: s, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  if (destinationId) {
    const dId = parseInt(destinationId);
    if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);
    where.tripDestinations = { some: { destinationId: dId } };
  }

  if (minBudget !== undefined || maxBudget !== undefined) {
    where.budget = {
      ...(minBudget !== undefined && { gte: parseFloat(minBudget) }),
      ...(maxBudget !== undefined && { lte: parseFloat(maxBudget) }),
    };
  }

  if (startDate || endDate) {
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { ...(where.endDate || {}), lte: new Date(endDate) };
  }

  if (status) {
    const normalizedStatus = String(status).toLowerCase();
    if (normalizedStatus === "ongoing") {
      where.startDate = { ...(where.startDate || {}), lte: todayEnd };
      where.endDate = { ...(where.endDate || {}), gte: todayStart };
      where.status = { not: "CANCELLED" };
    } else if (normalizedStatus === "upcoming") {
      where.startDate = { ...(where.startDate || {}), gt: todayEnd };
      where.status = { not: "CANCELLED" };
    } else if (normalizedStatus === "completed") {
      where.OR = [
        { endDate: { lt: todayStart } },
        { status: "COMPLETED" },
      ];
      where.status = { not: "CANCELLED" };
    } else if (normalizedStatus === "cancelled") {
      where.status = "CANCELLED";
    }
  }

  const orderBy = validSortMap[sort] || { startDate: "asc" };

  try {
    // 3. Query Trips & Summary Counts
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [trips, totalMatching, allUserTrips] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          tripDestinations: {
            include: {
              destination: {
                select: { id: true, name: true, city: true, country: true, image: true },
              },
            },
            orderBy: { order: "asc" },
          },
          _count: {
            select: { tripDestinations: true, tripActivities: true, sections: true },
          },
        },
      }),
      prisma.trip.count({ where }),
      prisma.trip.findMany({
        where: { userId },
        select: { id: true, startDate: true, endDate: true, status: true },
      }),
    ]);

    // Format cards
    const cards = trips.map((t) => formatTripCard(t, todayStart, todayEnd));

    // Calculate user's overall summary counts
    let ongoingCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    for (const t of allUserTrips) {
      if (t.status === "CANCELLED") continue;
      if (t.status === "COMPLETED" || new Date(t.endDate) < todayStart) completedCount++;
      else if (new Date(t.startDate) <= todayEnd && new Date(t.endDate) >= todayStart) ongoingCount++;
      else upcomingCount++;
    }

    // Grouping
    let groupedData;
    if (String(groupBy).toLowerCase() === "destination") {
      groupedData = {};
      for (const c of cards) {
        const destKey = c.mainDestination?.name || "Other";
        if (!groupedData[destKey]) groupedData[destKey] = [];
        groupedData[destKey].push(c);
      }
    } else {
      // Default: status grouping
      groupedData = {
        ongoing: cards.filter((c) => c.tripStatus === "ongoing"),
        upcoming: cards.filter((c) => c.tripStatus === "upcoming"),
        completed: cards.filter((c) => c.tripStatus === "completed"),
      };
      if (cards.some((c) => c.tripStatus === "cancelled")) {
        groupedData.cancelled = cards.filter((c) => c.tripStatus === "cancelled");
      }
    }

    return ok(
      res,
      groupedData,
      "User trips fetched successfully.",
      200,
      {
        summary: {
          ongoingCount,
          upcomingCount,
          completedCount,
          totalCount: allUserTrips.length,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMatching,
          totalPages: Math.ceil(totalMatching / limitNum) || 1,
        },
      }
    );
  } catch (e) {
    console.error("getUserTrips error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/ongoing
// ─────────────────────────────────────────────
export const getOngoingTrips = async (req, res) => {
  req.query.status = "ongoing";
  req.query.sort = req.query.sort || "start_date_asc";
  return getUserTrips(req, res);
};

// ─────────────────────────────────────────────
// GET /api/trips/upcoming
// ─────────────────────────────────────────────
export const getUpcomingTrips = async (req, res) => {
  req.query.status = "upcoming";
  req.query.sort = req.query.sort || "start_date_asc";
  return getUserTrips(req, res);
};

// ─────────────────────────────────────────────
// GET /api/trips/completed
// ─────────────────────────────────────────────
export const getCompletedTrips = async (req, res) => {
  req.query.status = "completed";
  req.query.sort = req.query.sort || "end_date_desc";
  return getUserTrips(req, res);
};

// ─────────────────────────────────────────────
// GET /api/trips/my (Legacy alias)
// ─────────────────────────────────────────────
export const getMyTrips = async (req, res) => {
  return getUserTrips(req, res);
};

// ─────────────────────────────────────────────
// GET /api/trips/previous (Legacy alias)
// ─────────────────────────────────────────────
export const getPreviousTrips = async (req, res) => {
  req.query.status = "completed";
  return getUserTrips(req, res);
};

// ─────────────────────────────────────────────
// GET /api/trips/:id
// ─────────────────────────────────────────────
export const getTripById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid trip ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: tripInclude,
    });

    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    // Format primary destination helper
    const primaryDestination = trip.tripDestinations[0]?.destination || null;

    return ok(
      res,
      {
        ...trip,
        destination: primaryDestination,
        destinations: trip.tripDestinations,
        activities: trip.tripActivities,
        sections: trip.sections,
      },
      "Trip fetched successfully."
    );
  } catch (e) {
    console.error("getTripById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─── Helper: Clean Date Formatting ───────────────────────
const formatDateKey = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().split("T")[0];
};

const parseDateUTC = (dStr) => {
  const clean = String(dStr).split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/itinerary (Screen 9 Day-Wise Itinerary with Budget & Filters)
// Supports: search, date, startDate, endDate, category, destinationId, sort, groupBy
// ─────────────────────────────────────────────
export const getTripItinerary = async (req, res) => {
  const tripId = parseInt(req.params.tripId || req.params.id);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const {
    search,
    date,
    startDate,
    endDate,
    category,
    destinationId,
    sort = "order_asc",
    groupBy = "day",
  } = req.query;

  const validSorts = [
    "order_asc",
    "order_desc",
    "start_time_asc",
    "start_time_desc",
    "expense_asc",
    "expense_desc",
    "name_asc",
    "name_desc",
  ];
  if (sort && !validSorts.includes(sort)) {
    return fail(res, `Invalid sort parameter. Allowed values: ${validSorts.join(", ")}`, 400);
  }

  const validGroups = ["day", "category"];
  if (groupBy && !validGroups.includes(String(groupBy).toLowerCase())) {
    return fail(res, `Invalid groupBy parameter. Allowed values: day, category`, 400);
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: tripInclude,
    });

    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const startStr = formatDateKey(trip.startDate);
    const endStr = formatDateKey(trip.endDate);
    const startUTC = parseDateUTC(startStr);
    const endUTC = parseDateUTC(endStr);

    // Build all trip days dynamically in UTC
    const allDays = [];
    let curr = new Date(startUTC);
    let dayIndex = 1;

    while (curr <= endUTC) {
      const dateStr = curr.toISOString().split("T")[0];
      allDays.push({
        day: dayIndex++,
        date: dateStr,
        items: [],
        totalExpense: 0,
      });
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // Process TripActivities
    let activities = trip.tripActivities.map((ta) => {
      let dayNumber = null;
      let dateStr = null;

      if (ta.plannedDate) {
        dateStr = formatDateKey(ta.plannedDate);
        const itemUTC = parseDateUTC(dateStr);
        const diff = Math.round((itemUTC - startUTC) / (1000 * 60 * 60 * 24));
        dayNumber = diff + 1;
      }

      const itemExpense =
        ta.expense !== null && ta.expense !== undefined
          ? ta.expense
          : ta.activity?.estimatedCost || 0;

      return {
        id: ta.id,
        tripActivityId: ta.id,
        activityId: ta.activityId,
        activity: {
          id: ta.activity.id,
          name: ta.activity.name,
          description: ta.activity.description,
          category: ta.activity.category,
          image: ta.activity.image,
          city: ta.activity.city,
          country: ta.activity.country,
          estimatedCost: ta.activity.estimatedCost,
          estimatedDuration: ta.activity.estimatedDuration,
          destinationId: ta.activity.destinationId,
        },
        plannedDate: ta.plannedDate,
        day: dayNumber,
        date: dateStr,
        startTime: ta.startTime,
        endTime: ta.endTime,
        order: ta.order,
        expense: itemExpense,
        currency: ta.currency || trip.currency || "INR",
        notes: ta.notes,
      };
    });

    // Apply Search Filter
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      activities = activities.filter(
        (it) =>
          it.activity.name.toLowerCase().includes(q) ||
          (it.activity.description && it.activity.description.toLowerCase().includes(q)) ||
          (it.notes && it.notes.toLowerCase().includes(q)) ||
          (it.activity.city && it.activity.city.toLowerCase().includes(q)) ||
          (it.activity.country && it.activity.country.toLowerCase().includes(q))
      );
    }

    // Apply Category Filter
    if (category?.trim()) {
      const cat = category.trim().toLowerCase();
      activities = activities.filter(
        (it) => it.activity.category && it.activity.category.toLowerCase() === cat
      );
    }

    // Apply Destination Filter
    if (destinationId) {
      const dId = parseInt(destinationId);
      activities = activities.filter((it) => it.activity.destinationId === dId);
    }

    // Sort items
    const sortComparator = (a, b) => {
      if (sort === "start_time_asc") {
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return a.startTime ? -1 : 1;
      }
      if (sort === "start_time_desc") {
        if (a.startTime && b.startTime) return b.startTime.localeCompare(a.startTime);
        return a.startTime ? 1 : -1;
      }
      if (sort === "expense_asc") return (a.expense || 0) - (b.expense || 0);
      if (sort === "expense_desc") return (b.expense || 0) - (a.expense || 0);
      if (sort === "name_asc") return a.activity.name.localeCompare(b.activity.name);
      if (sort === "name_desc") return b.activity.name.localeCompare(a.activity.name);
      if (sort === "order_desc") return (b.order || 0) - (a.order || 0);
      return (a.order || 0) - (b.order || 0); // default: order_asc
    };

    activities.sort(sortComparator);

    // Group items into days
    const unassigned = [];
    for (const act of activities) {
      if (act.date) {
        const targetDay = allDays.find((d) => d.date === act.date);
        if (targetDay) {
          targetDay.items.push(act);
          targetDay.totalExpense += act.expense;
        } else {
          unassigned.push(act);
        }
      } else {
        unassigned.push(act);
      }
    }

    // Sort items inside each day
    for (const d of allDays) {
      d.items.sort(sortComparator);
    }

    // Filter days if date or startDate/endDate provided
    let finalDays = allDays;
    if (date) {
      finalDays = allDays.filter((d) => d.date === date);
    } else if (startDate || endDate) {
      finalDays = allDays.filter((d) => {
        let ok = true;
        if (startDate) ok = ok && d.date >= startDate;
        if (endDate) ok = ok && d.date <= endDate;
        return ok;
      });
    }

    // Calculate overall budget metrics
    const totalCalculatedExpense = allDays.reduce((sum, d) => sum + d.totalExpense, 0);
    const tripBudget = trip.budget || 0;
    const remainingBudget =
      trip.budget !== null && trip.budget !== undefined
        ? tripBudget - totalCalculatedExpense
        : null;
    const overBudget =
      trip.budget !== null && trip.budget !== undefined
        ? totalCalculatedExpense > tripBudget
        : false;

    // Handle groupBy = category
    if (String(groupBy).toLowerCase() === "category") {
      const groupedByCategory = {};
      for (const act of activities) {
        const cat = act.activity.category || "Uncategorized";
        if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
        groupedByCategory[cat].push(act);
      }

      return ok(
        res,
        {
          trip: {
            id: trip.id,
            title: trip.title,
            description: trip.description,
            startDate: trip.startDate,
            endDate: trip.endDate,
            status: trip.status,
            budget: trip.budget,
            currency: trip.currency,
            coverImage: trip.coverImage,
          },
          categories: groupedByCategory,
          summary: {
            totalActivities: activities.length,
            totalExpense: totalCalculatedExpense,
            tripBudget,
            remainingBudget,
            overBudget,
            currency: trip.currency || "INR",
          },
        },
        "Trip itinerary grouped by category fetched successfully."
      );
    }

    // Default: GroupBy Day
    return ok(
      res,
      {
        trip: {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          startDate: trip.startDate,
          endDate: trip.endDate,
          status: trip.status,
          budget: trip.budget,
          currency: trip.currency,
          coverImage: trip.coverImage,
        },
        days: finalDays,
        unassigned,
        summary: {
          totalDays: finalDays.length,
          totalActivities: activities.length,
          totalExpense: totalCalculatedExpense,
          tripBudget,
          remainingBudget,
          overBudget,
          currency: trip.currency || "INR",
        },
      },
      "Trip itinerary fetched successfully.",
      200,
      {
        tripId: trip.id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        totalDays: finalDays.length,
        sections: trip.sections,
        destinations: trip.tripDestinations,
        activities: trip.tripActivities,
        itinerary: finalDays,
      }
    );
  } catch (e) {
    console.error("getTripItinerary error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/itinerary/day/:date
// ─────────────────────────────────────────────
export const getTripItineraryDay = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const { date } = req.params;
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);
  if (!date || isNaN(new Date(date).getTime())) {
    return fail(res, "Invalid date parameter. Must be YYYY-MM-DD.", 400);
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: tripInclude,
    });

    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const targetDateStr = String(date).split("T")[0];
    const targetUTC = parseDateUTC(targetDateStr);
    const startStr = formatDateKey(trip.startDate);
    const startUTC = parseDateUTC(startStr);

    const diff = Math.round((targetUTC - startUTC) / (1000 * 60 * 60 * 24));
    const dayNumber = diff + 1;

    const dayActs = trip.tripActivities.filter((ta) => {
      if (!ta.plannedDate) return false;
      const dStr = formatDateKey(ta.plannedDate);
      return dStr === targetDateStr;
    });

    dayActs.sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    const items = dayActs.map((ta) => ({
      id: ta.id,
      tripActivityId: ta.id,
      activityId: ta.activityId,
      activity: {
        id: ta.activity.id,
        name: ta.activity.name,
        description: ta.activity.description,
        category: ta.activity.category,
        image: ta.activity.image,
        city: ta.activity.city,
        country: ta.activity.country,
      },
      plannedDate: ta.plannedDate,
      day: dayNumber,
      startTime: ta.startTime,
      endTime: ta.endTime,
      order: ta.order,
      expense:
        ta.expense !== null && ta.expense !== undefined
          ? ta.expense
          : ta.activity?.estimatedCost || 0,
      currency: ta.currency || trip.currency || "INR",
      notes: ta.notes,
    }));

    const totalExpense = items.reduce((sum, it) => sum + (it.expense || 0), 0);

    return ok(
      res,
      {
        day: dayNumber,
        date: targetDateStr,
        items,
        totalExpense,
        currency: trip.currency || "INR",
      },
      "Day itinerary fetched successfully."
    );
  } catch (e) {
    console.error("getTripItineraryDay error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/itinerary/reorder
// ─────────────────────────────────────────────
export const reorderItinerary = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { itemIds, date } = req.body;
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return fail(res, "itemIds must be a non-empty array of tripActivity IDs.", 400);
  }

  const parsedIds = itemIds.map((id) => parseInt(id));
  if (parsedIds.some(isNaN)) {
    return fail(res, "All itemIds must be valid integers.", 400);
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const existing = await prisma.tripActivity.findMany({
      where: { id: { in: parsedIds }, tripId },
      select: { id: true },
    });

    if (existing.length !== parsedIds.length) {
      return fail(res, "One or more itemIds do not belong to this trip.", 404);
    }

    await prisma.$transaction(
      parsedIds.map((id, index) =>
        prisma.tripActivity.update({
          where: { id },
          data: {
            order: index + 1,
            ...(date ? { plannedDate: new Date(date) } : {}),
          },
        })
      )
    );

    const updatedItems = await prisma.tripActivity.findMany({
      where: { id: { in: parsedIds } },
      include: { activity: true },
      orderBy: { order: "asc" },
    });

    return ok(res, updatedItems, "Itinerary items reordered successfully.");
  } catch (e) {
    console.error("reorderItinerary error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:id
// ─────────────────────────────────────────────
export const updateTrip = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid trip ID.", 400);

  const { title, description, startDate, endDate, status, budget, currency, coverImage } = req.body;

  try {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    if (startDate && endDate) {
      const dateErr = validateDates(startDate, endDate);
      if (dateErr) return fail(res, dateErr, 400);
    }

    const validStatuses = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return fail(res, `status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(budget !== undefined && { budget: budget !== null ? parseFloat(budget) : null }),
        ...(currency && { currency }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: tripInclude,
    });

    return ok(res, updated, "Trip updated successfully.");
  } catch (e) {
    console.error("updateTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:id
// ─────────────────────────────────────────────
export const deleteTrip = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid trip ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    await prisma.trip.delete({ where: { id } });
    return ok(res, null, "Trip deleted successfully.");
  } catch (e) {
    console.error("deleteTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/:tripId/destinations
// ─────────────────────────────────────────────
export const addDestinationToTrip = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { destinationId, visitDate, order, notes } = req.body;
  if (!destinationId) return fail(res, "destinationId is required.", 400);

  const dId = parseInt(destinationId);
  if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    if (visitDate && !isDateWithinTrip(visitDate, trip.startDate, trip.endDate)) {
      return fail(res, "visitDate must be within the trip startDate and endDate.", 400);
    }

    const dest = await prisma.destination.findUnique({ where: { id: dId } });
    if (!dest) return fail(res, "Destination not found.", 404);

    const td = await prisma.tripDestination.create({
      data: {
        tripId,
        destinationId: dId,
        visitDate: visitDate ? new Date(visitDate) : null,
        order: order ? parseInt(order) : 0,
        notes: notes || null,
      },
      include: {
        destination: { include: { region: { select: { id: true, name: true } } } },
      },
    });

    return ok(res, td, "Destination added to trip.", 201);
  } catch (e) {
    console.error("addDestinationToTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/destinations
// ─────────────────────────────────────────────
export const getTripDestinations = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const destinations = await prisma.tripDestination.findMany({
      where: { tripId },
      include: {
        destination: { include: { region: { select: { id: true, name: true } } } },
      },
      orderBy: { order: "asc" },
    });

    return ok(res, destinations, "Trip destinations fetched successfully.");
  } catch (e) {
    console.error("getTripDestinations error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/destinations/:tdId
// ─────────────────────────────────────────────
export const updateTripDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const tdId = parseInt(req.params.tdId || req.params.tripDestinationId);
  if (isNaN(tripId) || isNaN(tdId)) return fail(res, "Invalid ID.", 400);

  const { visitDate, order, notes } = req.body;

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    if (visitDate && !isDateWithinTrip(visitDate, trip.startDate, trip.endDate)) {
      return fail(res, "visitDate must be within the trip startDate and endDate.", 400);
    }

    const td = await prisma.tripDestination.findFirst({ where: { id: tdId, tripId } });
    if (!td) return fail(res, "Trip destination not found.", 404);

    const updated = await prisma.tripDestination.update({
      where: { id: tdId },
      data: {
        ...(visitDate !== undefined && {
          visitDate: visitDate ? new Date(visitDate) : null,
        }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        destination: { include: { region: { select: { id: true, name: true } } } },
      },
    });

    return ok(res, updated, "Trip destination updated successfully.");
  } catch (e) {
    console.error("updateTripDestination error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/destinations/:tdId
// ─────────────────────────────────────────────
export const removeTripDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const tdId = parseInt(req.params.tdId || req.params.tripDestinationId);
  if (isNaN(tripId) || isNaN(tdId)) return fail(res, "Invalid ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const td = await prisma.tripDestination.findFirst({ where: { id: tdId, tripId } });
    if (!td) return fail(res, "Trip destination not found.", 404);

    await prisma.tripDestination.delete({ where: { id: tdId } });
    return ok(res, null, "Destination removed from trip.");
  } catch (e) {
    console.error("removeTripDestination error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/:tripId/activities
// ─────────────────────────────────────────────
export const addActivityToTrip = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { activityId, plannedDate, startTime, endTime, order, expense, currency, notes } = req.body;
  if (!activityId) return fail(res, "activityId is required.", 400);

  const aId = parseInt(activityId);
  if (isNaN(aId)) return fail(res, "Invalid activityId.", 400);

  if (expense !== undefined && expense !== null) {
    const exp = parseFloat(expense);
    if (isNaN(exp) || exp < 0) return fail(res, "expense cannot be negative.", 400);
  }

  if (startTime && endTime && startTime > endTime) {
    return fail(res, "startTime cannot be after endTime.", 400);
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    if (plannedDate && !isDateWithinTrip(plannedDate, trip.startDate, trip.endDate)) {
      return fail(res, "plannedDate must be within the trip startDate and endDate.", 400);
    }

    const activity = await prisma.activity.findUnique({ where: { id: aId } });
    if (!activity) return fail(res, "Activity not found.", 404);

    const ta = await prisma.tripActivity.create({
      data: {
        tripId,
        activityId: aId,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        order: order ? parseInt(order) : 0,
        expense: expense !== undefined && expense !== null ? parseFloat(expense) : (activity.estimatedCost || 0),
        currency: currency || trip.currency || "INR",
        notes: notes || null,
      },
      include: {
        activity: true,
      },
    });

    return ok(res, ta, "Activity added to trip.", 201);
  } catch (e) {
    console.error("addActivityToTrip error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/activities
// ─────────────────────────────────────────────
export const getTripActivities = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const activities = await prisma.tripActivity.findMany({
      where: { tripId },
      include: {
        activity: true,
      },
      orderBy: { order: "asc" },
    });

    return ok(res, activities, "Trip activities fetched successfully.");
  } catch (e) {
    console.error("getTripActivities error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/activities/:tripActivityId
// ─────────────────────────────────────────────
export const updateTripActivity = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const taId = parseInt(req.params.tripActivityId || req.params.taId);
  if (isNaN(tripId) || isNaN(taId)) return fail(res, "Invalid ID.", 400);

  const { plannedDate, startTime, endTime, order, expense, currency, notes } = req.body;

  if (expense !== undefined && expense !== null) {
    const exp = parseFloat(expense);
    if (isNaN(exp) || exp < 0) return fail(res, "expense cannot be negative.", 400);
  }

  if (startTime && endTime && startTime > endTime) {
    return fail(res, "startTime cannot be after endTime.", 400);
  }

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    if (plannedDate && !isDateWithinTrip(plannedDate, trip.startDate, trip.endDate)) {
      return fail(res, "plannedDate must be within the trip startDate and endDate.", 400);
    }

    const ta = await prisma.tripActivity.findFirst({ where: { id: taId, tripId } });
    if (!ta) return fail(res, "Trip activity not found.", 404);

    const updated = await prisma.tripActivity.update({
      where: { id: taId },
      data: {
        ...(plannedDate !== undefined && {
          plannedDate: plannedDate ? new Date(plannedDate) : null,
        }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(expense !== undefined && {
          expense: expense !== null ? parseFloat(expense) : 0,
        }),
        ...(currency !== undefined && { currency }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        activity: true,
      },
    });

    return ok(res, updated, "Trip activity updated successfully.");
  } catch (e) {
    console.error("updateTripActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/activities/:tripActivityId
// ─────────────────────────────────────────────
export const removeTripActivity = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const taId = parseInt(req.params.tripActivityId || req.params.taId);
  if (isNaN(tripId) || isNaN(taId)) return fail(res, "Invalid ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const ta = await prisma.tripActivity.findFirst({ where: { id: taId, tripId } });
    if (!ta) return fail(res, "Trip activity not found.", 404);

    await prisma.tripActivity.delete({ where: { id: taId } });
    return ok(res, null, "Activity removed from trip.");
  } catch (e) {
    console.error("removeTripActivity error:", e);
    return fail(res, "Internal server error.");
  }
};
