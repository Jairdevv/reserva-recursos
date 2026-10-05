import { Router } from "express";
import { autenticarUsuario } from "../middleware/auth";
import * as reservasController from "../controllers/reservas.controller";

const router = Router();

router.get(
  "/recursos/:id/disponibilidad",
  autenticarUsuario,
  reservasController.disponibilidad,
);
router.get(
  "/recursos/:id/reservas",
  autenticarUsuario,
  reservasController.reservasEnRango,
);
router.get("/mis-reservas", autenticarUsuario, reservasController.misReservas);
router.post("/reservas", autenticarUsuario, reservasController.crear);
router.patch(
  "/reservas/:id/cancelar",
  autenticarUsuario,
  reservasController.cancelar,
);

export default router;
