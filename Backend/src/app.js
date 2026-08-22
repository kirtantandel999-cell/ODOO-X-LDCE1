import "dotenv/config";
import express from "express";
import cors from "cors";

// ── Routes ───────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import regionRoutes from "./routes/region.routes.js";
import destinationRoutes from "./routes/destination.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import homeRoutes from "./routes/home.routes.js";
import userRoutes from "./routes/user.routes.js";
import communityRoutes from "./routes/community.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middlewares ───────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Route Mounts ─────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/home", homeRoutes);

// ── Health check ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GlobeTrotter API is running 🌍",
    version: "1.0.0",
    endpoints: [
      "/api/auth",
      "/api/users",
      "/api/regions",
      "/api/destinations",
      "/api/activities",
      "/api/trips",
      "/api/community",
      "/api/calendar",
      "/api/admin",
      "/api/banners",
      "/api/home",
    ],
  });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ GlobeTrotter API running at http://localhost:${PORT}`);
});
