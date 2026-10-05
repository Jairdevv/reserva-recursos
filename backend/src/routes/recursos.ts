import { Router } from "express";
import * as recursosController from "../controllers/recursos.controller";
import { autenticarUsuario } from "../middleware/auth";
import { verificarAdmin } from "../middleware/verificarAdmin";

const router = Router();
router.get("/categorias", autenticarUsuario, recursosController.listarCategorias);

router.get("/recursos", autenticarUsuario, recursosController.listar);
router.get("/recursos/:id", autenticarUsuario, recursosController.obtenerPorId);
router.post(
  "/recursos",
  autenticarUsuario,
  verificarAdmin,
  recursosController.crear,
);
router.put(
  "/recursos/:id",
  autenticarUsuario,
  verificarAdmin,
  recursosController.actualizar,
);
router.delete(
  "/recursos/:id",
  autenticarUsuario,
  verificarAdmin,
  recursosController.eliminar,
);

export default router;
