export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "usuario" | "admin";
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export type RegistroResponse = Pick<Usuario, "id" | "nombre" | "email">;

