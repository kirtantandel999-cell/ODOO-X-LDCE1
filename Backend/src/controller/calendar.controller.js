import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDateStr = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().split("T")[0];
};

const parseDateUTC = (dStr) => {
  const clean = String(dStr).split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const classifyTrip = (t, now = new Date()) => {
  const s = new Date(t.startDate);
  const e = new Date(t.endDate);
  if (e < now) return "completed";
  if (s <= now && e >= now) return "ongoing";
  return "upcoming";
};

// ─────────────────────────────────────────────
// GET /api/calendar (Calendar View Feed)
// Supports: year, month, search, status, destinationId,
//           activityId, sort, groupBy, includeActivities, page, limit
// ─────────────────────────────────────────────
export const getCalendar = async (req, res) => {
  const userId = req.user.id;
  const {
    year,
    month,
    search,
    status,
    destinationId,
    activityId,
    sort = "start_date_asc",
    groupBy,
    includeActivities = "false",
    page,
    limit,
  } = req.query;

  const now = new Date();
  let targetYear = year !== undefined ? parseInt(year) : now.getFullYear();
  let targetMonth = month !== undefined ? parseInt(month) : now.getMonth() + 1;

  if (isNaN(targetYear) || targetYear < 1000 || targetYear > 9999) {
    return fail(res, "Invalid year parameter.", 400);
  }
  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    return fail(res, "Invalid month. Month must be between 1 and 12.", 400);
  }

  const validSorts = [
    "start_date_asc",
    "start_date_desc",
    "end_date_asc",
    "end_date_desc",
    "title_asc",
    "title_desc",
    "newest",
    "oldest",
  ];
  if (sort && !validSorts.includes(sort)) {
    return fail(
      res,
      `Invalid sort parameter. Allowed values: ${validSorts.join(", ")}`,
      400
    );
  }

  const validGroups = ["day", "destination", "status"];
  if (groupBy && !validGroups.includes(String(groupBy).toLowerCase())) {
    return fail(
      res,
      `Invalid groupBy parameter. Allowed values: ${validGroups.join(", ")}`,
      400
    );
  }

  // Calculate Month Bounds in UTC
  const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
  const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
  const endOfMonthStr = endOfMonth.toISOString().split("T")[0];

  // Overlap condition: trip.startDate <= endOfMonth AND trip.endDate >= startOfMonth
  const where = {
    userId,
    startDate: { lte: endOfMonth },
    endDate: { gte: startOfMonth },
  };

  if (search?.trim()) {
    const q = search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          {
            tripDestinations: {
              some: {
                destination: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { city: { contains: q, mode: "insensitive" } },
                    { country: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
          {
            tripActivities: {
              some: {
                activity: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
    ];
  }

  if (destinationId) {
    const dId = parseInt(destinationId);
    if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);
    where.tripDestinations = {
      some: { destinationId: dId },
    };
  }

  try {
    const trips = await prisma.trip.findMany({
      where,
      include: {
        tripDestinations: {
          include: { destination: true },
          orderBy: { order: "asc" },
        },
        tripActivities: {
          include: { activity: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Classify and filter by status if requested
    let filteredTrips = trips;
    if (status?.trim()) {
      const sLower = status.trim().toLowerCase();
      filteredTrips = trips.filter((t) => {
        const computedStatus = classifyTrip(t, now);
        return (
          computedStatus === sLower ||
          t.status.toLowerCase() === sLower
        );
      });
    }

    // Build Trip Events
    const tripEvents = filteredTrips.map((t) => {
      const computedStatus = classifyTrip(t, now);
      const primaryDest = t.tripDestinations?.[0]?.destination;
      return {
        id: t.id,
        type: "trip",
        title: t.title,
        description: t.description,
        startDate: formatDateStr(t.startDate),
        endDate: formatDateStr(t.endDate),
        tripId: t.id,
        status: computedStatus,
        dbStatus: t.status,
        budget: t.budget,
        currency: t.currency || "INR",
        coverImage: t.coverImage,
        destination: primaryDest
          ? {
              id: primaryDest.id,
              name: primaryDest.name,
              city: primaryDest.city,
              country: primaryDest.country,
            }
          : null,
        destinations: t.tripDestinations.map((td) => ({
          id: td.destination.id,
          name: td.destination.name,
          city: td.destination.city,
          country: td.destination.country,
        })),
        createdAt: t.createdAt,
      };
    });

    // Optional Activities
    let activityEvents = [];
    const shouldIncludeActivities =
      includeActivities === "true" || includeActivities === true;

    if (shouldIncludeActivities) {
      for (const t of filteredTrips) {
        for (const ta of t.tripActivities) {
          if (ta.plannedDate) {
            const pDate = new Date(ta.plannedDate);
            if (pDate >= startOfMonth && pDate <= endOfMonth) {
              if (activityId && ta.activityId !== parseInt(activityId)) continue;
              activityEvents.push({
                id: ta.id,
                type: "activity",
                title: ta.activity.name,
                date: formatDateStr(ta.plannedDate),
                startDate: formatDateStr(ta.plannedDate),
                endDate: formatDateStr(ta.plannedDate),
                startTime: ta.startTime,
                endTime: ta.endTime,
                order: ta.order,
                expense: ta.expense,
                currency: ta.currency,
                tripId: t.id,
                tripTitle: t.title,
                activityId: ta.activityId,
                activity: {
                  id: ta.activity.id,
                  name: ta.activity.name,
                  category: ta.activity.category,
                  city: ta.activity.city,
                  country: ta.activity.country,
                },
                createdAt: ta.createdAt,
              });
            }
          }
        }
      }
    }

    let allEvents = [...tripEvents, ...activityEvents];

    // Sorting comparator
    const sortComparator = (a, b) => {
      if (sort === "start_date_asc") {
        return new Date(a.startDate) - new Date(b.startDate);
      }
      if (sort === "start_date_desc") {
        return new Date(b.startDate) - new Date(a.startDate);
      }
      if (sort === "end_date_asc") {
        return new Date(a.endDate || a.startDate) - new Date(b.endDate || b.startDate);
      }
      if (sort === "end_date_desc") {
        return new Date(b.endDate || b.startDate) - new Date(a.endDate || a.startDate);
      }
      if (sort === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sort === "title_desc") {
        return b.title.localeCompare(a.title);
      }
      if (sort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    };

    allEvents.sort(sortComparator);
    tripEvents.sort(sortComparator);

    // Summary calculation
    const summary = {
      totalTrips: tripEvents.length,
      ongoingTrips: tripEvents.filter((t) => t.status === "ongoing").length,
      upcomingTrips: tripEvents.filter((t) => t.status === "upcoming").length,
      completedTrips: tripEvents.filter((t) => t.status === "completed").length,
      totalActivities: activityEvents.length,
    };

    const monthMetadata = {
      year: targetYear,
      month: targetMonth,
      monthName: MONTH_NAMES[targetMonth - 1],
      startDate: startOfMonthStr,
      endDate: endOfMonthStr,
    };

    // Grouping
    if (groupBy) {
      const normalizedGroup = String(groupBy).toLowerCase();
      const groupedData = {};

      if (normalizedGroup === "day") {
        // Group events by day of the month
        // Populate days between startOfMonth and endOfMonth
        let curr = new Date(startOfMonth);
        while (curr <= endOfMonth) {
          const dateKey = curr.toISOString().split("T")[0];
          groupedData[dateKey] = [];
          curr.setUTCDate(curr.getUTCDate() + 1);
        }

        // Add trips to all days they cover in this month
        for (const t of tripEvents) {
          const tStart = parseDateUTC(t.startDate);
          const tEnd = parseDateUTC(t.endDate);
          const activeStart = tStart < startOfMonth ? startOfMonth : tStart;
          const activeEnd = tEnd > endOfMonth ? endOfMonth : tEnd;

          let dayCursor = new Date(activeStart);
          while (dayCursor <= activeEnd) {
            const dKey = dayCursor.toISOString().split("T")[0];
            if (groupedData[dKey]) {
              groupedData[dKey].push(t);
            }
            dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
          }
        }

        // Add activities to their planned date
        for (const a of activityEvents) {
          if (a.date && groupedData[a.date]) {
            groupedData[a.date].push(a);
          }
        }
      } else if (normalizedGroup === "destination") {
        for (const item of allEvents) {
          const destKey =
            item.destination?.name ||
            item.activity?.city ||
            "General Travel";
          if (!groupedData[destKey]) groupedData[destKey] = [];
          groupedData[destKey].push(item);
        }
      } else if (normalizedGroup === "status") {
        for (const item of tripEvents) {
          const stKey = item.status || "upcoming";
          if (!groupedData[stKey]) groupedData[stKey] = [];
          groupedData[stKey].push(item);
        }
      }

      return ok(
        res,
        {
          ...monthMetadata,
          events: groupedData,
          summary,
        },
        "Calendar data grouped successfully."
      );
    }

    // Optional pagination
    let paginatedEvents = allEvents;
    let paginationMeta = undefined;

    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const skip = (pageNum - 1) * limitNum;
      paginatedEvents = allEvents.slice(skip, skip + limitNum);
      paginationMeta = {
        page: pageNum,
        limit: limitNum,
        total: allEvents.length,
        totalPages: Math.ceil(allEvents.length / limitNum) || 1,
      };
    }

    return ok(
      res,
      {
        ...monthMetadata,
        events: paginatedEvents,
        summary,
        ...(paginationMeta ? { pagination: paginationMeta } : {}),
      },
      "Calendar data fetched successfully."
    );
  } catch (e) {
    console.error("getCalendar error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/calendar/current (Current Month Helper)
// ─────────────────────────────────────────────
export const getCurrentCalendar = async (req, res) => {
  const now = new Date();
  req.query.year = now.getFullYear();
  req.query.month = now.getMonth() + 1;
  return getCalendar(req, res);
};
