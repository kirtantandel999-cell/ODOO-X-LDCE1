import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
} from "../controller/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// ── Public routes ───────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected routes (require valid JWT) ────
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);

export default router;
