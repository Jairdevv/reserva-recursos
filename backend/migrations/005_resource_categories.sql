CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO categorias (nombre) VALUES
  ('Salas de reunión'), ('Canchas deportivas'), ('Laboratorios'), ('Multimedia'), ('Otros');

-- Los recursos existentes quedan sin clasificar hasta que un administrador los asigne.
ALTER TABLE recursos ADD COLUMN categoria_id INTEGER REFERENCES categorias(id) ON DELETE RESTRICT;
CREATE INDEX recursos_categoria_id_idx ON recursos(categoria_id);
