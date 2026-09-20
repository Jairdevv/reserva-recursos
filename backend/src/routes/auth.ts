import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db";
import { generateJWT } from "../utils/jwt";
import type { LoginResponse, Usuario } from "../types.js";

const router = Router();

router.post("/registro", async (req: Request, res: Response) => {
  const { nombre, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query<Pick<Usuario, "id" | "nombre" | "email">>(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
      [nombre, email, hash],
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email ya registrado" });
    }
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query<Usuario>(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );
    const usuario = result.rows[0];
    if (!usuario)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash,
    );
    if (!passwordValida)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const token = generateJWT({ id: usuario.id, rol: usuario.rol });

    const response: LoginResponse = {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

export default router;
