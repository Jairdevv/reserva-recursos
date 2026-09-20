import pool from "../config/db.js";
import type { Usuario } from "../types.js";

export async function crearUsuario(
  nombre: string,
  email: string,
  passwordHash: string,
): Promise<Pick<Usuario, "id" | "nombre" | "email">> {
  const result = await pool.query<Pick<Usuario, "id" | "nombre" | "email">>(
    "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
    [nombre, email, passwordHash],
  );
  return result.rows[0];
}

export async function buscarUsuarioPorEmail(
  email: string,
): Promise<Usuario | null> {
  const result = await pool.query<Usuario>(
    "SELECT * FROM usuarios WHERE email = $1",
    [email],
  );
  return result.rows[0] ?? null;
}
