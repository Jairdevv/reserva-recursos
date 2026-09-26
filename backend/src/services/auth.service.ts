import bcrypt from "bcrypt";
import * as usuariosRepo from "../repositories/usuarios.repository";
import { generateJWT } from "../utils/jwt";
import { HttpError, databaseCode } from "../utils/errors";
import { emailInput, passwordInput, textInput } from "../utils/validation";
import type { LoginResponse, RegistroResponse } from "../types/usuario.types";

export async function registrarUsuario(nombre: unknown, email: unknown, password: unknown): Promise<RegistroResponse> {
  const normalizedName = textInput(nombre, "Nombre", 100);
  const normalizedEmail = emailInput(email);
  const validPassword = passwordInput(password, true);
  const hash = await bcrypt.hash(validPassword, 10);
  try {
    return await usuariosRepo.crearUsuario(normalizedName, normalizedEmail, hash);
  } catch (error) {
    if (databaseCode(error) === "23505") throw new HttpError(409, "Email ya registrado");
    throw error;
  }
}

export async function iniciarSesion(email: unknown, password: unknown): Promise<LoginResponse> {
  const normalizedEmail = emailInput(email);
  const validPassword = passwordInput(password);
  const usuario = await usuariosRepo.buscarUsuarioPorEmail(normalizedEmail);
  if (!usuario || !await bcrypt.compare(validPassword, usuario.password_hash)) {
    throw new HttpError(401, "Credenciales inválidas");
  }
  return {
    token: generateJWT({ id: usuario.id, rol: usuario.rol }),
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  };
}
