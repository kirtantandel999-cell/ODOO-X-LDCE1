import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const formatTripSummaryCard = (trip, todayStart, todayEnd) => {
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
  };
};

// ─────────────────────────────────────────────
// GET /api/users/me (Screen 7 Profile Dashboard)
// ─────────────────────────────────────────────
export const getProfileDashboard = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    const [user, trips] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          city: true,
          country: true,
          additionalInformation: true,
          photo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.trip.findMany({
        where: { userId },
        orderBy: { startDate: "asc" },
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
    ]);

    if (!user) {
      return fail(res, "User not found.", 404);
    }

    const preplannedTrips = [];
    const previousTrips = [];
    let ongoingCount = 0;

    for (const trip of trips) {
      const card = formatTripSummaryCard(trip, todayStart, todayEnd);
      if (card.tripStatus === "upcoming") {
        preplannedTrips.push(card);
      } else if (card.tripStatus === "completed") {
        previousTrips.push(card);
      } else if (card.tripStatus === "ongoing") {
        ongoingCount++;
      }
    }

    // Sort preplanned: nearest start date first
    preplannedTrips.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    // Sort previous: most recently completed first
    previousTrips.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    return ok(
      res,
      {
        user,
        preplannedTrips,
        previousTrips,
        summary: {
          preplannedCount: preplannedTrips.length,
          previousCount: previousTrips.length,
          ongoingCount,
          totalTrips: trips.length,
        },
      },
      "User profile dashboard fetched successfully."
    );
  } catch (error) {
    console.error("getProfileDashboard error:", error);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/users/me/trips/preplanned
// ─────────────────────────────────────────────
export const getPreplannedTrips = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        startDate: { gt: todayEnd },
        status: { not: "CANCELLED" },
      },
      orderBy: { startDate: "asc" },
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
    });

    const cards = trips.map((t) => formatTripSummaryCard(t, todayStart, todayEnd));

    return ok(res, cards, "Preplanned trips fetched successfully.");
  } catch (error) {
    console.error("getPreplannedTrips error:", error);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/users/me/trips/previous
// ─────────────────────────────────────────────
export const getPreviousTrips = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId,
        OR: [
          { endDate: { lt: todayStart } },
          { status: "COMPLETED" },
        ],
        status: { not: "CANCELLED" },
      },
      orderBy: { endDate: "desc" },
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
    });

    const cards = trips.map((t) => formatTripSummaryCard(t, todayStart, todayEnd));

    return ok(res, cards, "Previous trips fetched successfully.");
  } catch (error) {
    console.error("getPreviousTrips error:", error);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/users/me/trips/summary
// ─────────────────────────────────────────────
export const getTripSummary = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    const trips = await prisma.trip.findMany({
      where: { userId },
      select: { id: true, startDate: true, endDate: true, status: true },
    });

    let preplannedCount = 0;
    let ongoingCount = 0;
    let previousCount = 0;

    for (const t of trips) {
      if (t.status === "CANCELLED") continue;
      if (t.status === "COMPLETED" || new Date(t.endDate) < todayStart) {
        previousCount++;
      } else if (new Date(t.startDate) <= todayEnd && new Date(t.endDate) >= todayStart) {
        ongoingCount++;
      } else {
        preplannedCount++;
      }
    }

    return ok(
      res,
      {
        totalTrips: trips.length,
        preplannedTrips: preplannedCount,
        ongoingTrips: ongoingCount,
        previousTrips: previousCount,
      },
      "Trip summary fetched successfully."
    );
  } catch (error) {
    console.error("getTripSummary error:", error);
    return fail(res, "Internal server error.");
  }
};
