import { Router } from "express";
import {
  getHomePage,
  getActiveBanner,
  getRegionalSelections,
} from "../controller/home.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/banner", getActiveBanner);
router.get("/regional-selections", getRegionalSelections);
router.get("/", authenticateToken, getHomePage); // requires auth (includes user's trips)

export default router;
