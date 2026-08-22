import { Router } from "express";
import {
  createTrip,
  planTrip,
  getMyTrips,
  getPreviousTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addDestinationToTrip,
  getTripDestinations,
  updateTripDestination,
  removeTripDestination,
} from "../controller/trip.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// All trip routes require authentication
router.use(authenticateToken);

// IMPORTANT: named routes before /:id to avoid conflicts
router.post("/plan", planTrip);
router.get("/my", getMyTrips);
router.get("/previous", getPreviousTrips);

// Trip CRUD
router.post("/", createTrip);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

// Trip Destination sub-resource
router.post("/:tripId/destinations", addDestinationToTrip);
router.get("/:tripId/destinations", getTripDestinations);
router.put("/:tripId/destinations/:tdId", updateTripDestination);
router.delete("/:tripId/destinations/:tdId", removeTripDestination);

export default router;
