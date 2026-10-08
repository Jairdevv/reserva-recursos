import api from "../../shared/api/http";
import type { Categoria } from "../categorias/types";

export const getCategorias = async (signal?: AbortSignal): Promise<Categoria[]> => {
  const { data } = await api.get<Categoria[]>("/categorias", { signal });
  return data;
};
export const crearCategoria = async (nombre: string): Promise<Categoria> => {
  const { data } = await api.post<Categoria>("/categorias", { nombre });
  return data;
};
export const renombrarCategoria = async (id: number, nombre: string): Promise<Categoria> => {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, { nombre });
  return data;
};
export const eliminarCategoria = async (id: number): Promise<void> => {
  await api.delete(`/categorias/${id}`);
};

