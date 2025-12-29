-- ============================================
-- INSERTAR DATOS DE PRUEBA EN PLATAFORMAS
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase para añadir las plataformas

-- Insertar plataformas de ejemplo
INSERT INTO plataformas (nombre, cliente_id, activo) VALUES
  ('Aldi Masquefa', (SELECT id FROM clientes WHERE nombre = 'Aldi' LIMIT 1), true),
  ('Aldi Sagunto', (SELECT id FROM clientes WHERE nombre = 'Aldi' LIMIT 1), true),
  ('ANTICH SPANISH FOOD, S.L.', (SELECT id FROM clientes WHERE nombre = 'Antich' LIMIT 1), true),
  ('Costco Torija', (SELECT id FROM clientes WHERE nombre = 'Costco' LIMIT 1), true),
  ('ECI Mercamadrid', (SELECT id FROM clientes WHERE nombre = 'El Corte Inglés' LIMIT 1), true),
  ('Family', (SELECT id FROM clientes WHERE nombre = 'Family' LIMIT 1), true),
  ('Grupo más', (SELECT id FROM clientes WHERE nombre = 'Grupo más' LIMIT 1), true)
ON CONFLICT DO NOTHING;

-- O si la tabla clientes no tiene esos registros, insertar sin cliente_id:
-- DELETE FROM plataformas; -- Solo si quieres limpiar antes
-- INSERT INTO plataformas (nombre, activo) VALUES
--   ('Aldi Masquefa', true),
--   ('Aldi Sagunto', true),
--   ('ANTICH SPANISH FOOD, S.L.', true),
--   ('Costco Torija', true),
--   ('ECI Mercamadrid', true),
--   ('Family', true),
--   ('Grupo más', true);

-- Verificar que se insertaron
SELECT id, nombre, activo FROM plataformas WHERE activo = true ORDER BY nombre;
