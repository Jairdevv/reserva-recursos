import pool from "../config/db";
import { HttpError } from "../utils/errors";
import type { Reserva, ReservaConRecurso, Disponibilidad } from "../types";

// Los TSRANGE existentes representan horas civiles de America/Bogota.
// Se exponen instantes ISO UTC sin depender de la zona de Node o PostgreSQL.
const times = (alias = "") => {
  const prefix = alias ? alias + "." : "";
  return `to_char((lower(${prefix}rango_horario) AT TIME ZONE 'America/Bogota') AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS inicio,
    to_char((upper(${prefix}rango_horario) AT TIME ZONE 'America/Bogota') AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS fin`;
};
const fields = `id, recurso_id, usuario_id, estado, ${times()}`;
const range =
  "tsrange($2::timestamptz AT TIME ZONE 'America/Bogota', $3::timestamptz AT TIME ZONE 'America/Bogota', '[)')";

export async function obtenerDisponibilidad(
  recursoId: number,
  fecha: string,
): Promise<Disponibilidad[]> {
  const result = await pool.query<Disponibilidad>(
    `SELECT id, ${times()} FROM reservas
     WHERE recurso_id = $1 AND estado = 'confirmada'
     AND rango_horario && tsrange($2::date, $2::date + interval '1 day', '[)')
     ORDER BY lower(rango_horario)`,
    [recursoId, fecha],
  );
  return result.rows;
}
export async function obtenerReservasEnRango(
  recursoId: number,
  desde: string,
  hasta: string,
): Promise<Disponibilidad[]> {
  const result = await pool.query<Disponibilidad>(
    `SELECT id, ${times()} FROM reservas
     WHERE recurso_id = $1 AND estado = 'confirmada'
     AND rango_horario && ${range}
     ORDER BY lower(rango_horario)`,
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // FOR SHARE se coordina con UPDATE activo=false, incluso bajo concurrencia.
    const recurso = await client.query(
      "SELECT activo FROM recursos WHERE id = $1 FOR SHARE",
      [recursoId],
    );
    if (!recurso.rowCount) throw new HttpError(404, "Recurso no encontrado");
    if (!recurso.rows[0].activo)
      throw new HttpError(409, "El recurso está inactivo");
    const result = await client.query<Reserva>(
      `INSERT INTO reservas (recurso_id, usuario_id, rango_horario)
       VALUES ($1, $2, tsrange($3::timestamptz AT TIME ZONE 'America/Bogota',
                              $4::timestamptz AT TIME ZONE 'America/Bogota', '[)'))
       RETURNING ${fields}`,
      [recursoId, usuarioId, inicio, fin],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function obtenerReservasDeUsuario(
  usuarioId: number,
): Promise<ReservaConRecurso[]> {
  const result = await pool.query<ReservaConRecurso>(
    `SELECT r.id, r.estado, ${times("r")}, rec.nombre AS recurso_nombre
     FROM reservas r JOIN recursos rec ON rec.id = r.recurso_id
     WHERE r.usuario_id = $1 ORDER BY lower(r.rango_horario) DESC`,
    [usuarioId],
  );
  return result.rows;
}
export async function obtenerReservaPorId(id: number): Promise<Reserva | null> {
  const result = await pool.query<Reserva>(
    `SELECT ${fields} FROM reservas WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}
export async function cancelarReserva(id: number): Promise<Reserva | null> {
  const result = await pool.query<Reserva>(
    `UPDATE reservas SET estado = 'cancelada',
       actualizado_en = CASE WHEN estado = 'cancelada' THEN actualizado_en ELSE NOW() END
     WHERE id = $1 RETURNING ${fields}`,
    [id],
  );
  return result.rows[0] ?? null;
}
