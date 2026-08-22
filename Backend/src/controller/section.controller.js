import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const VALID_SECTION_TYPES = [
  "TRAVEL",
  "HOTEL",
  "ACTIVITY",
  "SIGHTSEEING",
  "FOOD",
  "TRANSPORT",
  "OTHER",
];

// ─── Include definitions ───────────────────────────────────
const sectionInclude = {
  destination: {
    include: { region: { select: { id: true, name: true } } },
  },
  activity: true,
};

// ─── Helper: Validate date range within parent trip bounds ─
const validateSectionDates = (startDate, endDate, tripStart, tripEnd) => {
  const s = new Date(startDate);
  const e = new Date(endDate);

  if (isNaN(s.getTime())) return "Invalid startDate.";
  if (isNaN(e.getTime())) return "Invalid endDate.";
  if (e < s) return "endDate cannot be before startDate.";

  const tStart = new Date(tripStart);
  const tEnd = new Date(tripEnd);
  tStart.setHours(0, 0, 0, 0);
  tEnd.setHours(23, 59, 59, 999);

  if (s < tStart || e > tEnd) {
    return `Section dates (${s.toISOString().split("T")[0]} to ${
      e.toISOString().split("T")[0]
    }) must fall within trip dates (${tStart.toISOString().split("T")[0]} to ${
      tEnd.toISOString().split("T")[0]
    }).`;
  }

  return null;
};

// ─── Helper: Verify trip ownership ─────────────────────────
const getVerifiedTrip = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) return { error: "Trip not found.", status: 404 };
  if (trip.userId !== userId) return { error: "Forbidden.", status: 403 };

  return { trip };
};

