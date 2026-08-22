import { Router } from "express";
import {
  createActivity,
  getActivities,
  searchActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} from "../controller/activity.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Named routes before /:id parameter
router.get("/search", searchActivities);

// Public read routes
router.get("/", getActivities);
router.get("/:id", getActivityById);

// Protected write routes
router.post("/", authenticateToken, createActivity);
router.put("/:id", authenticateToken, updateActivity);
router.delete("/:id", authenticateToken, deleteActivity);

export default router;
