import { Router } from "express";
import * as recursosController from "../controllers/recursos.controller";
import * as categoriasController from "../controllers/categorias.controller";
import { autenticarUsuario } from "../middleware/auth";
import { verificarAdmin } from "../middleware/verificarAdmin";

const router = Router();
router.get("/categorias", autenticarUsuario, recursosController.listarCategorias);
router.post("/categorias", autenticarUsuario, verificarAdmin, categoriasController.crear);
router.put("/categorias/:id", autenticarUsuario, verificarAdmin, categoriasController.renombrar);
router.delete("/categorias/:id", autenticarUsuario, verificarAdmin, categoriasController.eliminar);

router.get("/recursos", autenticarUsuario, recursosController.listar);
router.get("/admin/recursos", autenticarUsuario, verificarAdmin, recursosController.listarAdministracion);
router.patch("/recursos/:id/reactivar", autenticarUsuario, verificarAdmin, recursosController.reactivar);
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
