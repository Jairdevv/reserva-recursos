import pool from "../config/db";
import type {
  CrearRecursoInput,
  Recurso,
  ActualizarRecursoInput,
} from "../types/recurso.types";

export async function obtenerRecursos(): Promise<Recurso[]> {
  const result = await pool.query<Recurso>(
    "SELECT * FROM recursos WHERE activo = true ORDER BY nombre, id",
  );
  return result.rows;
}

export async function obtenerRecursoPorId(id: number): Promise<Recurso | null> {
  const result = await pool.query<Recurso>(
    "SELECT * FROM recursos WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function crearRecurso(datos: CrearRecursoInput): Promise<Recurso> {
  const result = await pool.query<Recurso>(
    "INSERT INTO recursos(nombre, descripcion, capacidad) VALUES ($1, $2, $3) RETURNING *",
    [datos.nombre, datos.descripcion ?? null, datos.capacidad ?? null],
  );
  return result.rows[0];
}

export async function actualizarRecurso(
  id: number,
  datos: ActualizarRecursoInput,
): Promise<Recurso | null> {
  const result = await pool.query<Recurso>(
    `UPDATE recursos SET nombre = COALESCE($1, nombre), descripcion = CASE WHEN $5 THEN $2 ELSE descripcion END, capacidad = CASE WHEN $6 THEN $3 ELSE capacidad END WHERE id = $4 RETURNING *`,
    [
      datos.nombre,
      datos.descripcion,
      datos.capacidad,
      id,
      "descripcion" in datos,
      "capacidad" in datos,
    ],
  );
  return result.rows[0] ?? null;
}

export async function eliminarRecurso(id: number): Promise<boolean> {
  const result = await pool.query(
    "UPDATE recursos SET activo = false WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
