import { Router } from "express";
import {
  getDashboard,
  getUsers,
  getUserById,
  getUserTrips,
  getUserCommunityPosts,
  updateUserStatus,
  getPopularCities,
  getPopularActivities,
  getAnalytics,
  getUserTrends,
  getTripTrends,
} from "../controller/admin.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// Protected: All admin routes require JWT authentication and ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

// ── 1. Dashboard ──────────────────────────────
router.get("/dashboard", getDashboard);

// ── 2. User Management ────────────────────────
router.get("/users", getUsers);
router.get("/users/:userId/trips", getUserTrips);
router.get("/users/:userId/community", getUserCommunityPosts);
router.patch("/users/:userId/status", updateUserStatus);
router.get("/users/:userId", getUserById);

// ── 3. Popular Cities & Activities ────────────
router.get("/popular-cities", getPopularCities);
router.get("/popular-activities", getPopularActivities);

// ── 4. Analytics & Trends ─────────────────────
router.get("/analytics/users", getUserTrends);
router.get("/analytics/trips", getTripTrends);
router.get("/analytics", getAnalytics);

export default router;
