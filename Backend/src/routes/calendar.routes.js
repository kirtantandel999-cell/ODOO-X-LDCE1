import { Router } from "express";
import {
  getCalendar,
  getCurrentCalendar,
} from "../controller/calendar.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Protected: All calendar routes require authentication
router.use(authenticateToken);

// Current Month Helper (registered before root if applicable)
router.get("/current", getCurrentCalendar);

// Main Calendar View Endpoint
router.get("/", getCalendar);

export default router;
