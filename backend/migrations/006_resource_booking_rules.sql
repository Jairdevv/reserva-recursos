ALTER TABLE recursos ADD COLUMN reglas_reserva JSONB;
ALTER TABLE recursos ADD CONSTRAINT recursos_reglas_object CHECK (reglas_reserva IS NULL OR jsonb_typeof(reglas_reserva) = 'object');
