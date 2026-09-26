import * as repo from "../repositories/recursos.repository";
import type { CrearRecursoInput, ActualizarRecursoInput } from "../types";
import { HttpError } from "../utils/errors";
import { objectInput, positiveId, textInput } from "../utils/validation";

export function validarRecurso(
  value: unknown,
  partial = false,
): ActualizarRecursoInput {
  const data = objectInput(value);
  const result: ActualizarRecursoInput = {};
  if (
    Object.keys(data).some(
      (key) => !["nombre", "descripcion", "capacidad"].includes(key),
    )
  ) {
    throw new HttpError(400, "Campos de recurso no admitidos");
  }
  if (!partial || "nombre" in data)
    result.nombre = textInput(data.nombre, "Nombre", 100);
  if ("descripcion" in data) {
    if (data.descripcion !== null && typeof data.descripcion !== "string") {
      throw new HttpError(400, "Descripción inválida");
    }
    result.descripcion = data.descripcion as string | null;
  }
  if ("capacidad" in data) {
    if (
      data.capacidad !== null &&
      (typeof data.capacidad !== "number" ||
        !Number.isInteger(data.capacidad) ||
        data.capacidad <= 0 ||
        data.capacidad > 2147483647)
    ) {
      throw new HttpError(
        400,
        "La capacidad debe ser un entero positivo o null",
      );
    }
    result.capacidad = data.capacidad as number | null;
  }
  if (!Object.keys(result).length)
    throw new HttpError(400, "No hay campos para actualizar");
  return result;
}

export const listarRecursos = () => repo.obtenerRecursos();

export async function obtenerRecursoPorId(id: number) {
  const recurso = await repo.obtenerRecursoPorId(positiveId(id));
  if (!recurso) throw new HttpError(404, "Recurso no encontrado");
  return recurso;
}

export async function requerirRecursoActivo(id: number) {
  const recurso = await obtenerRecursoPorId(id);
  if (!recurso.activo) throw new HttpError(409, "El recurso está inactivo");
  return recurso;
}

export const crearRecurso = (value: unknown) =>
  repo.crearRecurso(validarRecurso(value) as CrearRecursoInput);

export async function actualizarRecurso(id: number, value: unknown) {
  const data = validarRecurso(value, true);
  const recurso = await repo.actualizarRecurso(positiveId(id), data);
  if (!recurso) throw new HttpError(404, "Recurso no encontrado");
  return recurso;
}

export async function eliminarRecurso(id: number) {
  if (!(await repo.eliminarRecurso(positiveId(id))))
    throw new HttpError(404, "Recurso no encontrado");
}
