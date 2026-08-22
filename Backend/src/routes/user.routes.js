import { Router } from "express";
import {
  getProfileDashboard,
  getPreplannedTrips,
  getPreviousTrips,
  getTripSummary,
} from "../controller/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ── Screen 7 Profile Dashboard Routes ───────────
router.get("/me", getProfileDashboard);
router.get("/me/trips/preplanned", getPreplannedTrips);
router.get("/me/trips/previous", getPreviousTrips);
router.get("/me/trips/summary", getTripSummary);

export default router;
