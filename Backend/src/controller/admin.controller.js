import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  active: true,
  phoneNumber: true,
  city: true,
  country: true,
  photo: true,
  additionalInformation: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      trips: true,
      communityPosts: true,
    },
  },
};

// ─────────────────────────────────────────────
// GET /api/admin/dashboard
// ─────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  const now = new Date();
  const startOfCurrentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));

  try {
    const [
      totalUsers,
      newUsersThisMonth,
      totalTrips,
      upcomingTrips,
      ongoingTrips,
      completedTrips,
      totalPosts,
      destinationsGroup,
      activitiesGroup,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { startDate: { gt: now } } }),
      prisma.trip.count({ where: { startDate: { lte: now }, endDate: { gte: now } } }),
      prisma.trip.count({ where: { endDate: { lt: now } } }),
      prisma.communityPost.count(),
      prisma.tripDestination.groupBy({
        by: ["destinationId"],
        _count: { tripId: true },
        orderBy: { _count: { tripId: "desc" } },
        take: 5,
      }),
      prisma.tripActivity.groupBy({
        by: ["activityId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    // Fetch details for top destinations
    const destIds = destinationsGroup.map((d) => d.destinationId);
    const topDests = await prisma.destination.findMany({
      where: { id: { in: destIds } },
      select: { id: true, name: true, city: true, country: true, image: true },
    });

    const popularCities = destinationsGroup.map((g) => {
      const dest = topDests.find((d) => d.id === g.destinationId);
      return {
        destinationId: g.destinationId,
        name: dest?.name || "Unknown",
        city: dest?.city || "Unknown",
        country: dest?.country || "Unknown",
        image: dest?.image || null,
        tripCount: g._count.tripId,
      };
    });

    // Fetch details for top activities
    const actIds = activitiesGroup.map((a) => a.activityId);
    const topActs = await prisma.activity.findMany({
      where: { id: { in: actIds } },
      select: { id: true, name: true, category: true, city: true, country: true, image: true },
    });

    const popularActivities = activitiesGroup.map((g) => {
      const act = topActs.find((a) => a.id === g.activityId);
      return {
        activityId: g.activityId,
        name: act?.name || "Unknown",
        category: act?.category || "Unknown",
        city: act?.city || "Unknown",
        country: act?.country || "Unknown",
        image: act?.image || null,
        usageCount: g._count.id,
      };
    });

    return ok(
      res,
      {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        trips: {
          total: totalTrips,
          upcoming: upcomingTrips,
          ongoing: ongoingTrips,
          completed: completedTrips,
        },
        community: {
          totalPosts,
        },
        popularCities,
        popularActivities,
      },
      "Admin dashboard metrics fetched successfully."
    );
  } catch (e) {
    console.error("getDashboard error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users (Manage Users)
// ─────────────────────────────────────────────
export const getUsers = async (req, res) => {
  const { search, q, role, status, sort = "newest", page = 1, limit = 10 } = req.query;

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    name_asc: { firstName: "asc" },
    name_desc: { firstName: "desc" },
    email_asc: { email: "asc" },
    email_desc: { email: "desc" },
  };

  if (sort && !validSortMap[sort]) {
    return fail(
      res,
      `Invalid sort parameter. Allowed values: ${Object.keys(validSortMap).join(", ")}`,
      400
    );
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) {
    return fail(res, "Invalid page parameter. Must be an integer >= 1.", 400);
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  const where = {};
  const queryTerm = (search || q || "").trim();

  if (queryTerm) {
    where.OR = [
      { firstName: { contains: queryTerm, mode: "insensitive" } },
      { lastName: { contains: queryTerm, mode: "insensitive" } },
      { email: { contains: queryTerm, mode: "insensitive" } },
      { city: { contains: queryTerm, mode: "insensitive" } },
      { country: { contains: queryTerm, mode: "insensitive" } },
    ];
  }

  if (role) {
    const roleUpper = role.trim().toUpperCase();
    if (roleUpper !== "USER" && roleUpper !== "ADMIN") {
      return fail(res, "Invalid role filter. Allowed values: USER, ADMIN", 400);
    }
    where.role = roleUpper;
  }

  if (status) {
    const sLower = status.trim().toLowerCase();
    if (sLower === "active" || sLower === "true") where.active = true;
    else if (sLower === "inactive" || sLower === "false") where.active = false;
    else return fail(res, "Invalid status filter. Allowed values: active, inactive", 400);
  }

  const orderBy = validSortMap[sort] || validSortMap.newest;
  const skip = (pageNum - 1) * limitNum;

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      active: u.active,
      phoneNumber: u.phoneNumber,
      city: u.city,
      country: u.country,
      photo: u.photo,
      additionalInformation: u.additionalInformation,
      tripCount: u._count.trips,
      communityPostCount: u._count.communityPosts,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return ok(
      res,
      formattedUsers,
      "Users fetched successfully.",
      200,
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || (total === 0 ? 0 : 1),
        },
      }
    );
  } catch (e) {
    console.error("getUsers error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users/:userId (User Details)
// ─────────────────────────────────────────────
export const getUserById = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return fail(res, "Invalid user ID.", 400);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect,
        trips: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
            budget: true,
            currency: true,
          },
        },
      },
    });

    if (!user) return fail(res, "User not found.", 404);

    const data = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      active: user.active,
      phoneNumber: user.phoneNumber,
      city: user.city,
      country: user.country,
      photo: user.photo,
      additionalInformation: user.additionalInformation,
      tripCount: user._count.trips,
      communityPostCount: user._count.communityPosts,
      recentTrips: user.trips,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return ok(res, data, "User details fetched successfully.");
  } catch (e) {
    console.error("getUserById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users/:userId/trips
// ─────────────────────────────────────────────
export const getUserTrips = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return fail(res, "Invalid user ID.", 400);

  const { status, sort = "newest", page = 1, limit = 10 } = req.query;

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    start_date_asc: { startDate: "asc" },
    start_date_desc: { startDate: "desc" },
  };

  const orderBy = validSortMap[sort] || validSortMap.newest;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where = { userId };
  if (status) {
    const sUpper = status.trim().toUpperCase();
    where.status = sUpper;
  }

  try {
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          tripDestinations: { include: { destination: true } },
          _count: { select: { tripActivities: true, sections: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return ok(
      res,
      trips,
      "User trips fetched successfully.",
      200,
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || (total === 0 ? 0 : 1),
        },
      }
    );
  } catch (e) {
    console.error("getUserTrips error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/users/:userId/community
// ─────────────────────────────────────────────
export const getUserCommunityPosts = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return fail(res, "Invalid user ID.", 400);

  const { page = 1, limit = 10, sort = "newest" } = req.query;

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    rating_desc: { rating: "desc" },
  };

  const orderBy = validSortMap[sort] || validSortMap.newest;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  try {
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { userId },
        orderBy,
        skip,
        take: limitNum,
        include: {
          destination: true,
          activity: true,
          trip: true,
        },
      }),
      prisma.communityPost.count({ where: { userId } }),
    ]);

    return ok(
      res,
      posts,
      "User community posts fetched successfully.",
      200,
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || (total === 0 ? 0 : 1),
        },
      }
    );
  } catch (e) {
    console.error("getUserCommunityPosts error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:userId/status (Activate / Deactivate)
// ─────────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return fail(res, "Invalid user ID.", 400);

  const { active, status } = req.body;
  let targetActive;

  if (active !== undefined) {
    targetActive = Boolean(active);
  } else if (status !== undefined) {
    targetActive = String(status).toLowerCase() === "active";
  } else {
    return fail(res, "active boolean or status ('active'/'inactive') is required in request body.", 400);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return fail(res, "User not found.", 404);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: targetActive },
      select: userSelect,
    });

    return ok(res, updated, `User ${targetActive ? "activated" : "deactivated"} successfully.`);
  } catch (e) {
    console.error("updateUserStatus error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/popular-cities
// ─────────────────────────────────────────────
export const getPopularCities = async (req, res) => {
  const { search, q, sort = "popularity_desc", limit = 10 } = req.query;

  const validSorts = ["popularity_desc", "popularity_asc", "name_asc", "name_desc"];
  if (sort && !validSorts.includes(sort)) {
    return fail(res, `Invalid sort parameter. Allowed values: ${validSorts.join(", ")}`, 400);
  }

  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  const queryTerm = (search || q || "").trim();

  try {
    const where = {};
    if (queryTerm) {
      where.OR = [
        { name: { contains: queryTerm, mode: "insensitive" } },
        { city: { contains: queryTerm, mode: "insensitive" } },
        { country: { contains: queryTerm, mode: "insensitive" } },
      ];
    }

    const [destinations, tripDestCounts] = await Promise.all([
      prisma.destination.findMany({
        where,
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          image: true,
          popularity: true,
          _count: {
            select: { tripDestinations: true },
          },
        },
      }),
      prisma.tripDestination.findMany({
        select: {
          destinationId: true,
          trip: { select: { userId: true } },
        },
      }),
    ]);

    // Calculate unique users per destination
    const destUserMap = {};
    for (const td of tripDestCounts) {
      if (!destUserMap[td.destinationId]) destUserMap[td.destinationId] = new Set();
      if (td.trip?.userId) destUserMap[td.destinationId].add(td.trip.userId);
    }

    let results = destinations.map((d) => ({
      destinationId: d.id,
      name: d.name,
      city: d.city,
      country: d.country,
      image: d.image,
      tripCount: d._count.tripDestinations,
      userCount: destUserMap[d.id] ? destUserMap[d.id].size : 0,
      popularityScore: (d.popularity || 0) + d._count.tripDestinations * 10,
    }));

    // Sorting
    results.sort((a, b) => {
      if (sort === "popularity_asc") return a.tripCount - b.tripCount;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return b.tripCount - a.tripCount; // popularity_desc
    });

    results = results.slice(0, limitNum);

    return ok(res, results, "Popular cities fetched successfully.");
  } catch (e) {
    console.error("getPopularCities error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/popular-activities
// ─────────────────────────────────────────────
export const getPopularActivities = async (req, res) => {
  const { search, q, category, sort = "popularity_desc", limit = 10 } = req.query;

  const validSorts = ["popularity_desc", "popularity_asc", "name_asc", "name_desc"];
  if (sort && !validSorts.includes(sort)) {
    return fail(res, `Invalid sort parameter. Allowed values: ${validSorts.join(", ")}`, 400);
  }

  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  const queryTerm = (search || q || "").trim();

  try {
    const where = {};
    if (queryTerm) {
      where.OR = [
        { name: { contains: queryTerm, mode: "insensitive" } },
        { category: { contains: queryTerm, mode: "insensitive" } },
        { city: { contains: queryTerm, mode: "insensitive" } },
        { country: { contains: queryTerm, mode: "insensitive" } },
      ];
    }
    if (category?.trim()) {
      where.category = { equals: category.trim(), mode: "insensitive" };
    }

    const [activities, tripActivities] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          country: true,
          estimatedCost: true,
          currency: true,
          image: true,
          popularity: true,
          _count: {
            select: { tripActivities: true },
          },
        },
      }),
      prisma.tripActivity.findMany({
        select: {
          activityId: true,
          trip: { select: { userId: true } },
        },
      }),
    ]);

    const actUserMap = {};
    for (const ta of tripActivities) {
      if (!actUserMap[ta.activityId]) actUserMap[ta.activityId] = new Set();
      if (ta.trip?.userId) actUserMap[ta.activityId].add(ta.trip.userId);
    }

    let results = activities.map((a) => ({
      activityId: a.id,
      name: a.name,
      category: a.category,
      city: a.city,
      country: a.country,
      image: a.image,
      estimatedCost: a.estimatedCost,
      currency: a.currency,
      usageCount: a._count.tripActivities,
      userCount: actUserMap[a.id] ? actUserMap[a.id].size : 0,
      popularityScore: (a.popularity || 0) + a._count.tripActivities * 5,
    }));

    // Sorting
    results.sort((a, b) => {
      if (sort === "popularity_asc") return a.usageCount - b.usageCount;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return b.usageCount - a.usageCount; // popularity_desc
    });

    results = results.slice(0, limitNum);

    return ok(res, results, "Popular activities fetched successfully.");
  } catch (e) {
    console.error("getPopularActivities error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics (User Trends and Analytics Summary)
// ─────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  if (startDate || endDate) {
    if (startDate && isNaN(new Date(startDate).getTime())) {
      return fail(res, "Invalid startDate format. Must be YYYY-MM-DD.", 400);
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
      return fail(res, "Invalid endDate format. Must be YYYY-MM-DD.", 400);
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return fail(res, "startDate cannot be after endDate.", 400);
    }

    dateFilter = {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };
  }

  const now = new Date();
  const startOfCurrentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));

  try {
    const [
      totalUsers,
      newUsersThisMonth,
      totalTrips,
      upcomingTrips,
      ongoingTrips,
      completedTrips,
      totalCommunityPosts,
      totalActivitiesPlanned,
      totalDestinationsUsed,
    ] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.user.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
      prisma.trip.count({ where: dateFilter }),
      prisma.trip.count({ where: { startDate: { gt: now }, ...dateFilter } }),
      prisma.trip.count({ where: { startDate: { lte: now }, endDate: { gte: now }, ...dateFilter } }),
      prisma.trip.count({ where: { endDate: { lt: now }, ...dateFilter } }),
      prisma.communityPost.count({ where: dateFilter }),
      prisma.tripActivity.count({ where: dateFilter }),
      prisma.tripDestination.count({ where: dateFilter }),
    ]);

    return ok(
      res,
      {
        totalUsers,
        newUsersThisMonth,
        totalTrips,
        upcomingTrips,
        ongoingTrips,
        completedTrips,
        totalCommunityPosts,
        totalActivitiesPlanned,
        totalDestinationsUsed,
      },
      "Analytics summary fetched successfully."
    );
  } catch (e) {
    console.error("getAnalytics error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/users (Monthly User Trend)
// ─────────────────────────────────────────────
export const getUserTrends = async (req, res) => {
  const { months = 6 } = req.query;
  const numMonths = parseInt(months);

  if (isNaN(numMonths) || numMonths < 1 || numMonths > 24) {
    return fail(res, "Invalid months parameter. Must be an integer between 1 and 24.", 400);
  }

  try {
    const now = new Date();
    const trendBuckets = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const dStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const dEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      const monthKey = dStart.toISOString().slice(0, 7);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: dStart,
            lte: dEnd,
          },
        },
      });

      trendBuckets.push({
        month: monthKey,
        count,
      });
    }

    return ok(res, trendBuckets, "User registration trend fetched successfully.");
  } catch (e) {
    console.error("getUserTrends error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/trips (Monthly Trip Trend)
// ─────────────────────────────────────────────
export const getTripTrends = async (req, res) => {
  const { months = 6 } = req.query;
  const numMonths = parseInt(months);

  if (isNaN(numMonths) || numMonths < 1 || numMonths > 24) {
    return fail(res, "Invalid months parameter. Must be an integer between 1 and 24.", 400);
  }

  try {
    const now = new Date();
    const trendBuckets = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const dStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const dEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      const monthKey = dStart.toISOString().slice(0, 7);

      const count = await prisma.trip.count({
        where: {
          createdAt: {
            gte: dStart,
            lte: dEnd,
          },
        },
      });

      trendBuckets.push({
        month: monthKey,
        count,
      });
    }

    return ok(res, trendBuckets, "Trip creation trend fetched successfully.");
  } catch (e) {
    console.error("getTripTrends error:", e);
    return fail(res, "Internal server error.");
  }
};
