import type { Request, Response } from "express";
import * as recursosService from "../services/recursos.service";

export async function listar(req: Request, res: Response) {
  try {
    const recursos = await recursosService.listarRecursos();
    res.json(recursos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar recursos" });
  }
}

export async function obtenerPorId(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const recurso = await recursosService.obtenerRecursoPorId(id);
    if (!recurso) {
      return res.status(404).json({ error: `Recurso ${id} no encontrado` });
    }
    res.json(recurso);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener recurso" });
  }
}

export async function crear(req: Request, res: Response) {
  try {
    const recurso = await recursosService.crearRecurso(req.body);
    res.status(201).json(recurso);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function actualizar(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const recurso = await recursosService.actualizarRecurso(id, req.body);
    res.json(recurso);
  } catch (err) {
    if (err instanceof recursosService.RecursoNoEncontradoError) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al actualizar recurso" });
  }
}

export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    await recursosService.eliminarRecurso(id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof recursosService.RecursoNoEncontradoError) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al eliminar recurso" });
  }
}
