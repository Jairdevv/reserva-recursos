export interface Recurso {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number | null;
  creado_en: Date;
}

// Lo que recibe el endpoint de crear/editar (sin id ni creado_en, que los genera la DB)
export interface CrearRecursoInput {
  nombre: string;
  descripcion?: string;
  capacidad?: number;
}

export type ActualizarRecursoInput = Partial<CrearRecursoInput>;
