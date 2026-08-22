import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

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

  try {
    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        description: description || null,
        category: category.trim(),
        image: image || null,
        city: city.trim(),
        country: country.trim(),
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
    });

    return ok(res, activity, "Activity created successfully.", 201);
  } catch (e) {
    console.error("createActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/activities
// Supports: search, category, city, country, minPopularity, sort, page, limit
// ─────────────────────────────────────────────
export const getActivities = async (req, res) => {
  const {
    search,
    category,
    city,
    country,
    minPopularity,
    sort = "popularity_desc",
    page = 1,
    limit = 20,
  } = req.query;

  const where = {};

  if (search?.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { category: { contains: search.trim(), mode: "insensitive" } },
      { city: { contains: search.trim(), mode: "insensitive" } },
      { country: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
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

  if (minPopularity) {
    where.popularity = { gte: parseInt(minPopularity) };
  }

  const sortMap = {
    name_asc: { name: "asc" },
    name_desc: { name: "desc" },
    popularity_asc: { popularity: "asc" },
    popularity_desc: { popularity: "desc" },
    cost_asc: { estimatedCost: "asc" },
    cost_desc: { estimatedCost: "desc" },
    duration_asc: { estimatedDuration: "asc" },
    duration_desc: { estimatedDuration: "desc" },
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
  };

  const orderBy = sortMap[sort] || sortMap.popularity_desc;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.activity.count({ where }),
    ]);

    return ok(
      res,
      {
        activities,
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
      "Activities fetched successfully."
    );
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

  try {
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" } },
          { category: { contains: q.trim(), mode: "insensitive" } },
          { city: { contains: q.trim(), mode: "insensitive" } },
          { country: { contains: q.trim(), mode: "insensitive" } },
          { description: { contains: q.trim(), mode: "insensitive" } },
        ],
      },
      orderBy: { popularity: "desc" },
    });

    return ok(res, activities, `Search results for "${q}".`);
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
    });

    if (!activity) return fail(res, "Activity not found.", 404);

    return ok(res, activity, "Activity fetched successfully.");
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
    });

    return ok(res, updated, "Activity updated successfully.");
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
