import { Router } from "express";
import {
  createDestination,
  getDestinations,
  searchDestinations,
  getDestinationById,
  updateDestination,
  deleteDestination,
} from "../controller/destination.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// IMPORTANT: /search must be before /:id to avoid "search" being parsed as an ID
router.get("/search", searchDestinations);

router.get("/", getDestinations);
router.get("/:id", getDestinationById);
router.post("/", authenticateToken, createDestination);
router.put("/:id", authenticateToken, updateDestination);
router.delete("/:id", authenticateToken, deleteDestination);

export default router;
