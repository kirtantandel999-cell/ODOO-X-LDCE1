import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

// ─────────────────────────────────────────────
// GET /api/home
// Returns: banner + regional selections + user's previous trips
// Authentication required (for trips)
// ─────────────────────────────────────────────
export const getHomePage = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  try {
    const [banner, regions, previousTrips] = await Promise.all([
      // Active banner
      prisma.banner.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),

      // Top regions with destination counts
      prisma.region.findMany({
        include: { _count: { select: { destinations: true } } },
        orderBy: { name: "asc" },
        take: 7,
      }),

      // User's previous / completed trips
      prisma.trip.findMany({
        where: {
          userId,
          OR: [
            { status: "COMPLETED" },
            { status: "CANCELLED" },
            { endDate: { lt: now } },
          ],
        },
        include: {
          tripDestinations: {
            include: {
              destination: { include: { region: { select: { id: true, name: true } } } },
            },
            orderBy: { order: "asc" },
            take: 3,
          },
        },
        orderBy: { endDate: "desc" },
        take: 5,
      }),
    ]);

    return ok(res, {
      banner,
      regionalSelections: regions.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        image: r.image,
        destinationCount: r._count.destinations,
      })),
      previousTrips,
    }, "Homepage data fetched successfully.");
  } catch (e) {
    console.error("getHomePage:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/home/banner
// Public
// ─────────────────────────────────────────────
export const getActiveBanner = async (req, res) => {
  try {
    const banner = await prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, banner, "Active banner fetched successfully.");
  } catch (e) {
    console.error("getActiveBanner:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/home/regional-selections
// Public
// ─────────────────────────────────────────────
export const getRegionalSelections = async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      include: {
        _count: { select: { destinations: true } },
        destinations: {
          select: { id: true, name: true, popularity: true, image: true, country: true },
          orderBy: { popularity: "desc" },
          take: 3,
        },
      },
      orderBy: { name: "asc" },
    });

    const data = regions.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      image: r.image,
      destinationCount: r._count.destinations,
      topDestinations: r.destinations,
    }));

    return ok(res, data, "Regional selections fetched successfully.");
  } catch (e) {
    console.error("getRegionalSelections:", e);
    return fail(res, "Internal server error.");
  }
};
