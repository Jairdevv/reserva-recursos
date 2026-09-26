import type { ErrorRequestHandler } from "express";
import { HttpError, databaseCode } from "../utils/errors";

export const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido" });
    return;
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "La solicitud es demasiado grande" });
    return;
  }
  const code = databaseCode(error);
  if (code === "23P01") {
    res.status(409).json({ error: "Ese horario ya está reservado" });
    return;
  }
  console.error("Error inesperado", { name: error?.name, code });
  res.status(500).json({ error: "Error interno del servidor" });
};
