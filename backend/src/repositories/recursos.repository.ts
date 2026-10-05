import pool from "../config/db";
import type {
  CrearRecursoInput,
  Recurso,
  ActualizarRecursoInput,
} from "../types/recurso.types";

export async function obtenerRecursos(): Promise<Recurso[]> {
  const result = await pool.query<Recurso>(
    "SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.activo = true ORDER BY r.nombre, r.id",
  );
  return result.rows;
}

export async function obtenerRecursoPorId(id: number): Promise<Recurso | null> {
  const result = await pool.query<Recurso>(
    "SELECT r.*, c.nombre AS categoria_nombre FROM recursos r LEFT JOIN categorias c ON c.id = r.categoria_id WHERE r.id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function crearRecurso(datos: CrearRecursoInput): Promise<Recurso> {
  const result = await pool.query<Recurso>(
    "WITH inserted AS (INSERT INTO recursos(nombre, descripcion, capacidad, categoria_id) VALUES ($1, $2, $3, $4) RETURNING *) SELECT r.*, c.nombre AS categoria_nombre FROM inserted r LEFT JOIN categorias c ON c.id = r.categoria_id",
    [datos.nombre, datos.descripcion ?? null, datos.capacidad ?? null, datos.categoria_id ?? null],
  );
  return result.rows[0];
}

export async function actualizarRecurso(
  id: number,
  datos: ActualizarRecursoInput,
): Promise<Recurso | null> {
  const result = await pool.query<Recurso>(
    `WITH updated AS (UPDATE recursos SET nombre = COALESCE($1, nombre), descripcion = CASE WHEN $5 THEN $2 ELSE descripcion END, capacidad = CASE WHEN $6 THEN $3 ELSE capacidad END, categoria_id = CASE WHEN $8 THEN $7 ELSE categoria_id END WHERE id = $4 RETURNING *) SELECT r.*, c.nombre AS categoria_nombre FROM updated r LEFT JOIN categorias c ON c.id = r.categoria_id`,
    [
      datos.nombre,
      datos.descripcion,
      datos.capacidad,
      id,
      "descripcion" in datos,
      "capacidad" in datos,
      datos.categoria_id,
      "categoria_id" in datos,
    ],
  );
  return result.rows[0] ?? null;
}

export async function obtenerCategorias(): Promise<{ id: number; nombre: string }[]> {
  const result = await pool.query<{ id: number; nombre: string }>("SELECT id, nombre FROM categorias ORDER BY id");
  return result.rows;
}

export async function eliminarRecurso(id: number): Promise<boolean> {
  const result = await pool.query(
    "UPDATE recursos SET activo = false WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
