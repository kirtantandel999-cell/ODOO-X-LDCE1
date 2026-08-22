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

// ─────────────────────────────────────────────
// POST /api/trips
// ─────────────────────────────────────────────
export const createTrip = async (req, res) => {
  const { title, description, startDate, endDate, budget, currency, coverImage } = req.body;
  const userId = req.user.id;

  if (!title?.trim() || !startDate || !endDate)
    return fail(res, "title, startDate, and endDate are required.", 400);

  const dateErr = validateDates(startDate, endDate);
  if (dateErr) return fail(res, dateErr, 400);
  if (budget !== undefined && budget < 0) return fail(res, "Budget cannot be negative.", 400);

  try {
    const trip = await prisma.trip.create({
      data: {
        userId,
        title: title.trim(),
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget ? parseFloat(budget) : null,
        currency: currency || "INR",
        coverImage,
      },
      include: tripInclude,
    });
    return ok(res, trip, "Trip created successfully.", 201);
  } catch (e) {
    console.error("createTrip:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/plan  (transaction — atomic)
// ─────────────────────────────────────────────
export const planTrip = async (req, res) => {
  const { title, description, startDate, endDate, budget, currency, coverImage, destinationIds } = req.body;
  const userId = req.user.id;

  if (!title?.trim() || !startDate || !endDate)
    return fail(res, "title, startDate, and endDate are required.", 400);

  const dateErr = validateDates(startDate, endDate);
  if (dateErr) return fail(res, dateErr, 400);

  if (!Array.isArray(destinationIds) || destinationIds.length === 0)
    return fail(res, "destinationIds must be a non-empty array.", 400);

  const parsedIds = destinationIds.map((id) => parseInt(id));
  if (parsedIds.some(isNaN)) return fail(res, "All destinationIds must be valid integers.", 400);

  try {
    // Validate all destinations exist BEFORE transaction
    const foundDests = await prisma.destination.findMany({
      where: { id: { in: parsedIds } },
      select: { id: true },
    });

    if (foundDests.length !== parsedIds.length) {
      const foundIds = foundDests.map((d) => d.id);
      const missing = parsedIds.filter((id) => !foundIds.includes(id));
      return fail(res, `Destination(s) not found: ${missing.join(", ")}`, 404);
    }

    // Prisma transaction — rolls back if anything fails
    const trip = await prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: {
          userId,
          title: title.trim(),
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budget: budget ? parseFloat(budget) : null,
          currency: currency || "INR",
          coverImage,
        },
      });

      await tx.tripDestination.createMany({
        data: parsedIds.map((destinationId, index) => ({
          tripId: newTrip.id,
          destinationId,
          order: index + 1,
        })),
      });

      return tx.trip.findUnique({
        where: { id: newTrip.id },
        include: tripInclude,
      });
    });

    return ok(res, trip, "Trip planned successfully.", 201);
  } catch (e) {
    console.error("planTrip:", e);
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
    console.error("getMyTrips:", e);
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
    console.error("getPreviousTrips:", e);
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
    const trip = await prisma.trip.findUnique({ where: { id }, include: tripInclude });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);
    return ok(res, trip, "Trip fetched successfully.");
  } catch (e) {
    console.error("getTripById:", e);
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
    if (status && !validStatuses.includes(status))
      return fail(res, `status must be one of: ${validStatuses.join(", ")}`, 400);

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
    console.error("updateTrip:", e);
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

    await prisma.trip.delete({ where: { id } }); // cascade deletes TripDestinations
    return ok(res, null, "Trip deleted successfully.");
  } catch (e) {
    console.error("deleteTrip:", e);
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

    const dest = await prisma.destination.findUnique({ where: { id: dId } });
    if (!dest) return fail(res, "Destination not found.", 404);

    const td = await prisma.tripDestination.create({
      data: {
        tripId,
        destinationId: dId,
        visitDate: visitDate ? new Date(visitDate) : null,
        order: order ? parseInt(order) : 0,
        notes,
      },
      include: {
        destination: { include: { region: { select: { id: true, name: true } } } },
      },
    });
    return ok(res, td, "Destination added to trip.", 201);
  } catch (e) {
    console.error("addDestinationToTrip:", e);
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
    console.error("getTripDestinations:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/destinations/:tdId
// ─────────────────────────────────────────────
export const updateTripDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const tdId = parseInt(req.params.tdId);
  if (isNaN(tripId) || isNaN(tdId)) return fail(res, "Invalid ID.", 400);

  const { visitDate, order, notes } = req.body;

  try {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return fail(res, "Trip not found.", 404);
    if (trip.userId !== req.user.id) return fail(res, "Forbidden.", 403);

    const td = await prisma.tripDestination.findFirst({ where: { id: tdId, tripId } });
    if (!td) return fail(res, "Trip destination not found.", 404);

    const updated = await prisma.tripDestination.update({
      where: { id: tdId },
      data: {
        ...(visitDate !== undefined && { visitDate: visitDate ? new Date(visitDate) : null }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        destination: { include: { region: { select: { id: true, name: true } } } },
      },
    });
    return ok(res, updated, "Trip destination updated successfully.");
  } catch (e) {
    console.error("updateTripDestination:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/destinations/:tdId
// ─────────────────────────────────────────────
export const removeTripDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const tdId = parseInt(req.params.tdId);
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
    console.error("removeTripDestination:", e);
    return fail(res, "Internal server error.");
  }
};
