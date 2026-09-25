import type { Request, Response } from "express";
import * as reservasService from "../services/reservas.service";

export async function disponibilidad(req: Request, res: Response) {
  const recursoId = Number(req.params.id);
  const { fecha } = req.query;

  if (!fecha || typeof fecha !== "string") {
    return res.status(400).json({ error: "El parámetro 'fecha' es requerido" });
  }

  try {
    const reservasExistentes = await reservasService.consultarDisponibilidad(
      recursoId,
      fecha,
    );
    res.json({ reservasExistentes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar disponibilidad" });
  }
}

export async function reservasEnRango(req: Request, res: Response) {
  const recursoId = Number(req.params.id);
  const { desde, hasta } = req.query;

  if (
    !desde ||
    !hasta ||
    typeof desde !== "string" ||
    typeof hasta !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Los parámetros 'desde' y 'hasta' son requeridos" });
  }

  try {
    const reservas = await reservasService.consultarReservasEnRango(
      recursoId,
      desde,
      hasta,
    );
    res.json(reservas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar reservas" });
  }
}

export async function crear(req: Request, res: Response) {
  const { recurso_id, inicio, fin } = req.body;
  const usuarioId = req.usuario!.id;

  if (!recurso_id || !inicio || !fin) {
    return res
      .status(400)
      .json({ error: "recurso_id, inicio y fin son requeridos" });
  }

  try {
    const reserva = await reservasService.crearReserva(
      recurso_id,
      usuarioId,
      inicio,
      fin,
    );
    res.status(201).json(reserva);
  } catch (err) {
    if (err instanceof reservasService.HorarioOcupadoError) {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al crear la reserva" });
  }
}

export async function misReservas(req: Request, res: Response) {
  const usuarioId = req.usuario!.id;
  try {
    const reservas = await reservasService.listarMisReservas(usuarioId);
    res.json(reservas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar tus reservas" });
  }
}

export async function cancelar(req: Request, res: Response) {
  const reservaId = Number(req.params.id);
  try {
    const reserva = await reservasService.cancelarReserva(
      reservaId,
      req.usuario!,
    );
    res.json(reserva);
  } catch (err) {
    if (err instanceof reservasService.ReservaNoEncontradaError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof reservasService.NoAutorizadoError) {
      return res.status(403).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
}
