import api from "../../shared/api/http";
import type { Recurso, NuevoRecurso } from "../recursos/types";

export const getRecursos = async (signal?: AbortSignal): Promise<Recurso[]> => {
  const { data } = await api.get<Recurso[]>("/recursos", { signal });
  return data;
};
export const getRecursosAdministracion = async (signal?: AbortSignal): Promise<Recurso[]> => {
  const { data } = await api.get<Recurso[]>("/admin/recursos", { signal });
  return data;
};
export const reactivarRecurso = async (id: number): Promise<Recurso> => {
  const { data } = await api.patch<Recurso>(`/recursos/${id}/reactivar`);
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

export const getRecurso = async (id: number, signal?: AbortSignal): Promise<Recurso> => {
  const { data } = await api.get<Recurso>(`/recursos/${id}`, { signal });
  return data;
};
