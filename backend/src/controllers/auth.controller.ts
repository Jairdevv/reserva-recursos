import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { objectInput } from "../utils/validation";

export async function registro(req: Request, res: Response) {
  const { nombre, email, password } = objectInput(req.body);
  res.status(201).json(await authService.registrarUsuario(nombre, email, password));
}

export async function login(req: Request, res: Response) {
  const { email, password } = objectInput(req.body);
  res.json(await authService.iniciarSesion(email, password));
}
