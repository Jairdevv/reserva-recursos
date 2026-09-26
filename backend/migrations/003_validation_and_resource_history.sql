BEGIN;

ALTER TABLE recursos ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;

-- NOT VALID conserva filas históricas; las nuevas escrituras sí se validan.
ALTER TABLE recursos ADD CONSTRAINT recurso_nombre_valido
  CHECK (length(btrim(nombre)) > 0) NOT VALID;
ALTER TABLE recursos ADD CONSTRAINT recurso_capacidad_valida
  CHECK (capacidad IS NULL OR capacidad > 0) NOT VALID;
ALTER TABLE reservas ADD CONSTRAINT reserva_rango_valido
  CHECK (NOT isempty(rango_horario) AND NOT lower_inf(rango_horario)
    AND NOT upper_inf(rango_horario) AND lower_inc(rango_horario) AND NOT upper_inc(rango_horario)) NOT VALID;

-- Una eliminación física accidental no debe borrar el historial.
ALTER TABLE reservas DROP CONSTRAINT reservas_recurso_id_fkey;
ALTER TABLE reservas ADD CONSTRAINT reservas_recurso_id_fkey
  FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE RESTRICT;

-- Si hay emails históricos equivalentes, aborta sin borrar ni fusionar cuentas.
CREATE UNIQUE INDEX usuarios_email_normalizado ON usuarios (lower(btrim(email)));

COMMIT;
