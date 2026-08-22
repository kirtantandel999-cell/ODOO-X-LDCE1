import { Router } from "express";
import {
  searchPlaces,
  getPlaces,
  getSuggestions,
  createTrip,
  planTrip,
  getUserTrips,
  getOngoingTrips,
  getUpcomingTrips,
  getCompletedTrips,
  getMyTrips,
  getPreviousTrips,
  getTripById,
  getTripItinerary,
  updateTrip,
  deleteTrip,
  addDestinationToTrip,
  getTripDestinations,
  updateTripDestination,
  removeTripDestination,
  addActivityToTrip,
  getTripActivities,
  updateTripActivity,
  removeTripActivity,
} from "../controller/trip.controller.js";
import {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
  reorderSections,
  linkSectionDestination,
  unlinkSectionDestination,
  linkSectionActivity,
  unlinkSectionActivity,
  getTripBudget,
} from "../controller/section.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// ── Public / Selection Helper Routes ──────────
router.get("/places/search", searchPlaces);
router.get("/places", getPlaces);
router.get("/suggestions", getSuggestions);

// ── Protected Routes (Require Authentication) ─
router.use(authenticateToken);

// Screen 6 Main Trips Listing API
router.get("/", getUserTrips);

// Named filter endpoints before /:id parameter
router.get("/ongoing", getOngoingTrips);
router.get("/upcoming", getUpcomingTrips);
router.get("/completed", getCompletedTrips);
router.get("/my", getMyTrips);
router.get("/previous", getPreviousTrips);

router.post("/plan", planTrip);

// Trip Itinerary & Budget
router.get("/:tripId/itinerary", getTripItinerary);
router.get("/:tripId/budget", getTripBudget);

// Trip Sections (Build Itinerary - Screen 5)
// IMPORTANT: /reorder must be placed BEFORE /:sectionId
router.put("/:tripId/sections/reorder", reorderSections);

router.post("/:tripId/sections", createSection);
router.get("/:tripId/sections", getSections);
router.get("/:tripId/sections/:sectionId", getSectionById);
router.put("/:tripId/sections/:sectionId", updateSection);
router.delete("/:tripId/sections/:sectionId", deleteSection);

// Section Entity Links
router.post("/:tripId/sections/:sectionId/destination", linkSectionDestination);
router.delete("/:tripId/sections/:sectionId/destination", unlinkSectionDestination);
router.post("/:tripId/sections/:sectionId/activity", linkSectionActivity);
router.delete("/:tripId/sections/:sectionId/activity", unlinkSectionActivity);

// Trip CRUD
router.post("/", createTrip);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

// Trip Destination Sub-resource
router.post("/:tripId/destinations", addDestinationToTrip);
router.get("/:tripId/destinations", getTripDestinations);
router.put("/:tripId/destinations/:tdId", updateTripDestination);
router.delete("/:tripId/destinations/:tdId", removeTripDestination);

// Trip Activity Sub-resource
router.post("/:tripId/activities", addActivityToTrip);
router.get("/:tripId/activities", getTripActivities);
router.put("/:tripId/activities/:tripActivityId", updateTripActivity);
router.delete("/:tripId/activities/:tripActivityId", removeTripActivity);

export default router;
