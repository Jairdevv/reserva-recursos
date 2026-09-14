export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "usuario" | "admin";
  creado_en: Date;
}

export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  creado_en: Date;
}

export interface Reserva {
  id: number;
  recurso_id: number;
  usuario_id: number;
  rango_horario: string; // Postgres devuelve el TSRANGE como string, ej: '["2026-09-10 14:00","2026-09-10 16:00")'
  estado: "confirmada" | "cancelada";
  creado_en: Date;
}

// Tipos para el payload del JWT
export interface JwtPayload {
  id: number;
  rol: "usuario" | "admin";
}

// Extiende Express para que req.usuario tenga tipo
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}