import { Router } from "express";
import {
  createCommunityPost,
  getCommunityPosts,
  getMyCommunityPosts,
  getCommunityPostById,
  updateCommunityPost,
  deleteCommunityPost,
} from "../controller/community.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// ── Public Feed ──────────────────────────────
router.get("/", getCommunityPosts);

// ── Authenticated User Posts (/user/me before /:id) ──
router.get("/user/me", authenticateToken, getMyCommunityPosts);

// ── Single Post ──────────────────────────────
router.get("/:id", getCommunityPostById);

// ── Protected Write Operations ───────────────
router.post("/", authenticateToken, createCommunityPost);
router.put("/:id", authenticateToken, updateCommunityPost);
router.delete("/:id", authenticateToken, deleteCommunityPost);

export default router;
