import { Router } from "express";
import * as recursosController from "../controllers/recursos.controller";
import { verificarToken } from "../middleware/auth";
import { verificarAdmin } from "../middleware/verificarAdmin";

const router = Router();

router.get("/recursos", verificarToken, recursosController.listar);
router.get("/recursos/:id", verificarToken, recursosController.obtenerPorId);
router.post(
  "/recursos",
  verificarToken,
  verificarAdmin,
  recursosController.crear,
);
router.put(
  "/recursos/:id",
  verificarToken,
  verificarAdmin,
  recursosController.actualizar,
);
router.delete(
  "/recursos/:id",
  verificarToken,
  verificarAdmin,
  recursosController.eliminar,
);

export default router;
