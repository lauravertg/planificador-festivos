-- ============================================
-- MIGRACIÓN: Agregar columna plan_id a entregas
-- ============================================
-- Ejecutar en el SQL Editor de Supabase para actualizar la tabla existente

-- Agregar la columna plan_id (puede ser NULL para entregas sin plan)
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS plan_id BIGINT REFERENCES planes_festivos(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_entregas_plan ON entregas(plan_id);

-- Agregar comentario
COMMENT ON COLUMN entregas.plan_id IS 'Plan festivo al que pertenece esta entrega (opcional)';

-- Verificar
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'entregas'
ORDER BY ordinal_position;
