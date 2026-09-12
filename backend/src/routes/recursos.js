import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

router.get("/recursos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recursos");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar recursos" });
  }
});

export default router;
