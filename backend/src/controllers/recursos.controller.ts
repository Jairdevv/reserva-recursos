import type { Request, Response } from "express";
import * as service from "../services/recursos.service";
import { positiveId } from "../utils/validation";

export async function listar(_req: Request, res: Response) {
  res.json(await service.listarRecursos());
}
export async function obtenerPorId(req: Request, res: Response) {
  res.json(await service.obtenerRecursoPorId(positiveId(req.params.id)));
}
export async function crear(req: Request, res: Response) {
  res.status(201).json(await service.crearRecurso(req.body));
}
export async function actualizar(req: Request, res: Response) {
  res.json(await service.actualizarRecurso(positiveId(req.params.id), req.body));
}
// DELETE conserva su ruta, pero desactiva: nunca borra el historial.
export async function eliminar(req: Request, res: Response) {
  await service.eliminarRecurso(positiveId(req.params.id));
  res.status(204).send();
}
