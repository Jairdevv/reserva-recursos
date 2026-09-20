import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../types/index";

export function verificarToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    req.usuario = payload;
    next();
  } catch (err: any) {
    console.error(err);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}
