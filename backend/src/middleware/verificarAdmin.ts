import type { RequestHandler } from "express";
import { HttpError } from "../utils/errors";

export const verificarAdmin: RequestHandler = (req, _res, next) => {
  if (!req.usuario) {
    throw new HttpError(401, "Autenticación requerida");
  }
  if (req.usuario.rol !== "admin") {
    throw new HttpError(403, "Requiere permisos de administrador");
  }
  next();
};
