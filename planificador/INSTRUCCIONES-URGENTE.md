# 🚨 ACCIÓN REQUERIDA: Ejecutar Migración en Supabase

## Problema
La aplicación está intentando guardar entregas con `plan_id`, pero esta columna **NO EXISTE** en tu tabla `entregas` de Supabase.

## Solución

### Paso 1: Abrir Supabase SQL Editor
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor** desde el menú lateral

### Paso 2: Ejecutar la migración
Copia y pega el siguiente SQL en el editor:

```sql
-- ============================================
-- MIGRACIÓN: Agregar columna plan_id a entregas
-- ============================================

-- Agregar la columna plan_id (puede ser NULL para entregas sin plan)
ALTER TABLE entregas
ADD COLUMN IF NOT EXISTS plan_id BIGINT REFERENCES planes_festivos(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_entregas_plan ON entregas(plan_id);

-- Agregar comentario
COMMENT ON COLUMN entregas.plan_id IS 'Plan festivo al que pertenece esta entrega (opcional)';

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'entregas'
ORDER BY ordinal_position;
```

### Paso 3: Ejecutar
Haz clic en **"RUN"** o **"Ejecutar"**

### Paso 4: Verificar
Deberías ver una lista de columnas que incluya `plan_id` con tipo `bigint` y `is_nullable = YES`

### Paso 5: Recargar la aplicación
Una vez ejecutada la migración, recarga la aplicación en el navegador.

## ✅ Después de esto
- Las entregas se guardarán correctamente
- Cada entrega estará asociada a su plan festivo
- Podrás filtrar entregas por plan

---

**Nota**: Este archivo de migración también está disponible en `migracion-add-plan-id.sql`
