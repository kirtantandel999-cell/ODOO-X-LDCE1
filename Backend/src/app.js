import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middlewares ───────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Health check ─────────────────────────────
app.get("/", (req, res) => {
    res.json({ message: "GlobeTrotter API is running 🌍" });
});

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
