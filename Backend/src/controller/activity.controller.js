import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const activityInclude = {
  destination: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      image: true,
      region: { select: { id: true, name: true } },
    },
  },
};

const formatActivityCard = (act) => {
  return {
    id: act.id,
    name: act.name,
    description: act.description,
    category: act.category,
    image: act.image,
    city: act.city,
    country: act.country,
    location: `${act.city}, ${act.country}`,
    latitude: act.latitude,
    longitude: act.longitude,
    duration: act.estimatedDuration,
    estimatedDuration: act.estimatedDuration,
    price: act.estimatedCost,
    estimatedCost: act.estimatedCost,
    currency: act.currency || "INR",
    popularity: act.popularity || 0,
    rating: act.popularity ? Math.min(5, +(3.5 + (act.popularity / 100) * 1.5).toFixed(1)) : 4.5,
    destinationId: act.destinationId || act.destination?.id || null,
    destination: act.destination
      ? {
          id: act.destination.id,
          name: act.destination.name,
          city: act.destination.city,
          country: act.destination.country,
          image: act.destination.image,
          region: act.destination.region?.name || null,
        }
      : null,
    createdAt: act.createdAt,
    updatedAt: act.updatedAt,
  };
};

// ─────────────────────────────────────────────
// POST /api/activities
// ─────────────────────────────────────────────
export const createActivity = async (req, res) => {
  const {
    name,
    description,
    category,
    image,
    city,
    country,
    destinationId,
    latitude,
    longitude,
    estimatedDuration,
    estimatedCost,
    currency,
    popularity,
  } = req.body;

  if (!name?.trim() || !category?.trim() || !city?.trim() || !country?.trim()) {
    return fail(res, "name, category, city, and country are required.", 400);
  }

  let dId = null;
  if (destinationId) {
    dId = parseInt(destinationId);
    if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        description: description || null,
        category: category.trim(),
        image: image || null,
        city: city.trim(),
        country: country.trim(),
        destinationId: dId,
        latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
        estimatedDuration:
          estimatedDuration !== undefined && estimatedDuration !== null
            ? parseFloat(estimatedDuration)
            : null,
        estimatedCost:
          estimatedCost !== undefined && estimatedCost !== null
            ? parseFloat(estimatedCost)
            : null,
        currency: currency || "INR",
        popularity: popularity !== undefined && popularity !== null ? parseInt(popularity) : 0,
      },
      include: activityInclude,
    });

    return ok(res, formatActivityCard(activity), "Activity created successfully.", 201);
  } catch (e) {
    console.error("createActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/activities (Screen 8 Main Activity Search & Listing)
// Supports: q, search, category, destinationId, city, country, region,
//           minPrice, maxPrice, minRating, minPopularity,
//           sort, groupBy, page, limit
// ─────────────────────────────────────────────
export const getActivities = async (req, res) => {
  const {
    q,
    search,
    category,
    destinationId,
    city,
    country,
    region,
    minPrice,
    maxPrice,
    minCost,
    maxCost,
    minRating,
    minPopularity,
    sort = "popularity_desc",
    groupBy,
    page = 1,
    limit = 10,
  } = req.query;

  // 1. Validation
  const validSortMap = {
    name_asc: { name: "asc" },
    name_desc: { name: "desc" },
    popularity_asc: { popularity: "asc" },
    popularity_desc: { popularity: "desc" },
    price_asc: { estimatedCost: "asc" },
    cost_asc: { estimatedCost: "asc" },
    price_desc: { estimatedCost: "desc" },
    cost_desc: { estimatedCost: "desc" },
    rating_asc: { popularity: "asc" },
    rating_desc: { popularity: "desc" },
    duration_asc: { estimatedDuration: "asc" },
    duration_desc: { estimatedDuration: "desc" },
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
  };

  if (sort && !validSortMap[sort]) {
    return fail(res, `Invalid sort parameter. Allowed values: ${Object.keys(validSortMap).join(", ")}`, 400);
  }

  const validGroupBy = ["category", "destination", "city", "region"];
  if (groupBy && !validGroupBy.includes(String(groupBy).toLowerCase())) {
    return fail(res, `Invalid groupBy parameter. Allowed values: category, destination, city, region`, 400);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) {
    return fail(res, "Invalid page parameter. Must be an integer >= 1.", 400);
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  const effectiveMinPrice = minPrice !== undefined ? minPrice : minCost;
  const effectiveMaxPrice = maxPrice !== undefined ? maxPrice : maxCost;

  if (effectiveMinPrice !== undefined) {
    const minP = parseFloat(effectiveMinPrice);
    if (isNaN(minP) || minP < 0) return fail(res, "Invalid minPrice. Must be >= 0.", 400);
  }
  if (effectiveMaxPrice !== undefined) {
    const maxP = parseFloat(effectiveMaxPrice);
    if (isNaN(maxP) || maxP < 0) return fail(res, "Invalid maxPrice. Must be >= 0.", 400);
  }
  if (effectiveMinPrice !== undefined && effectiveMaxPrice !== undefined) {
    if (parseFloat(effectiveMaxPrice) < parseFloat(effectiveMinPrice)) {
      return fail(res, "maxPrice cannot be less than minPrice.", 400);
    }
  }

  if (minRating !== undefined) {
    const r = parseFloat(minRating);
    if (isNaN(r) || r < 0 || r > 5) return fail(res, "Invalid minRating. Must be between 0 and 5.", 400);
  }

  if (destinationId !== undefined) {
    const dId = parseInt(destinationId);
    if (isNaN(dId)) return fail(res, "Invalid destinationId parameter.", 400);
  }

  // 2. Build Where Clause
  const where = {};
  const queryTerm = (q || search || "").trim();

  if (queryTerm) {
    where.OR = [
      { name: { contains: queryTerm, mode: "insensitive" } },
      { category: { contains: queryTerm, mode: "insensitive" } },
      { city: { contains: queryTerm, mode: "insensitive" } },
      { country: { contains: queryTerm, mode: "insensitive" } },
      { description: { contains: queryTerm, mode: "insensitive" } },
      { destination: { name: { contains: queryTerm, mode: "insensitive" } } },
      { destination: { region: { name: { contains: queryTerm, mode: "insensitive" } } } },
    ];
  }

  if (category?.trim()) {
    where.category = { equals: category.trim(), mode: "insensitive" };
  }

  if (city?.trim()) {
    where.city = { contains: city.trim(), mode: "insensitive" };
  }

  if (country?.trim()) {
    where.country = { contains: country.trim(), mode: "insensitive" };
  }

  if (destinationId) {
    where.OR = [
      { destinationId: parseInt(destinationId) },
      { destination: { id: parseInt(destinationId) } },
    ];
  }

  if (region?.trim()) {
    where.destination = {
      region: { name: { equals: region.trim(), mode: "insensitive" } },
    };
  }

  if (effectiveMinPrice !== undefined || effectiveMaxPrice !== undefined) {
    where.estimatedCost = {
      ...(effectiveMinPrice !== undefined && { gte: parseFloat(effectiveMinPrice) }),
      ...(effectiveMaxPrice !== undefined && { lte: parseFloat(effectiveMaxPrice) }),
    };
  }

  if (minPopularity) {
    where.popularity = { gte: parseInt(minPopularity) };
  }

  const orderBy = validSortMap[sort] || { popularity: "desc" };

  try {
    // 3. Handle GroupBy
    if (groupBy) {
      const allActivities = await prisma.activity.findMany({
        where,
        orderBy,
        include: activityInclude,
      });

      const cards = allActivities.map(formatActivityCard);
      const normalizedGroup = String(groupBy).toLowerCase();
      const groupedData = {};

      for (const card of cards) {
        let groupKey = "Other";
        if (normalizedGroup === "category") {
          groupKey = card.category || "Other";
        } else if (normalizedGroup === "destination" || normalizedGroup === "city") {
          groupKey = card.destination?.name || card.city || "Other";
        } else if (normalizedGroup === "region") {
          groupKey = card.destination?.region || "Other";
        }

        if (!groupedData[groupKey]) groupedData[groupKey] = [];
        groupedData[groupKey].push(card);
      }

      return ok(
        res,
        groupedData,
        "Activities fetched and grouped successfully.",
        200,
        {
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: cards.length,
            totalPages: Math.ceil(cards.length / limitNum) || 1,
          },
        }
      );
    }

    // 4. Paginated List
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy,
        skip,
        take,
        include: activityInclude,
      }),
      prisma.activity.count({ where }),
    ]);

    const cards = activities.map(formatActivityCard);

    // Support both data as array and data.activities for compatibility
    return res.status(200).json({
      success: true,
      message: "Activities fetched successfully.",
      data: cards,
      activities: cards,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || (total === 0 ? 0 : 1),
      },
    });
  } catch (e) {
    console.error("getActivities error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/activities/search?q=
// ─────────────────────────────────────────────
export const searchActivities = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return fail(res, "Search query 'q' is required.", 400);

  const queryTerm = q.trim();

  try {
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { name: { contains: queryTerm, mode: "insensitive" } },
          { category: { contains: queryTerm, mode: "insensitive" } },
          { city: { contains: queryTerm, mode: "insensitive" } },
          { country: { contains: queryTerm, mode: "insensitive" } },
          { description: { contains: queryTerm, mode: "insensitive" } },
          { destination: { name: { contains: queryTerm, mode: "insensitive" } } },
          { destination: { region: { name: { contains: queryTerm, mode: "insensitive" } } } },
        ],
      },
      include: activityInclude,
      orderBy: { popularity: "desc" },
    });

    const cards = activities.map(formatActivityCard);
    return ok(res, cards, `Search results for "${q}".`);
  } catch (e) {
    console.error("searchActivities error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/activities/:id
// ─────────────────────────────────────────────
export const getActivityById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid activity ID.", 400);

  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: activityInclude,
    });

    if (!activity) return fail(res, "Activity not found.", 404);

    return ok(res, formatActivityCard(activity), "Activity fetched successfully.");
  } catch (e) {
    console.error("getActivityById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/activities/:id
// ─────────────────────────────────────────────
export const updateActivity = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid activity ID.", 400);

  const {
    name,
    description,
    category,
    image,
    city,
    country,
    destinationId,
    latitude,
    longitude,
    estimatedDuration,
    estimatedCost,
    currency,
    popularity,
  } = req.body;

  try {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) return fail(res, "Activity not found.", 404);

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category: category.trim() }),
        ...(image !== undefined && { image }),
        ...(city && { city: city.trim() }),
        ...(country && { country: country.trim() }),
        ...(destinationId !== undefined && {
          destinationId: destinationId ? parseInt(destinationId) : null,
        }),
        ...(latitude !== undefined && {
          latitude: latitude !== null ? parseFloat(latitude) : null,
        }),
        ...(longitude !== undefined && {
          longitude: longitude !== null ? parseFloat(longitude) : null,
        }),
        ...(estimatedDuration !== undefined && {
          estimatedDuration: estimatedDuration !== null ? parseFloat(estimatedDuration) : null,
        }),
        ...(estimatedCost !== undefined && {
          estimatedCost: estimatedCost !== null ? parseFloat(estimatedCost) : null,
        }),
        ...(currency && { currency }),
        ...(popularity !== undefined && {
          popularity: popularity !== null ? parseInt(popularity) : 0,
        }),
      },
      include: activityInclude,
    });

    return ok(res, formatActivityCard(updated), "Activity updated successfully.");
  } catch (e) {
    console.error("updateActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/activities/:id
// ─────────────────────────────────────────────
export const deleteActivity = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid activity ID.", 400);

  try {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) return fail(res, "Activity not found.", 404);

    await prisma.activity.delete({ where: { id } });
    return ok(res, null, "Activity deleted successfully.");
  } catch (e) {
    console.error("deleteActivity error:", e);
    return fail(res, "Internal server error.");
  }
};
