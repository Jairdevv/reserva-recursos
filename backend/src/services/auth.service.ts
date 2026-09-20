import bcrypt from "bcrypt";
import * as usuariosRepo from "../repositories/usuarios.repository";
import { generateJWT } from "../utils/jwt";
import type { LoginResponse, RegistroResponse } from "../types/usuario.types";

// Error personalizado para que el controller sepa qué status code usar
export class EmailYaRegistradoError extends Error {}
export class CredencialesInvalidasError extends Error {}

export async function registrarUsuario(
  nombre: string,
  email: string,
  password: string,
): Promise<RegistroResponse> {
  const hash = await bcrypt.hash(password, 10);
  try {
    return await usuariosRepo.crearUsuario(nombre, email, hash);
  } catch (err: any) {
    if (err.code === "23505") {
      throw new EmailYaRegistradoError("Email ya registrado");
    }
    throw err;
  }
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const usuario = await usuariosRepo.buscarUsuarioPorEmail(email);
  if (!usuario) {
    throw new CredencialesInvalidasError("Credenciales inválidas");
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    throw new CredencialesInvalidasError("Credenciales inválidas");
  }

  const token = generateJWT({ id: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}
