import { Router } from "express";
import { verificarToken } from "../middleware/auth";
import * as reservasController from "../controllers/reservas.controller";

const router = Router();

router.get("/recursos/:id/disponibilidad", reservasController.disponibilidad);
router.get("/recursos/:id/reservas", reservasController.reservasEnRango);
router.get("/mis-reservas", verificarToken, reservasController.misReservas);
router.post("/reservas", verificarToken, reservasController.crear);
router.patch(
  "/reservas/:id/cancelar",
  verificarToken,
  reservasController.cancelar,
);

export default router;
