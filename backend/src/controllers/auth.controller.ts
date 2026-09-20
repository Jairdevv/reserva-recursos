import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function registro(req: Request, res: Response) {
  const { nombre, email, password } = req.body;
  try {
    const usuario = await authService.registrarUsuario(nombre, email, password);
    res.status(201).json(usuario);
  } catch (err) {
    if (err instanceof authService.EmailYaRegistradoError) {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const data = await authService.iniciarSesion(email, password);
    res.json(data);
  } catch (err) {
    if (err instanceof authService.CredencialesInvalidasError) {
      return res.status(401).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
}
