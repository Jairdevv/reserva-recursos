export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "usuario" | "admin";
  creado_en: Date;
}

export type RegistroResponse = Pick<Usuario, "id" | "nombre" | "email">;

export interface LoginResponse {
  token: string;
  usuario: Pick<Usuario, "id" | "nombre" | "email" | "rol">;
}
