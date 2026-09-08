import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/recursos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recursos");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar recursos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
