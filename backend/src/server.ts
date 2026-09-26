import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import reservasRoutes from "./routes/reservas";
import recursosRoutes from "./routes/recursos";
import { config } from "./config/env";
import { handleError } from "./middleware/errors";

const app = express();
app.use(cors({ origin: config.origins }));
app.use(json());
app.use("/auth", authRoutes);
app.use("/", recursosRoutes);
app.use("/", reservasRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use((_req, res) => { res.status(404).json({ error: "Ruta no encontrada" }); });
app.use(handleError);

export default app;
