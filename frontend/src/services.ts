import api from "./api";
import type {
  Recurso,
  LoginResponse,
  Reserva,
  ReservaConRecurso,
  RegistroResponse,
} from "./types";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const registro = async (
  nombre: string,
  email: string,
  password: string,
): Promise<RegistroResponse> => {
  const response = await api.post<RegistroResponse>("/auth/registro", {
    email,
    nombre,
    password,
  });
  return response.data;
};

export const getRecursos = async (): Promise<Recurso[]> => {
  const { data } = await api.get<Recurso[]>("/recursos");
  return data;
};

export const getMisReservas = async (): Promise<ReservaConRecurso[]> => {
  const { data } = await api.get<ReservaConRecurso[]>("/mis-reservas");
  return data;
};

export async function getReservasEnRango(
  recursoId: number,
  desde: string,
  hasta: string,
  signal?: AbortSignal,
): Promise<Pick<Reserva, "id" | "inicio" | "fin">[]> {
  const { data } = await api.get<Pick<Reserva, "id" | "inicio" | "fin">[]>(
    `/recursos/${recursoId}/reservas`,
    { params: { desde, hasta }, signal },
  );
  return data;
}

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
