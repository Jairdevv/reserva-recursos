import * as repo from "../repositories/categorias.repository";
import { HttpError, databaseCode } from "../utils/errors";
import { objectInput, positiveId, textInput } from "../utils/validation";
function nombreCategoria(value: unknown): string {
  const data = objectInput(value);
  if (Object.keys(data).some(key => key !== "nombre")) throw new HttpError(400, "Campos de categoría no admitidos");
  return textInput(data.nombre, "Nombre de categoría", 100);
}
function traducirError(error: unknown): never {
  const code = databaseCode(error);
  if (code === "23505") throw new HttpError(409, "Ya existe una categoría con ese nombre");
  if (code === "23503" || code === "23001") throw new HttpError(409, "La categoría está en uso. Reasigna sus recursos activos e inactivos antes de eliminarla");
  throw error;
}
export async function crear(value: unknown) {
  const nombre = nombreCategoria(value);
  try { return await repo.crear(nombre); } catch (error) { traducirError(error); }
}
export async function renombrar(id: number, value: unknown) {
  const nombre = nombreCategoria(value);
  try {
    const categoria = await repo.renombrar(positiveId(id), nombre);
    if (!categoria) throw new HttpError(404, "Categoría no encontrada");
    return categoria;
  } catch (error) { traducirError(error); }
}
export async function eliminar(id: number) {
  try {
    if (!await repo.eliminar(positiveId(id))) throw new HttpError(404, "Categoría no encontrada");
  } catch (error) { traducirError(error); }
}
