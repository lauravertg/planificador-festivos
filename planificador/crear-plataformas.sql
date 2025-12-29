-- ============================================
-- CREAR TABLA PLATAFORMAS Y DATOS DE PRUEBA
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear tabla plataformas
CREATE TABLE IF NOT EXISTS plataformas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_nombre TEXT,
  empresa_transporte TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plataformas_activo ON plataformas(activo);
CREATE INDEX IF NOT EXISTS idx_plataformas_nombre ON plataformas(nombre);

-- Insertar datos de ejemplo (basados en la captura de pantalla)
INSERT INTO plataformas (nombre, cliente_nombre, empresa_transporte, activo) VALUES
  ('Aldi Masquefa', 'Aldi', 'Innova', true),
  ('Aldi Sagunto', 'Aldi', 'Innova', true),
  ('ANTICH SPANISH FOOD, S.L.', 'Antich', 'Primafrío', true),
  ('Costco Torija', 'Costco', 'Disfrimur', true),
  ('ECI Mercamadrid', 'El Corte Inglés', 'Otros', true),
  ('Family', 'Family', 'Innova', true),
  ('Grupo más', 'Grupo más', 'Primafrío', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT * FROM plataformas ORDER BY nombre;
