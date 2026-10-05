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

export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  activo: boolean;
  categoria_id: number | null;
  categoria_nombre: string | null;
}
export interface NuevoRecurso {
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
  categoria_id?: number | null;
}
export interface Categoria {
  id: number;
  nombre: string;
}

export interface Reserva {
  id: number;
  recurso_id: number;
  inicio: string;
  fin: string;
  estado: "confirmada" | "cancelada";
}

export interface ReservaConRecurso {
  id: number;
  inicio: string;
  fin: string;
  estado: "confirmada" | "cancelada";
  recurso_nombre: string;
}
