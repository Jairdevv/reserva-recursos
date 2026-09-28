import api from "./api";
import type {
  Recurso,
  LoginResponse,
  Reserva,
  ReservaConRecurso,
  RegistroResponse,
  NuevoRecurso,
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

export const getRecursos = async (signal?: AbortSignal): Promise<Recurso[]> => {
  const { data } = await api.get<Recurso[]>("/recursos", { signal });
  return data;
};

export const crearRecurso = async (datos: NuevoRecurso): Promise<Recurso> => {
  const { data } = await api.post<Recurso>("/recursos", datos);
  return data;
};

export const actualizarRecurso = async (
  id: number,
  datos: NuevoRecurso,
): Promise<Recurso> => {
  const { data } = await api.put<Recurso>(`/recursos/${id}`, datos);
  return data;
};

export const desactivarRecurso = async (id: number): Promise<void> => {
  await api.delete(`/recursos/${id}`);
};

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

export const getRecurso = async (id: number, signal?: AbortSignal): Promise<Recurso> => {
  const { data } = await api.get<Recurso>(`/recursos/${id}`, { signal });
  return data;
};
