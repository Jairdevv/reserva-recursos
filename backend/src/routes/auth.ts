import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { loginLimit, registroLimit } from "../middleware/authLimits";

const router = Router();

router.post("/registro", registroLimit, authController.registro);

router.post("/login", loginLimit, authController.login);

export default router;
