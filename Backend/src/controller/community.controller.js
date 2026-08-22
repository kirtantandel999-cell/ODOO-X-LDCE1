import prisma from "../lib/prisma.js";

const ok = (res, data, message = "Success", status = 200, extra = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

const fail = (res, message = "Error", status = 500, error = null) =>
  res.status(status).json({ success: false, message, error });

const postInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      city: true,
      country: true,
    },
  },
  destination: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      image: true,
    },
  },
  activity: {
    select: {
      id: true,
      name: true,
      category: true,
      image: true,
      city: true,
      country: true,
    },
  },
  trip: {
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      coverImage: true,
    },
  },
};

const isValidUrl = (str) => {
  if (!str) return true;
  return str.startsWith("http://") || str.startsWith("https://");
};

// ─────────────────────────────────────────────
// POST /api/community (Create Community Post)
// ─────────────────────────────────────────────
export const createCommunityPost = async (req, res) => {
  const userId = req.user.id;
  const { title, content, tripId, destinationId, activityId, rating, image } = req.body;

  if (!title?.trim()) return fail(res, "title is required.", 400);
  if (!content?.trim()) return fail(res, "content is required.", 400);

  if (title.trim().length > 200) {
    return fail(res, "title cannot exceed 200 characters.", 400);
  }
  if (content.trim().length > 5000) {
    return fail(res, "content cannot exceed 5000 characters.", 400);
  }

  let parsedRating = null;
  if (rating !== undefined && rating !== null) {
    parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return fail(res, "rating must be an integer between 1 and 5.", 400);
    }
  }

  if (image && !isValidUrl(image)) {
    return fail(res, "image must be a valid http or https URL.", 400);
  }

  let parsedTripId = null;
  if (tripId !== undefined && tripId !== null) {
    parsedTripId = parseInt(tripId);
    if (isNaN(parsedTripId)) return fail(res, "Invalid tripId.", 400);

    const trip = await prisma.trip.findUnique({ where: { id: parsedTripId } });
    if (!trip) return fail(res, "Referenced trip not found.", 404);
    if (trip.userId !== userId) {
      return fail(res, "You can only share experiences about your own trips.", 403);
    }
  }

  let parsedDestinationId = null;
  if (destinationId !== undefined && destinationId !== null) {
    parsedDestinationId = parseInt(destinationId);
    if (isNaN(parsedDestinationId)) return fail(res, "Invalid destinationId.", 400);

    const dest = await prisma.destination.findUnique({ where: { id: parsedDestinationId } });
    if (!dest) return fail(res, "Referenced destination not found.", 404);
  }

  let parsedActivityId = null;
  if (activityId !== undefined && activityId !== null) {
    parsedActivityId = parseInt(activityId);
    if (isNaN(parsedActivityId)) return fail(res, "Invalid activityId.", 400);

    const act = await prisma.activity.findUnique({ where: { id: parsedActivityId } });
    if (!act) return fail(res, "Referenced activity not found.", 404);
  }

  try {
    const post = await prisma.communityPost.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        tripId: parsedTripId,
        destinationId: parsedDestinationId,
        activityId: parsedActivityId,
        rating: parsedRating,
        image: image?.trim() || null,
      },
      include: postInclude,
    });

    return ok(res, post, "Community post created successfully.", 201);
  } catch (e) {
    console.error("createCommunityPost error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/community (Main Community Posts Feed)
// Supports: search, q, destinationId, activityId, tripId,
//           minRating, sort, groupBy, page, limit
// ─────────────────────────────────────────────
export const getCommunityPosts = async (req, res) => {
  const {
    search,
    q,
    destinationId,
    activityId,
    tripId,
    minRating,
    sort = "newest",
    groupBy,
    page = 1,
    limit = 10,
  } = req.query;

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    rating_desc: { rating: "desc" },
    rating_asc: { rating: "asc" },
    title_asc: { title: "asc" },
    title_desc: { title: "desc" },
  };

  if (sort && !validSortMap[sort]) {
    return fail(
      res,
      `Invalid sort parameter. Allowed values: ${Object.keys(validSortMap).join(", ")}`,
      400
    );
  }

  const validGroups = ["destination", "activity", "rating", "user"];
  if (groupBy && !validGroups.includes(String(groupBy).toLowerCase())) {
    return fail(
      res,
      `Invalid groupBy parameter. Allowed values: ${validGroups.join(", ")}`,
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

  if (minRating !== undefined) {
    const r = parseInt(minRating);
    if (isNaN(r) || r < 1 || r > 5) {
      return fail(res, "Invalid minRating. Must be an integer between 1 and 5.", 400);
    }
  }

  const where = {};
  const queryTerm = (search || q || "").trim();

  if (queryTerm) {
    where.OR = [
      { title: { contains: queryTerm, mode: "insensitive" } },
      { content: { contains: queryTerm, mode: "insensitive" } },
      { destination: { name: { contains: queryTerm, mode: "insensitive" } } },
      { destination: { city: { contains: queryTerm, mode: "insensitive" } } },
      { destination: { country: { contains: queryTerm, mode: "insensitive" } } },
      { activity: { name: { contains: queryTerm, mode: "insensitive" } } },
      { trip: { title: { contains: queryTerm, mode: "insensitive" } } },
      { user: { firstName: { contains: queryTerm, mode: "insensitive" } } },
      { user: { lastName: { contains: queryTerm, mode: "insensitive" } } },
    ];
  }

  if (destinationId) {
    const dId = parseInt(destinationId);
    if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);
    where.destinationId = dId;
  }

  if (activityId) {
    const aId = parseInt(activityId);
    if (isNaN(aId)) return fail(res, "Invalid activityId.", 400);
    where.activityId = aId;
  }

  if (tripId) {
    const tId = parseInt(tripId);
    if (isNaN(tId)) return fail(res, "Invalid tripId.", 400);
    where.tripId = tId;
  }

  if (minRating) {
    where.rating = { gte: parseInt(minRating) };
  }

  const orderBy = validSortMap[sort] || validSortMap.newest;

  try {
    if (groupBy) {
      const posts = await prisma.communityPost.findMany({
        where,
        orderBy,
        include: postInclude,
      });

      const normalizedGroup = String(groupBy).toLowerCase();
      const groupedData = {};

      for (const post of posts) {
        let groupKey = "General";
        if (normalizedGroup === "destination") {
          groupKey = post.destination?.name || "General Travel";
        } else if (normalizedGroup === "activity") {
          groupKey = post.activity?.name || "General Experiences";
        } else if (normalizedGroup === "rating") {
          groupKey = post.rating ? `${post.rating} Stars` : "Unrated";
        } else if (normalizedGroup === "user") {
          groupKey = `${post.user.firstName} ${post.user.lastName}`.trim();
        }

        if (!groupedData[groupKey]) groupedData[groupKey] = [];
        groupedData[groupKey].push(post);
      }

      return ok(
        res,
        groupedData,
        "Community posts fetched and grouped successfully.",
        200,
        {
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: posts.length,
            totalPages: Math.ceil(posts.length / limitNum) || 1,
          },
          summary: { totalPosts: posts.length },
        }
      );
    }

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy,
        skip,
        take,
        include: postInclude,
      }),
      prisma.communityPost.count({ where }),
    ]);

    return ok(
      res,
      posts,
      "Community posts fetched successfully.",
      200,
      {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || (total === 0 ? 0 : 1),
        },
        summary: {
          totalPosts: total,
        },
      }
    );
  } catch (e) {
    console.error("getCommunityPosts error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/community/user/me (My Community Posts)
// ─────────────────────────────────────────────
export const getMyCommunityPosts = async (req, res) => {
  const userId = req.user.id;
  const { sort = "newest", page = 1, limit = 10 } = req.query;

  const validSortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    rating_desc: { rating: "desc" },
    rating_asc: { rating: "asc" },
    title_asc: { title: "asc" },
    title_desc: { title: "desc" },
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
        include: postInclude,
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
        summary: { totalPosts: total },
      }
    );
  } catch (e) {
    console.error("getMyCommunityPosts error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// GET /api/community/:id (Single Community Post)
// ─────────────────────────────────────────────
export const getCommunityPostById = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid post ID.", 400);

  try {
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: postInclude,
    });

    if (!post) return fail(res, "Community post not found.", 404);

    return ok(res, post, "Community post fetched successfully.");
  } catch (e) {
    console.error("getCommunityPostById error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// PUT /api/community/:id (Update Community Post)
// ─────────────────────────────────────────────
export const updateCommunityPost = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid post ID.", 400);

  const userId = req.user.id;
  const { title, content, tripId, destinationId, activityId, rating, image } = req.body;

  try {
    const existing = await prisma.communityPost.findUnique({ where: { id } });
    if (!existing) return fail(res, "Community post not found.", 404);
    if (existing.userId !== userId) {
      return fail(res, "Forbidden: You do not own this post.", 403);
    }

    if (title !== undefined && !title?.trim()) {
      return fail(res, "title cannot be empty.", 400);
    }
    if (content !== undefined && !content?.trim()) {
      return fail(res, "content cannot be empty.", 400);
    }
    if (title && title.trim().length > 200) {
      return fail(res, "title cannot exceed 200 characters.", 400);
    }
    if (content && content.trim().length > 5000) {
      return fail(res, "content cannot exceed 5000 characters.", 400);
    }

    let parsedRating = undefined;
    if (rating !== undefined) {
      if (rating === null) {
        parsedRating = null;
      } else {
        const r = parseInt(rating);
        if (isNaN(r) || r < 1 || r > 5) {
          return fail(res, "rating must be an integer between 1 and 5.", 400);
        }
        parsedRating = r;
      }
    }

    if (image !== undefined && image !== null && !isValidUrl(image)) {
      return fail(res, "image must be a valid http or https URL.", 400);
    }

    let parsedTripId = undefined;
    if (tripId !== undefined) {
      if (tripId === null) {
        parsedTripId = null;
      } else {
        const tId = parseInt(tripId);
        if (isNaN(tId)) return fail(res, "Invalid tripId.", 400);
        const trip = await prisma.trip.findUnique({ where: { id: tId } });
        if (!trip) return fail(res, "Referenced trip not found.", 404);
        if (trip.userId !== userId) {
          return fail(res, "You can only link your own trips.", 403);
        }
        parsedTripId = tId;
      }
    }

    let parsedDestinationId = undefined;
    if (destinationId !== undefined) {
      if (destinationId === null) {
        parsedDestinationId = null;
      } else {
        const dId = parseInt(destinationId);
        if (isNaN(dId)) return fail(res, "Invalid destinationId.", 400);
        const dest = await prisma.destination.findUnique({ where: { id: dId } });
        if (!dest) return fail(res, "Referenced destination not found.", 404);
        parsedDestinationId = dId;
      }
    }

    let parsedActivityId = undefined;
    if (activityId !== undefined) {
      if (activityId === null) {
        parsedActivityId = null;
      } else {
        const aId = parseInt(activityId);
        if (isNaN(aId)) return fail(res, "Invalid activityId.", 400);
        const act = await prisma.activity.findUnique({ where: { id: aId } });
        if (!act) return fail(res, "Referenced activity not found.", 404);
        parsedActivityId = aId;
      }
    }

    const updated = await prisma.communityPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(parsedTripId !== undefined && { tripId: parsedTripId }),
        ...(parsedDestinationId !== undefined && { destinationId: parsedDestinationId }),
        ...(parsedActivityId !== undefined && { activityId: parsedActivityId }),
        ...(parsedRating !== undefined && { rating: parsedRating }),
        ...(image !== undefined && { image: image ? image.trim() : null }),
      },
      include: postInclude,
    });

    return ok(res, updated, "Community post updated successfully.");
  } catch (e) {
    console.error("updateCommunityPost error:", e);
    return fail(res, "Internal server error.");
  }
};

// ─────────────────────────────────────────────
// DELETE /api/community/:id (Delete Community Post)
// ─────────────────────────────────────────────
export const deleteCommunityPost = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, "Invalid post ID.", 400);

  const userId = req.user.id;

  try {
    const existing = await prisma.communityPost.findUnique({ where: { id } });
    if (!existing) return fail(res, "Community post not found.", 404);
    if (existing.userId !== userId) {
      return fail(res, "Forbidden: You do not own this post.", 403);
    }

    await prisma.communityPost.delete({ where: { id } });
    return ok(res, null, "Community post deleted successfully.");
  } catch (e) {
    console.error("deleteCommunityPost error:", e);
    return fail(res, "Internal server error.");
  }
};
