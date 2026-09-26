import type { Request, Response } from "express";
import * as service from "../services/reservas.service";
import { objectInput, positiveId } from "../utils/validation";

export async function disponibilidad(req: Request, res: Response) {
  const reservasExistentes = await service.consultarDisponibilidad(positiveId(req.params.id), req.query.fecha);
  res.json({ reservasExistentes });
}
export async function reservasEnRango(req: Request, res: Response) {
  res.json(await service.consultarReservasEnRango(positiveId(req.params.id), req.query.desde, req.query.hasta));
}
export async function crear(req: Request, res: Response) {
  const { recurso_id, inicio, fin } = objectInput(req.body);
  res.status(201).json(await service.crearReserva(positiveId(recurso_id), req.usuario!.id, inicio, fin));
}
export async function misReservas(req: Request, res: Response) {
  res.json(await service.listarMisReservas(req.usuario!.id));
}
export async function cancelar(req: Request, res: Response) {
  res.json(await service.cancelarReserva(positiveId(req.params.id), req.usuario!));
}
