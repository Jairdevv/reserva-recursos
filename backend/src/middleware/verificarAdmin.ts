import type { Request, Response, NextFunction } from "express";

export function verificarAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.usuario?.rol !== "admin") {
    return res
      .status(403)
      .json({ error: "Requiere permisos de administrador" });
  }
  next();
}
