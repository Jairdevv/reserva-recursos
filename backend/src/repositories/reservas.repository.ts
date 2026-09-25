import pool from "../config/db";
import type { Reserva, ReservaConRecurso } from "../types/index";

export async function obtenerDisponibilidad(recursoId: number, fecha: string) {
  const result = await pool.query<Pick<Reserva, "id" | "rango_horario">>(
    `SELECT id, rango_horario FROM reservas
     WHERE recurso_id = $1
       AND estado = 'confirmada'
       AND rango_horario && tsrange($2::date, $2::date + interval '1 day')`,
    [recursoId, fecha],
  );
  return result.rows;
}

export async function obtenerReservasEnRango(
  recursoId: number,
  desde: string,
  hasta: string,
): Promise<Pick<Reserva, "id" | "rango_horario">[]> {
  const result = await pool.query<Pick<Reserva, "id" | "rango_horario">>(
    `SELECT id, rango_horario FROM reservas
     WHERE recurso_id = $1
       AND estado = 'confirmada'
       AND rango_horario && tsrange($2::date, $3::date)`,
    [recursoId, desde, hasta],
  );
  return result.rows;
}

export async function crearReserva(
  recursoId: number,
  usuarioId: number,
  inicio: string,
  fin: string,
): Promise<Reserva> {
  const result = await pool.query<Reserva>(
    `INSERT INTO reservas (recurso_id, usuario_id, rango_horario)
     VALUES ($1, $2, tsrange($3, $4))
     RETURNING *`,
    [recursoId, usuarioId, inicio, fin],
  );
  return result.rows[0];
}

export async function obtenerReservasDeUsuario(
  usuarioId: number,
): Promise<ReservaConRecurso[]> {
  const result = await pool.query<ReservaConRecurso>(
    `SELECT r.id, r.rango_horario, r.estado, rec.nombre AS recurso_nombre
     FROM reservas r
     JOIN recursos rec ON rec.id = r.recurso_id
     WHERE r.usuario_id = $1
     ORDER BY r.rango_horario`,
    [usuarioId],
  );
  return result.rows;
}

export async function obtenerReservaPorId(id: number): Promise<Reserva | null> {
  const result = await pool.query<Reserva>(
    "SELECT * FROM reservas WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function cancelarReserva(id: number): Promise<Reserva | null> {
  const result = await pool.query<Reserva>(
    "UPDATE reservas SET estado = 'cancelada', actualizado_en = NOW() WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0] ?? null;
}