// ─────────────────────────────────────────────
// POST /api/trips/:tripId/sections
// ─────────────────────────────────────────────
export const createSection = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const {
    title,
    description,
    type,
    startDate,
    endDate,
    budget,
    currency,
    location,
    notes,
    order,
    destinationId,
    activityId,
  } = req.body;

  // 1. Verify trip & ownership
  const { trip, error: tripErr, status: tripStatus } = await getVerifiedTrip(tripId, req.user.id);
  if (tripErr) return fail(res, tripErr, tripStatus);

  // 2. Validate required title
  if (!title?.trim()) {
    return fail(res, "Section title is required.", 400);
  }

  // 3. Validate type
  const normalizedType = type ? String(type).trim().toUpperCase() : "OTHER";
  if (!VALID_SECTION_TYPES.includes(normalizedType)) {
    return fail(res, `Invalid section type. Allowed types: ${VALID_SECTION_TYPES.join(", ")}`, 400);
  }

  // 4. Validate dates
  if (!startDate || !endDate) {
    return fail(res, "startDate and endDate are required.", 400);
  }
  const dateErr = validateSectionDates(startDate, endDate, trip.startDate, trip.endDate);
  if (dateErr) return fail(res, dateErr, 400);

  // 5. Validate budget
  if (budget !== undefined && budget !== null && budget < 0) {
    return fail(res, "Budget cannot be negative.", 400);
  }

  // 6. Validate optional foreign keys
  let parsedDestId = null;
  if (destinationId) {
    parsedDestId = parseInt(destinationId);
    if (isNaN(parsedDestId)) return fail(res, "Invalid destinationId.", 400);
    const dest = await prisma.destination.findUnique({ where: { id: parsedDestId } });
    if (!dest) return fail(res, "Destination not found.", 404);
  }

  let parsedActId = null;
  if (activityId) {
    parsedActId = parseInt(activityId);
    if (isNaN(parsedActId)) return fail(res, "Invalid activityId.", 400);
    const act = await prisma.activity.findUnique({ where: { id: parsedActId } });
    if (!act) return fail(res, "Activity not found.", 404);
  }

  try {
    // 7. Calculate automatic order if omitted
    let finalOrder = order !== undefined && order !== null ? parseInt(order) : null;
    if (finalOrder === null || isNaN(finalOrder)) {
      const maxOrderSection = await prisma.tripSection.findFirst({
        where: { tripId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      finalOrder = (maxOrderSection?.order || 0) + 1;
    }

    const section = await prisma.tripSection.create({
      data: {
        tripId,
        title: title.trim(),
        description: description || null,
        type: normalizedType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: budget !== undefined && budget !== null ? parseFloat(budget) : null,
        currency: currency || trip.currency || "INR",
        location: location || null,
        notes: notes || null,
        order: finalOrder,
        destinationId: parsedDestId,
        activityId: parsedActId,
      },
      include: sectionInclude,
    });

    return ok(res, section, "Section created successfully.", 201);
  } catch (e) {
    console.error("createSection error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/sections
// ─────────────────────────────────────────────
export const getSections = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  try {
    const sections = await prisma.tripSection.findMany({
      where: { tripId },
      include: sectionInclude,
      orderBy: { order: "asc" },
    });

    return ok(res, sections, "Sections fetched successfully.");
  } catch (e) {
    console.error("getSections error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/sections/:sectionId
// ─────────────────────────────────────────────
export const getSectionById = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  try {
    const section = await prisma.tripSection.findFirst({
      where: { id: sectionId, tripId },
      include: {
        ...sectionInclude,
        trip: {
          select: { id: true, title: true, startDate: true, endDate: true, currency: true },
        },
      },
    });

    if (!section) return fail(res, "Section not found.", 404);

    return ok(res, section, "Section fetched successfully.");
  } catch (e) {
    console.error("getSectionById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/sections/:sectionId
// ─────────────────────────────────────────────
export const updateSection = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { trip, error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  const existing = await prisma.tripSection.findFirst({
    where: { id: sectionId, tripId },
  });
  if (!existing) return fail(res, "Section not found.", 404);

  const {
    title,
    description,
    type,
    startDate,
    endDate,
    budget,
    currency,
    location,
    notes,
    order,
    destinationId,
    activityId,
  } = req.body;

  // Validate type if provided
  let normalizedType = undefined;
  if (type !== undefined) {
    normalizedType = String(type).trim().toUpperCase();
    if (!VALID_SECTION_TYPES.includes(normalizedType)) {
      return fail(
        res,
        `Invalid section type. Allowed types: ${VALID_SECTION_TYPES.join(", ")}`,
        400
      );
    }
  }

  // Validate dates if updated
  const newStart = startDate ? new Date(startDate) : existing.startDate;
  const newEnd = endDate ? new Date(endDate) : existing.endDate;
  if (startDate || endDate) {
    const dateErr = validateSectionDates(newStart, newEnd, trip.startDate, trip.endDate);
    if (dateErr) return fail(res, dateErr, 400);
  }

  // Validate budget if updated
  if (budget !== undefined && budget !== null && budget < 0) {
    return fail(res, "Budget cannot be negative.", 400);
  }

  // Validate optional destinationId / activityId
  if (destinationId !== undefined && destinationId !== null) {
    const dest = await prisma.destination.findUnique({ where: { id: parseInt(destinationId) } });
    if (!dest) return fail(res, "Destination not found.", 404);
  }

  if (activityId !== undefined && activityId !== null) {
    const act = await prisma.activity.findUnique({ where: { id: parseInt(activityId) } });
    if (!act) return fail(res, "Activity not found.", 404);
  }

  try {
    const updated = await prisma.tripSection.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(normalizedType !== undefined && { type: normalizedType }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(budget !== undefined && { budget: budget !== null ? parseFloat(budget) : null }),
        ...(currency !== undefined && { currency }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(destinationId !== undefined && {
          destinationId: destinationId !== null ? parseInt(destinationId) : null,
        }),
        ...(activityId !== undefined && {
          activityId: activityId !== null ? parseInt(activityId) : null,
        }),
      },
      include: sectionInclude,
    });

    return ok(res, updated, "Section updated successfully.");
  } catch (e) {
    console.error("updateSection error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/sections/:sectionId
// ─────────────────────────────────────────────
export const deleteSection = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  const existing = await prisma.tripSection.findFirst({
    where: { id: sectionId, tripId },
  });
  if (!existing) return fail(res, "Section not found.", 404);

  try {
    // Delete section and normalize remaining orders in transaction
    await prisma.$transaction(async (tx) => {
      await tx.tripSection.delete({ where: { id: sectionId } });

      const remaining = await tx.tripSection.findMany({
        where: { tripId },
        orderBy: { order: "asc" },
      });

      for (let i = 0; i < remaining.length; i++) {
        await tx.tripSection.update({
          where: { id: remaining[i].id },
          data: { order: i + 1 },
        });
      }
    });

    return ok(res, null, "Section deleted successfully.");
  } catch (e) {
    console.error("deleteSection error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/trips/:tripId/sections/reorder
// ─────────────────────────────────────────────
export const reorderSections = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  const { sectionIds } = req.body;
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return fail(res, "sectionIds must be a non-empty array of section IDs.", 400);
  }

  const parsedIds = sectionIds.map((id) => parseInt(id));
  if (parsedIds.some(isNaN)) {
    return fail(res, "All sectionIds must be valid integers.", 400);
  }

  // Check duplicates
  if (new Set(parsedIds).size !== parsedIds.length) {
    return fail(res, "sectionIds array contains duplicate IDs.", 400);
  }

  try {
    // Fetch all existing sections for this trip
    const existingSections = await prisma.tripSection.findMany({
      where: { tripId },
      select: { id: true },
    });
    const existingIds = existingSections.map((s) => s.id);

    // Validate that all supplied sectionIds belong to this trip
    const invalidIds = parsedIds.filter((id) => !existingIds.includes(id));
    if (invalidIds.length > 0) {
      return fail(
        res,
        `The following sectionId(s) do not belong to this trip: ${invalidIds.join(", ")}`,
        404
      );
    }

    // Execute atomic reorder update in transaction
    await prisma.$transaction(
      parsedIds.map((id, index) =>
        prisma.tripSection.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    const updatedSections = await prisma.tripSection.findMany({
      where: { tripId },
      include: sectionInclude,
      orderBy: { order: "asc" },
    });

    return ok(res, updatedSections, "Sections reordered successfully.");
  } catch (e) {
    console.error("reorderSections error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/:tripId/sections/:sectionId/destination
// ─────────────────────────────────────────────
export const linkSectionDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  const { destinationId } = req.body;
  if (!destinationId) return fail(res, "destinationId is required.", 400);

  const dId = parseInt(destinationId);
  if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);

  try {
    const dest = await prisma.destination.findUnique({ where: { id: dId } });
    if (!dest) return fail(res, "Destination not found.", 404);

    const updated = await prisma.tripSection.update({
      where: { id: sectionId },
      data: { destinationId: dId },
      include: sectionInclude,
    });

    return ok(res, updated, "Destination linked to section successfully.");
  } catch (e) {
    console.error("linkSectionDestination error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/sections/:sectionId/destination
// ─────────────────────────────────────────────
export const unlinkSectionDestination = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  try {
    const updated = await prisma.tripSection.update({
      where: { id: sectionId },
      data: { destinationId: null },
      include: sectionInclude,
    });

    return ok(res, updated, "Destination unlinked from section.");
  } catch (e) {
    console.error("unlinkSectionDestination error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// POST /api/trips/:tripId/sections/:sectionId/activity
// ─────────────────────────────────────────────
export const linkSectionActivity = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  const { activityId } = req.body;
  if (!activityId) return fail(res, "activityId is required.", 400);

  const aId = parseInt(activityId);
  if (isNaN(aId)) return fail(res, "Invalid activityId.", 400);

  try {
    const act = await prisma.activity.findUnique({ where: { id: aId } });
    if (!act) return fail(res, "Activity not found.", 404);

    const updated = await prisma.tripSection.update({
      where: { id: sectionId },
      data: { activityId: aId },
      include: sectionInclude,
    });

    return ok(res, updated, "Activity linked to section successfully.");
  } catch (e) {
    console.error("linkSectionActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/trips/:tripId/sections/:sectionId/activity
// ─────────────────────────────────────────────
export const unlinkSectionActivity = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  const sectionId = parseInt(req.params.sectionId);
  if (isNaN(tripId) || isNaN(sectionId)) return fail(res, "Invalid ID.", 400);

  const { error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  try {
    const updated = await prisma.tripSection.update({
      where: { id: sectionId },
      data: { activityId: null },
      include: sectionInclude,
    });

    return ok(res, updated, "Activity unlinked from section.");
  } catch (e) {
    console.error("unlinkSectionActivity error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/trips/:tripId/budget (Screen 9 Budget with Daily Breakdown & Over-Budget Flag)
// ─────────────────────────────────────────────
export const getTripBudget = async (req, res) => {
  const tripId = parseInt(req.params.tripId);
  if (isNaN(tripId)) return fail(res, "Invalid trip ID.", 400);

  const { trip, error, status } = await getVerifiedTrip(tripId, req.user.id);
  if (error) return fail(res, error, status);

  try {
    const [sections, tripActivities] = await Promise.all([
      prisma.tripSection.findMany({
        where: { tripId },
        select: {
          id: true,
          title: true,
          type: true,
          budget: true,
          currency: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
      prisma.tripActivity.findMany({
        where: { tripId },
        include: { activity: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const tripBudget = trip.budget || 0;

    // Daily breakdown from trip startDate to endDate
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dailyBreakdown = [];
    let curr = new Date(start);
    let dayNum = 1;
    let activityExpenseTotal = 0;

    while (curr <= end) {
      const dateStr = curr.toISOString().split("T")[0];
      const dayActs = tripActivities.filter((ta) => {
        if (!ta.plannedDate) return false;
        return new Date(ta.plannedDate).toISOString().split("T")[0] === dateStr;
      });

      const dayExpense = dayActs.reduce(
        (sum, ta) =>
          sum +
          (ta.expense !== null && ta.expense !== undefined
            ? ta.expense
            : ta.activity?.estimatedCost || 0),
        0
      );

      activityExpenseTotal += dayExpense;

      dailyBreakdown.push({
        day: dayNum++,
        date: dateStr,
        expense: dayExpense,
      });

      curr.setDate(curr.getDate() + 1);
    }

    const sectionBudgetTotal = sections.reduce((sum, s) => sum + (s.budget || 0), 0);
    const totalExpense = activityExpenseTotal > 0 ? activityExpenseTotal : sectionBudgetTotal;
    const remainingBudget =
      trip.budget !== null && trip.budget !== undefined ? tripBudget - totalExpense : null;
    const overBudget =
      trip.budget !== null && trip.budget !== undefined ? totalExpense > tripBudget : false;

    return ok(
      res,
      {
        tripId: trip.id,
        tripTitle: trip.title,
        currency: trip.currency || "INR",
        tripBudget,
        totalExpense,
        remainingBudget,
        overBudget,
        dailyBreakdown,
        sectionBudgetTotal,
        sections: sections.map((s) => ({
          sectionId: s.id,
          title: s.title,
          type: s.type,
          budget: s.budget || 0,
          currency: s.currency,
          order: s.order,
        })),
      },
      "Trip budget summary calculated successfully."
    );
  } catch (e) {
    console.error("getTripBudget error:", e);
    return fail(res, "Internal server error.");
  }
};
