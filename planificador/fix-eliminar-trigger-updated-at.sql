-- ============================================
-- FIX ALTERNATIVO: Eliminar trigger de updated_at
-- ============================================
-- Si prefieres no agregar la columna updated_at, ejecuta este script
-- para eliminar el trigger que está causando el error
-- Ejecutar en el SQL Editor de Supabase

-- Eliminar el trigger problemático
DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas;

-- Eliminar la función si no se usa en ningún otro lugar
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Verificar que el trigger fue eliminado
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'entregas';
