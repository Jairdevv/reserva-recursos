import pool from "../config/db";
type Categoria = { id: number; nombre: string };
export async function crear(nombre: string): Promise<Categoria> {
  const result = await pool.query<Categoria>("INSERT INTO categorias(nombre) VALUES ($1) RETURNING id, nombre", [nombre]);
  return result.rows[0];
}
export async function renombrar(id: number, nombre: string): Promise<Categoria | null> {
  const result = await pool.query<Categoria>("UPDATE categorias SET nombre = $2 WHERE id = $1 RETURNING id, nombre", [id, nombre]);
  return result.rows[0] ?? null;
}
export async function eliminar(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM categorias WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
