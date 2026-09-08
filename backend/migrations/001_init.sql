CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'usuario',
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recursos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  capacidad INTEGER,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  recurso_id INTEGER REFERENCES recursos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  rango_horario TSRANGE NOT NULL,
  estado VARCHAR(20) DEFAULT 'confirmada',
  creado_en TIMESTAMP DEFAULT NOW(),
  EXCLUDE USING GIST (
    recurso_id WITH =,
    rango_horario WITH &&
  ) WHERE (estado = 'confirmada')
);
