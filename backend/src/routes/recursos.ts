import { Router } from "express";
import type {Request, Response} from "express"
import pool from "../config/db";
import type { Recurso } from "../types.js";


const router = Router();

router.get("/recursos", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<Recurso>("SELECT * FROM recursos");
    res.json(result.rows);
  } catch (err:any) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar recursos" });
  }
});

export default router;
