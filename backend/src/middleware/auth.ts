import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { config } from "../config/env";

export const verificarToken: RequestHandler = (req, res, next) => {
  const match = req.headers.authorization?.match(/^Bearer (\S+)$/i);
  if (!match) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }
  try {
    const payload = jwt.verify(match[1], config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !Number.isSafeInteger(payload.id) ||
        payload.id <= 0 || !["usuario", "admin"].includes(payload.rol)) {
      throw new Error("Token inválido");
    }
    req.usuario = { id: payload.id, rol: payload.rol };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
