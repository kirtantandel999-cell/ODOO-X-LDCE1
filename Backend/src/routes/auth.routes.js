import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
} from "../controller/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public routes ───────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected routes (require valid JWT) ────
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

export default router;
