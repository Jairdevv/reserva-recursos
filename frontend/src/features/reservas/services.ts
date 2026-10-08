import api from "../../shared/api/http";
import type { Reserva, ReservaConRecurso } from "../reservas/types";

export const getMisReservas = async (signal?: AbortSignal): Promise<ReservaConRecurso[]> => {
  const { data } = await api.get<ReservaConRecurso[]>("/mis-reservas", { signal });
  return data;
};

export const getReservasEnRango = async (
  recursoId: number,
  desde: string,
  hasta: string,
  signal?: AbortSignal,
): Promise<Pick<Reserva, "id" | "inicio" | "fin">[]> => {
  const { data } = await api.get<Pick<Reserva, "id" | "inicio" | "fin">[]>(
    `/recursos/${recursoId}/reservas`,
    { params: { desde, hasta }, signal },
  );
  return data;
};

export const crearReserva = async (
  recurso_id: number,
  inicio: string,
  fin: string,
): Promise<Reserva> => {
  const { data } = await api.post<Reserva>("/reservas", {
    recurso_id,
    inicio,
    fin,
  });
  return data;
};

export const cancelarReserva = async (id: number): Promise<Reserva> => {
  const { data } = await api.patch<Reserva>(`/reservas/${id}/cancelar`);
  return data;
};

