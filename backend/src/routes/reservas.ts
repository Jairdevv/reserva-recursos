import { Router } from "express";
import { verificarToken } from "../middleware/auth";
import * as reservasController from "../controllers/reservas.controller";

const router = Router();

router.get("/recursos/:id/disponibilidad", reservasController.disponibilidad);
router.post("/reservas", verificarToken, reservasController.crear);
router.get("/mis-reservas", verificarToken, reservasController.misReservas);
router.patch(
  "/reservas/:id/cancelar",
  verificarToken,
  reservasController.cancelar,
);

export default router;
