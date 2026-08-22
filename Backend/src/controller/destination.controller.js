import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

// ─── Shared include ────────────────────────────────────────
const destinationInclude = {
  region: { select: { id: true, name: true } },
};

// ─────────────────────────────────────────────
// POST /api/destinations
// ─────────────────────────────────────────────
export const createDestination = async (req, res) => {
  const { name, country, city, description, image, regionId, latitude, longitude, popularity } = req.body;

  if (!name?.trim() || !country?.trim() || !city?.trim() || !regionId)
    return fail(res, "name, country, city, and regionId are required.", 400);

  const rId = parseInt(regionId);
  if (isNaN(rId)) return fail(res, "Invalid regionId.", 400);

  try {
    const region = await prisma.region.findUnique({ where: { id: rId } });
    if (!region) return fail(res, "Region not found.", 404);

    const dest = await prisma.destination.create({
      data: {
        name: name.trim(),
        country: country.trim(),
        city: city.trim(),
        description,
        image,
        regionId: rId,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        popularity: popularity ? parseInt(popularity) : 0,
      },
      include: destinationInclude,
    });
    return ok(res, dest, "Destination created successfully.", 201);
  } catch (e) {
    console.error("createDestination:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/destinations
// Supports: q, search, region, country, minPopularity,
//           sort, groupBy, page, limit
// ─────────────────────────────────────────────
export const getDestinations = async (req, res) => {
  const {
    q, search, region, country, minPopularity,
    sort = "name_asc", groupBy, page = 1, limit = 20,
  } = req.query;

  const validSortMap = {
    name_asc:         { name: "asc" },
    name_desc:        { name: "desc" },
    popularity_asc:   { popularity: "asc" },
    popularity_desc:  { popularity: "desc" },
    newest:           { createdAt: "desc" },
    oldest:           { createdAt: "asc" },
  };

  if (sort && !validSortMap[sort]) {
    return fail(res, `Invalid sort parameter. Allowed values: ${Object.keys(validSortMap).join(", ")}`, 400);
  }

  const validGroupBy = ["region", "country"];
  if (groupBy && !validGroupBy.includes(String(groupBy).toLowerCase())) {
    return fail(res, `Invalid groupBy parameter. Allowed values: region, country`, 400);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1) {
    return fail(res, "Invalid page parameter. Must be an integer >= 1.", 400);
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return fail(res, "Invalid limit parameter. Must be between 1 and 50.", 400);
  }

  // ── Build where clause ─────────────────────
  const where = {};
  const queryTerm = (q || search || "").trim();

  if (queryTerm) {
    where.OR = [
      { name: { contains: queryTerm, mode: "insensitive" } },
      { city: { contains: queryTerm, mode: "insensitive" } },
      { country: { contains: queryTerm, mode: "insensitive" } },
      { region: { name: { contains: queryTerm, mode: "insensitive" } } },
      { description: { contains: queryTerm, mode: "insensitive" } },
    ];
  }
  if (region?.trim()) where.region = { name: { equals: region.trim(), mode: "insensitive" } };
  if (country?.trim()) where.country = { contains: country.trim(), mode: "insensitive" };
  if (minPopularity) where.popularity = { gte: parseInt(minPopularity) };

  const orderBy = validSortMap[sort] || validSortMap.name_asc;

  try {
    // ── GroupBy handling ───────────────────────
    if (groupBy) {
      const normalizedGroup = String(groupBy).toLowerCase();
      const destinations = await prisma.destination.findMany({
        where,
        orderBy,
        include: destinationInclude,
      });

      const grouped = {};
      for (const d of destinations) {
        const key = normalizedGroup === "region" ? d.region.name : d.country;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(d);
      }
      return ok(res, grouped, "Destinations fetched and grouped successfully.");
    }

    // ── Paginated list ─────────────────────────
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [destinations, total] = await Promise.all([
      prisma.destination.findMany({ where, orderBy, skip, take, include: destinationInclude }),
      prisma.destination.count({ where }),
    ]);

    return ok(res, {
      destinations,
      pagination: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) || (total === 0 ? 0 : 1) },
    }, "Destinations fetched successfully.");
  } catch (e) {
    console.error("getDestinations:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/destinations/search?q=
// ─────────────────────────────────────────────
export const searchDestinations = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return fail(res, "Search query 'q' is required.", 400);

  const queryTerm = q.trim();

  try {
    const destinations = await prisma.destination.findMany({
      where: {
        OR: [
          { name: { contains: queryTerm, mode: "insensitive" } },
          { city: { contains: queryTerm, mode: "insensitive" } },
          { country: { contains: queryTerm, mode: "insensitive" } },
          { region: { name: { contains: queryTerm, mode: "insensitive" } } },
          { description: { contains: queryTerm, mode: "insensitive" } },
        ],
      },
      include: destinationInclude,
      orderBy: { popularity: "desc" },
    });
    return ok(res, destinations, `Search results for "${q}".`);
  } catch (e) {
    console.error("searchDestinations:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/destinations/:id
// ─────────────────────────────────────────────
export const getDestinationById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid destination ID.", 400);

  try {
    const dest = await prisma.destination.findUnique({
      where: { id },
      include: {
        ...destinationInclude,
        activities: {
          take: 10,
          orderBy: { popularity: "desc" },
        },
      },
    });
    if (!dest) return fail(res, "Destination not found.", 404);
    return ok(res, dest, "Destination fetched successfully.");
  } catch (e) {
    console.error("getDestinationById:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/destinations/:id
// ─────────────────────────────────────────────
export const updateDestination = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid destination ID.", 400);

  const { name, country, city, description, image, regionId, latitude, longitude, popularity } = req.body;

  try {
    const dest = await prisma.destination.findUnique({ where: { id } });
    if (!dest) return fail(res, "Destination not found.", 404);

    if (regionId) {
      const region = await prisma.region.findUnique({ where: { id: parseInt(regionId) } });
      if (!region) return fail(res, "Region not found.", 404);
    }

    const updated = await prisma.destination.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(country && { country: country.trim() }),
        ...(city && { city: city.trim() }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(regionId && { regionId: parseInt(regionId) }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(popularity !== undefined && { popularity: parseInt(popularity) }),
      },
      include: destinationInclude,
    });
    return ok(res, updated, "Destination updated successfully.");
  } catch (e) {
    console.error("updateDestination:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/destinations/:id
// ─────────────────────────────────────────────
export const deleteDestination = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid destination ID.", 400);

  try {
    const dest = await prisma.destination.findUnique({ where: { id } });
    if (!dest) return fail(res, "Destination not found.", 404);

    await prisma.destination.delete({ where: { id } });
    return ok(res, null, "Destination deleted successfully.");
  } catch (e) {
    console.error("deleteDestination:", e);
    return fail(res, "Internal server error.");
  }
};
