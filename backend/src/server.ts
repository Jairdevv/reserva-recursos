import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import reservasRoutes from "./routes/reservas";
import recursosRoutes from "./routes/recursos";

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
