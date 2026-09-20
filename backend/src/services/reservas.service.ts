import * as reservasRepo from "../repositories/reservas.repository";
import type { Reserva, ReservaConRecurso, JwtPayload } from "../types/index";

export class HorarioOcupadoError extends Error {}
export class ReservaNoEncontradaError extends Error {}
export class NoAutorizadoError extends Error {}

export async function consultarDisponibilidad(
  recursoId: number,
  fecha: string,
) {
  return reservasRepo.obtenerDisponibilidad(recursoId, fecha);
}

export async function crearReserva(
  recursoId: number,
  usuarioId: number,
  inicio: string,
  fin: string,
): Promise<Reserva> {
  try {
    return await reservasRepo.crearReserva(recursoId, usuarioId, inicio, fin);
  } catch (err: any) {
    if (err.code === "23P01") {
      throw new HorarioOcupadoError("Ese horario ya está reservado");
    }
    throw err;
  }
}

export async function listarMisReservas(
  usuarioId: number,
): Promise<ReservaConRecurso[]> {
  return reservasRepo.obtenerReservasDeUsuario(usuarioId);
}

export async function cancelarReserva(
  reservaId: number,
  usuario: JwtPayload,
): Promise<Reserva> {
  const reserva = await reservasRepo.obtenerReservaPorId(reservaId);
  if (!reserva) {
    throw new ReservaNoEncontradaError("Reserva no encontrada");
  }

  const esDueno = reserva.usuario_id === usuario.id;
  const esAdmin = usuario.rol === "admin";
  if (!esDueno && !esAdmin) {
    throw new NoAutorizadoError(
      "No puedes cancelar una reserva que no es tuya",
    );
  }

  const cancelada = await reservasRepo.cancelarReserva(reservaId);
  return cancelada!;
}
