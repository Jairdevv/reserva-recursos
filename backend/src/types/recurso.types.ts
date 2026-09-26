export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  activo: boolean;
  creado_en: Date;
}
export interface CrearRecursoInput {
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
}
export type ActualizarRecursoInput = Partial<CrearRecursoInput>;
