import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

// ─────────────────────────────────────────────
// POST /api/banners
// ─────────────────────────────────────────────
export const createBanner = async (req, res) => {
  const { title, subtitle, image, badge, buttonText, buttonLink, isActive } = req.body;
  if (!title?.trim()) return fail(res, "Banner title is required.", 400);

  try {
    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle,
        image,
        badge,
        buttonText,
        buttonLink,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    return ok(res, banner, "Banner created successfully.", 201);
  } catch (e) {
    console.error("createBanner:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/banners
// ─────────────────────────────────────────────
export const getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
    return ok(res, banners, "Banners fetched successfully.");
  } catch (e) {
    console.error("getBanners:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/banners/:id
// ─────────────────────────────────────────────
export const getBannerById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid banner ID.", 400);

  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return fail(res, "Banner not found.", 404);
    return ok(res, banner, "Banner fetched successfully.");
  } catch (e) {
    console.error("getBannerById:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/banners/:id
// ─────────────────────────────────────────────
export const updateBanner = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid banner ID.", 400);

  const { title, subtitle, image, badge, buttonText, buttonLink, isActive } = req.body;

  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return fail(res, "Banner not found.", 404);

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle }),
        ...(image !== undefined && { image }),
        ...(badge !== undefined && { badge }),
        ...(buttonText !== undefined && { buttonText }),
        ...(buttonLink !== undefined && { buttonLink }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    return ok(res, updated, "Banner updated successfully.");
  } catch (e) {
    console.error("updateBanner:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/banners/:id
// ─────────────────────────────────────────────
export const deleteBanner = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid banner ID.", 400);

  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return fail(res, "Banner not found.", 404);

    await prisma.banner.delete({ where: { id } });
    return ok(res, null, "Banner deleted successfully.");
  } catch (e) {
    console.error("deleteBanner:", e);
    return fail(res, "Internal server error.");
  }
};
