import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";
import messageRoutes from "./routes/messages.js";
import citiesRoutes from "./routes/cities.js";
import usersRoutes from "./routes/users.js";
import spRequestsRoutes from "./routes/spRequests.js";
import matchesRoutes from "./routes/matches.js";
import companyVehiclesRoutes from "./routes/companyVehicles.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const isLocalNetwork = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isLocalNetwork(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiadas tentativas. Aguarda 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Demasiados pedidos. Aguarda 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/trips", apiLimiter, tripRoutes);
app.use("/api/messages", apiLimiter, messageRoutes);
app.use("/api/cities", apiLimiter, citiesRoutes);
app.use("/api/users", apiLimiter, usersRoutes);
app.use("/api/sp-requests", apiLimiter, spRequestsRoutes);
app.use("/api/matches", apiLimiter, matchesRoutes);
app.use("/api/company-vehicles", apiLimiter, companyVehiclesRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
