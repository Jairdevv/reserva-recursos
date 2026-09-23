-- Índices en las foreign keys 
CREATE INDEX idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX idx_reservas_recurso_id ON reservas(recurso_id);

-- Restringe los valores válidos de estado
ALTER TABLE reservas ADD CONSTRAINT estado_valido CHECK (estado IN ('confirmada', 'cancelada'));

-- Registro de cuándo se actualizó una reserva (ej. al cancelarla)
ALTER TABLE reservas ADD COLUMN actualizado_en TIMESTAMP DEFAULT NOW();