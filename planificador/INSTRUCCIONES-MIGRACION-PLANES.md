# Instrucciones para Migración: Sistema de Planes

## Cambios Realizados

Se ha implementado un sistema de planes festivos obligatorio que requiere:

1. **Modificación de la base de datos**: Se agregó la columna `id_plan` a la tabla `entregas`
2. **Nuevo componente**: Selector de plan en la interfaz
3. **Validación**: No se pueden crear entregas sin un plan seleccionado

## Pasos para Migrar la Base de Datos

### 1. Ejecutar el script de migración en Supabase

1. Abre tu proyecto en [Supabase](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `migracion-add-id-plan.sql` y copia su contenido
4. Pégalo en el SQL Editor
5. Haz clic en **Run** para ejecutar la migración

### 2. Verificar la migración

Ejecuta esta consulta para verificar que la columna se agregó correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'entregas'
ORDER BY ordinal_position;
```

Deberías ver la columna `id_plan` de tipo `bigint` y nullable `YES`.

## Comportamiento del Sistema

### Antes de seleccionar un plan:
- La pizarra no se muestra
- Se muestra un mensaje: "No hay plan seleccionado"
- No se pueden agregar entregas

### Después de seleccionar un plan:
- La pizarra se muestra normalmente
- Solo se muestran las entregas asociadas a ese plan
- Las nuevas entregas se asocian automáticamente al plan seleccionado
- Al cambiar de plan, se solicita confirmación si hay cambios sin guardar

## Crear un Nuevo Plan

1. En la vista de Pizarra, haz clic en **+ Nuevo Plan**
2. Ingresa:
   - **Nombre**: ej. "Puente Navidad 2024"
   - **Fecha Inicio**: Primera fecha del rango
   - **Fecha Fin**: Última fecha del rango
3. Haz clic en **Crear Plan**
4. El plan se selecciona automáticamente

## Notas Importantes

- **Entregas existentes**: Las entregas que ya existían en la base de datos tendrán `id_plan = NULL`. Pueden aparecer si se selecciona el filtro adecuado, pero se recomienda asociarlas a un plan específico.
- **Cambio de plan**: Al cambiar de plan, solo verás las entregas de ese plan específico.
- **Eliminación de planes**: Si eliminas un plan festivo, todas sus entregas asociadas se eliminarán automáticamente (CASCADE).

## Archivos Modificados

1. `supabase-schema.sql` - Schema actualizado con `id_plan`
2. `migracion-add-id-plan.sql` - Script de migración
3. `src/features/board/PlanSelector.vue` - Nuevo componente selector
4. `src/features/board/BoardView.vue` - Validación de plan
5. `src/App.vue` - Integración del selector y lógica de filtrado

## Solución de Problemas

### Error: "column id_plan does not exist"
- Ejecuta el script de migración `migracion-add-id-plan.sql`

### No veo ningún plan en el desplegable
- Ve a **Config** y verifica que existan planes festivos en la base de datos
- Si no hay planes, créalos usando el botón **+ Nuevo Plan**

### Las entregas antiguas no aparecen
- Las entregas sin `id_plan` no se mostrarán en ningún plan
- Considera crear un plan "Histórico" y actualizar manualmente esas entregas
