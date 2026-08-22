import { Router } from "express";
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from "../controller/region.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getRegions);
router.get("/:id", getRegionById);
router.post("/", authenticateToken, createRegion);
router.put("/:id", authenticateToken, updateRegion);
router.delete("/:id", authenticateToken, deleteRegion);

export default router;
