import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../config/db";
import { verificarToken } from "../middleware/auth";
import type { Reserva } from "../types.js";


const router = Router();

// Ver disponibilidad (reservas existentes) de un recurso en una fecha
router.get("/recursos/:id/disponibilidad", async (req: Request, res:Response) => {
  const { id } = req.params;
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "El parámetro 'fecha' es requerido" });
  }

  try {
    const result = await pool.query<Pick<Reserva, "id" | "rango_horario">>(
      `SELECT id, rango_horario FROM reservas
       WHERE recurso_id = $1
         AND estado = 'confirmada'
         AND rango_horario && tsrange($2::date, $2::date + interval '1 day')`,
      [id, fecha],
    );
    res.json({ reservasExistentes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar disponibilidad" });
  }
});

// Crear una reserva (requiere estar autenticado)
router.post("/reservas", verificarToken, async (req: Request, res:Response) => {
  const { recurso_id, inicio, fin } = req.body;
  const usuario_id = req.usuario!.id;

  if (!recurso_id || !inicio || !fin) {
    return res
      .status(400)
      .json({ error: "recurso_id, inicio y fin son requeridos" });
  }

  try {
    const result = await pool.query<Reserva>(
      `INSERT INTO reservas (recurso_id, usuario_id, rango_horario)
       VALUES ($1, $2, tsrange($3, $4))
       RETURNING id, recurso_id, rango_horario, estado`,
      [recurso_id, usuario_id, inicio, fin],
    );
    res.status(201).json(result.rows[0]);
  } catch (err:any) {
    if (err.code === "23P01") {
      // Violación del constraint EXCLUDE = choque de horario
      return res.status(409).json({ error: "Ese horario ya está reservado" });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear la reserva" });
  }
});

// Ver mis propias reservas
router.get("/reservas/mias", verificarToken, async (req:Request, res:Response) => {
  const usuario_id = req.usuario!.id;
  try {
    const result = await pool.query(
      `SELECT r.id, r.rango_horario, r.estado, rec.nombre AS recurso_nombre
       FROM reservas r
       JOIN recursos rec ON rec.id = r.recurso_id
       WHERE r.usuario_id = $1
       ORDER BY r.rango_horario`,
      [usuario_id],
    );
    res.json(result.rows);
  } catch (err:any) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar tus reservas" });
  }
});

export default router;
