-- ============================================
-- MIGRACIÓN: Agregar columna updated_at a entregas
-- ============================================
-- Este script agrega la columna updated_at que falta en la tabla entregas
-- Ejecutar en el SQL Editor de Supabase

-- Agregar columna updated_at si no existe
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Crear o reemplazar el trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar el trigger si existe y recrearlo
DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas;

CREATE TRIGGER update_entregas_updated_at
  BEFORE UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la columna fue creada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'entregas'
AND column_name = 'updated_at';
