import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import reservasRoutes from "./routes/reservas.js";
import recursosRoutes from "./routes/recursos.js";

const app = express();
app.use(cors());
app.use(json());
app.use("/auth", authRoutes);
app.use("/", recursosRoutes);
app.use("/", reservasRoutes);

// app.get("/health", (req, res) => {
//   res.json({ status: "OK" });
// });

export default app;
