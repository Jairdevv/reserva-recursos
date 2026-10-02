import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { config } from "../config/env";
import { buscarUsuarioPorId } from "../repositories/usuarios.repository";
import { HttpError } from "../utils/errors";

export const verificarToken: RequestHandler = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    throw new HttpError(401, "Token requerido");
  }

  const match = authorization.match(/^Bearer (\S+)$/i);
  if (!match) {
    throw new HttpError(401, "Token inválido");
  }
  let payload: string | jwt.JwtPayload;

  try {
    payload = jwt.verify(match[1], config.jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, "Token expirado");
    }

    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError
    ) {
      throw new HttpError(401, "Token inválido");
    }

    throw error;
  }

  if (
    typeof payload === "string" ||
    !Number.isSafeInteger(payload.id) ||
    !Number.isSafeInteger(payload.version_sesion) ||
    payload.id <= 0 ||
    payload.version_sesion < 0
  ) {
    throw new HttpError(401, "Token inválido");
  }

  const usuario = await buscarUsuarioPorId(payload.id);
  if (
    !usuario ||
    !usuario.activo ||
    usuario.version_sesion !== payload.version_sesion
  ) {
    throw new HttpError(401, "Usuario no encontrado");
  }

  req.usuario = {
    id: usuario.id,
    rol: usuario.rol,
    version_sesion: usuario.version_sesion,
  };
  next();
};
