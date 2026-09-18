export interface Usuario {
  id: number;
  nombre: string;
  rol: "usuario" | "admin";
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
}

export interface Reserva {
  id: number;
  recurso_id: number;
  rango_horario: string; // Postgres devuelve elSRANGE como string, ej: '["2026-09-10 14:00","2026-09-10 16:00")'
  estado: "confirmada" | "cancelada";
}

export interface ReservaConRecurso {
  id: number;
  rango_horario: string;
  estado: "confirmada" | "cancelada";
  recurso_nombre: string;
}
