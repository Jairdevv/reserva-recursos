import * as recursosRepo from "../repositories/recursos.repository";
import type {
  Recurso,
  CrearRecursoInput,
  ActualizarRecursoInput,
} from "../types/index.js";

export class RecursoNoEncontradoError extends Error {}

export async function listarRecursos(): Promise<Recurso[]> {
  return recursosRepo.obtenerRecursos();
}

export async function obtenerRecursoPorId(id: number): Promise<Recurso | null> {
  return recursosRepo.obtenerRecursoPorId(id);
}

export async function crearRecurso(datos: CrearRecursoInput): Promise<Recurso> {
  if (!datos.nombre || datos.nombre.trim().length === 0) {
    throw new Error("El nombre del recurso es requerido");
  }
  return recursosRepo.crearRecurso(datos);
}

export async function actualizarRecurso(
  id: number,
  datos: ActualizarRecursoInput,
): Promise<Recurso> {
  const actualizado = await recursosRepo.actualizarRecurso(id, datos);
  if (!actualizado) {
    throw new RecursoNoEncontradoError(`Recurso ${id} no encontrado`);
  }
  return actualizado;
}

export async function eliminarRecurso(id: number): Promise<void> {
  const eliminado = await recursosRepo.eliminarRecurso(id);
  if (!eliminado) {
    throw new RecursoNoEncontradoError(`Recurso ${id} no encontrado`);
  }
}
