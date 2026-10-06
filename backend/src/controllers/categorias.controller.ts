import type { Request, Response } from "express";
import * as service from "../services/categorias.service";
import { positiveId } from "../utils/validation";
export async function crear(req: Request, res: Response) { res.status(201).json(await service.crear(req.body)); }
export async function renombrar(req: Request, res: Response) { res.json(await service.renombrar(positiveId(req.params.id), req.body)); }
export async function eliminar(req: Request, res: Response) { await service.eliminar(positiveId(req.params.id)); res.status(204).send(); }
