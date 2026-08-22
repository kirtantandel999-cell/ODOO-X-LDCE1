import prisma from "../lib/prisma.js";

// ─── Helper ───────────────────────────────────────────────
const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

// ─────────────────────────────────────────────
// POST /api/regions
// ─────────────────────────────────────────────
export const createRegion = async (req, res) => {
  const { name, description, image, countryCount } = req.body;
  if (!name?.trim()) return fail(res, "Region name is required.", 400);

  try {
    const existing = await prisma.region.findUnique({ where: { name: name.trim() } });
    if (existing) return fail(res, "A region with this name already exists.", 409);

    const region = await prisma.region.create({
      data: { name: name.trim(), description, image, countryCount: countryCount || 0 },
    });
    return ok(res, region, "Region created successfully.", 201);
  } catch (e) {
    console.error("createRegion:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/regions
// ─────────────────────────────────────────────
export const getRegions = async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      include: {
        _count: { select: { destinations: true } },
        destinations: {
          select: { id: true, name: true, country: true, city: true, image: true, popularity: true },
          orderBy: { popularity: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    const data = regions.map((r) => ({
      ...r,
      destinationCount: r._count.destinations,
      _count: undefined,
    }));

    return ok(res, data, "Regions fetched successfully.");
  } catch (e) {
    console.error("getRegions:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/regions/:id
// ─────────────────────────────────────────────
export const getRegionById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid region ID.", 400);

  try {
    const region = await prisma.region.findUnique({
      where: { id },
      include: {
        destinations: {
          orderBy: { popularity: "desc" },
        },
        _count: { select: { destinations: true } },
      },
    });
    if (!region) return fail(res, "Region not found.", 404);

    return ok(res, { ...region, destinationCount: region._count.destinations, _count: undefined },
      "Region fetched successfully.");
  } catch (e) {
    console.error("getRegionById:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/regions/:id
// ─────────────────────────────────────────────
export const updateRegion = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid region ID.", 400);

  const { name, description, image, countryCount } = req.body;

  try {
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) return fail(res, "Region not found.", 404);

    const updated = await prisma.region.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(countryCount !== undefined && { countryCount }),
      },
    });
    return ok(res, updated, "Region updated successfully.");
  } catch (e) {
    if (e.code === "P2002") return fail(res, "A region with this name already exists.", 409);
    console.error("updateRegion:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/regions/:id
// ─────────────────────────────────────────────
export const deleteRegion = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid region ID.", 400);

  try {
    const region = await prisma.region.findUnique({ where: { id } });
    if (!region) return fail(res, "Region not found.", 404);

    await prisma.region.delete({ where: { id } });
    return ok(res, null, "Region deleted successfully.");
  } catch (e) {
    console.error("deleteRegion:", e);
    return fail(res, "Internal server error.");
  }
};
