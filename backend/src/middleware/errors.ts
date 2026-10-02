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

  const unavailable =
    code?.startsWith("08") ||
    [
      "57P01",
      "57P02",
      "57P03",
      "53300",
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      "EAI_AGAIN",
    ].includes(code ?? "");

  if (unavailable) {
    console.error("Infraestructura no disponible", {
      name: error?.name,
      code,
    });

    res.status(503).json({ error: "Servicio temporalmente no disponible" });
    return;
  }
  console.error("Error inesperado", { name: error?.name, code });
  res.status(500).json({ error: "Error interno del servidor" });
};
