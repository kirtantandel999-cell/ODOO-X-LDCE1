import prisma from "../lib/prisma.js";

/**
 * Admin authorization middleware.
 * Verifies that the authenticated JWT user has role === 'ADMIN' in database.
 */
export const requireAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      error: null,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true, active: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
        error: null,
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
        error: null,
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: null,
    });
  }
};
