import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.js";

import tripRoutes from "./routes/trips.js";
import messageRoutes from "./routes/messages.js";
import citiesRoutes from "./routes/cities.js";
import usersRoutes from "./routes/users.js";
import spRequestsRoutes from "./routes/spRequests.js";
import matchesRoutes from "./routes/matches.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/cities", citiesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sp-requests", spRequestsRoutes);
app.use("/api/matches", matchesRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
