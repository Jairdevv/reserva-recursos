import * as repo from "../repositories/reservas.repository";
import { requerirRecursoActivo } from "./recursos.service";
import type { JwtPayload } from "../types";
import { HttpError, databaseCode } from "../utils/errors";
import { dateOnly, dateRange, positiveId } from "../utils/validation";

export async function consultarDisponibilidad(recursoId: number, fecha: unknown) {
  const day = dateOnly(fecha);
  await requerirRecursoActivo(positiveId(recursoId));
  return repo.obtenerDisponibilidad(recursoId, day);
}
export async function consultarReservasEnRango(recursoId: number, desde: unknown, hasta: unknown) {
  const { inicio, fin } = dateRange(desde, hasta);
  if (Date.parse(fin) - Date.parse(inicio) > 366 * 86400000) {
    throw new HttpError(400, "Consulta como máximo 366 días por solicitud");
  }
  await requerirRecursoActivo(positiveId(recursoId));
  return repo.obtenerReservasEnRango(recursoId, inicio, fin);
}
export async function crearReserva(recursoId: number, usuarioId: number, inicio: unknown, fin: unknown) {
  const range = dateRange(inicio, fin, true);
  positiveId(recursoId);
  try {
    return await repo.crearReserva(recursoId, usuarioId, range.inicio, range.fin);
  } catch (error) {
    if (databaseCode(error) === "23P01") throw new HttpError(409, "Ese horario ya está reservado");
    throw error;
  }
}
export const listarMisReservas = (usuarioId: number) => repo.obtenerReservasDeUsuario(usuarioId);
export async function cancelarReserva(id: number, usuario: JwtPayload) {
  const reserva = await repo.obtenerReservaPorId(positiveId(id));
  if (!reserva) throw new HttpError(404, "Reserva no encontrada");
  if (reserva.usuario_id !== usuario.id && usuario.rol !== "admin") {
    throw new HttpError(403, "No puedes cancelar una reserva que no es tuya");
  }
  const cancelada = await repo.cancelarReserva(id);
  if (!cancelada) throw new HttpError(404, "Reserva no encontrada");
  return cancelada;
}
