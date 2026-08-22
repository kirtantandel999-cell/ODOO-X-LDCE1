import { Router } from "express";
import {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../controller/banner.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getBanners);
router.get("/:id", getBannerById);
router.post("/", authenticateToken, createBanner);
router.put("/:id", authenticateToken, updateBanner);
router.delete("/:id", authenticateToken, deleteBanner);

export default router;
