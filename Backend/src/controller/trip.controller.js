import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

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

// ─────────────────────────────────────────────
// GET /api/trips/my
// ─────────────────────────────────────────────
export const getMyTrips = async (req, res) => {
  const userId = req.user.id;

  try {
    const trips = await prisma.trip.findMany({
      where: { userId },
      include: tripInclude,
      orderBy: { createdAt: "desc" },
    });
    return ok(res, trips, "Your trips fetched successfully.");
  } catch (e) {
    console.error("getMyTrips error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/previous
// ─────────────────────────────────────────────
export const getPreviousTrips = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        OR: [
          { status: "COMPLETED" },
          { status: "CANCELLED" },
          { endDate: { lt: now } },
        ],
      },
      include: tripInclude,
      orderBy: { endDate: "desc" },
    });
    return ok(res, trips, "Previous trips fetched successfully.");
  } catch (e) {
    console.error("getPreviousTrips error:", e);
    return fail(res, "Internal server error.");
  }
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
      },
      "Trip fetched successfully."
    );
  } catch (e) {
    console.error("getTripById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/itinerary
// ─────────────────────────────────────────────
export const getTripItinerary = async (req, res) => {
  const tripId = parseInt(req.params.tripId || req.params.id);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: tripInclude,
    });

    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    // Build day-by-day dates array
    const days = [];
    const curr = new Date(start);
    let dayIndex = 1;

    while (curr <= end) {
      const dateStr = curr.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        dayNumber: dayIndex++,
        items: [],
      });
      curr.setDate(curr.getDate() + 1);
    }

    const unassignedItems = [];

    // Map destinations to days
    for (const td of trip.tripDestinations) {
      const item = {
        type: "DESTINATION",
        tripDestinationId: td.id,
        destination: td.destination,
        visitDate: td.visitDate,
        order: td.order,
        notes: td.notes,
      };

      if (td.visitDate) {
        const dStr = new Date(td.visitDate).toISOString().split("T")[0];
        const targetDay = days.find((d) => d.date === dStr);
        if (targetDay) {
          targetDay.items.push(item);
        } else {
          unassignedItems.push(item);
        }
      } else {
        unassignedItems.push(item);
      }
    }

    // Map activities to days
    for (const ta of trip.tripActivities) {
      const item = {
        type: "ACTIVITY",
        tripActivityId: ta.id,
        activity: ta.activity,
        plannedDate: ta.plannedDate,
        startTime: ta.startTime,
        endTime: ta.endTime,
        order: ta.order,
        notes: ta.notes,
      };

      if (ta.plannedDate) {
        const dStr = new Date(ta.plannedDate).toISOString().split("T")[0];
        const targetDay = days.find((d) => d.date === dStr);
        if (targetDay) {
          targetDay.items.push(item);
        } else {
          unassignedItems.push(item);
        }
      } else {
        unassignedItems.push(item);
      }
    }

    // Sort items inside each day by startTime and order
    for (const day of days) {
      day.items.sort((a, b) => {
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        return (a.order || 0) - (b.order || 0);
      });
    }

    return ok(
      res,
      {
        tripId: trip.id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        totalDays: days.length,
        itinerary: days,
        unassigned: unassignedItems,
      },
      "Trip itinerary fetched successfully."
    );
  } catch (e) {
    console.error("getTripItinerary error:", e);
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

  const { activityId, plannedDate, startTime, endTime, order, notes } = req.body;
  if (!activityId) return fail(res, "activityId is required.", 400);

  const aId = parseInt(activityId);
  if (isNaN(aId)) return fail(res, "Invalid activityId.", 400);

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

  const { plannedDate, startTime, endTime, order, notes } = req.body;

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
