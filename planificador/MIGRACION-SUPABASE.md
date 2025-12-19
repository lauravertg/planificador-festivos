# 🚀 Guía de Migración a Supabase - Planificador de Festivos

## ✅ Cambios Completados

### 1. Bug del Calendario Corregido ✅
- **Archivo**: `src/features/settings/ConfigPanel.vue`
- **Cambio**: Eliminado reset automático de selección al cambiar de mes
- **Nuevo**: Botón "Limpiar" para borrar selección manualmente
- **Resultado**: Ahora puedes seleccionar rangos multi-mes (ej: 22/12/25 → 03/01/26)

### 2. Data Store Migrado ✅
- **Archivo**: `src/stores/data.js`
- Reemplazado completamente con integración Supabase
- Incluye real-time subscriptions
- Funciones: `loadPlataformas()`, `loadFestivos()`, `loadPlanesFestivos()`, `loadEntregas()`

### 3. ConfigPanel Actualizado ✅
- **Archivo**: `src/features/settings/ConfigPanel.vue`
- Todas las operaciones CRUD migradas a Supabase
- Campos actualizados a español (date → fecha, name → nombre, etc.)

### 4. App.vue Actualizado ✅
- **Archivo**: `src/App.vue`
- Eliminados imports de Firebase
- Inicialización del store en `onMounted()`
- Función `handleSaveCell` migrada a Supabase

### 5. BoardView Actualizado ✅
- **Archivo**: `src/features/board/BoardView.vue`
- `mockClients` → `plataformas`
- `holidays` → `festivos`
- Muestra `cliente_nombre` debajo del nombre de plataforma

---

## 📋 Pasos Pendientes (Debes Completar)

### Paso 1: Configurar Credenciales de Supabase

1. **Copia el archivo de ejemplo**:
   ```bash
   cd /workspaces/planificador-festivos/planificador
   cp .env.example .env.local
   ```

2. **Edita `.env.local` y añade tus credenciales**:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

3. **Obtén las credenciales desde Supabase**:
   - Ve a tu proyecto en [https://supabase.com](https://supabase.com)
   - Settings → API
   - Copia:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Paso 2: Ejecutar Script SQL en Supabase

1. **Abre el SQL Editor en Supabase**:
   - Ve a tu proyecto Supabase
   - Click en "SQL Editor" en el menú lateral

2. **Ejecuta el script**:
   - Abre el archivo `supabase-schema.sql` (está en la carpeta planificador)
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en "Run" o presiona Ctrl+Enter

3. **Verifica que se crearon las tablas**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('festivos', 'planes_festivos', 'entregas');
   ```
   Deberías ver las 3 tablas.

### Paso 3: Actualizar CellEditor.vue (PENDIENTE)

Este archivo necesita actualización manual. Aquí está el mapeo de campos:

**En `src/features/board/CellEditor.vue`**, busca y reemplaza:

```javascript
// CAMPOS EN FORMDATA (se mantienen en inglés para compatibilidad interna)
// Pero al guardar en Supabase, deben mapearse así:

const payload = {
  plataforma_id: props.clientId,        // era clientId
  fecha: props.date,                    // era date
  entrega: formData.delivers,           // era delivers
  fecha_recepcion: formData.receptionDate,
  hora_recepcion: formData.receptionTime,
  empresa_transporte: formData.transportCompany,
  fecha_fabricacion: formData.manufacturingDate,
  notas_fabricacion: formData.manufacturingNotes,
  fecha_carga: formData.loadingDate,
  comentarios_transporte: formData.transportComments
}

// Al leer datos existentes, los campos vienen en español:
if (props.data) {
  formData.delivers = props.data.entrega  // no props.data.delivers
  formData.receptionDate = props.data.fecha_recepcion
  // etc...
}
```

### Paso 4: Actualizar ReportsView.vue (PENDIENTE)

**En `src/features/reports/ReportsView.vue`**:

1. Cambiar referencias a campos:
   ```javascript
   // ANTES
   order.clientId → order.plataforma_id
   order.date → order.fecha
   order.delivers → order.entrega

   // Nombres de plataformas (si hace lookup):
   dataStore.mockClients → dataStore.plataformas
   client.name → plataforma.nombre
   ```

2. **Mejor opción**: Usar el join que ya viene del store:
   ```javascript
   // Las entregas ya tienen la información de plataforma incluida
   order.plataforma.nombre           // Nombre de la plataforma
   order.plataforma.cliente_nombre   // Nombre del cliente
   ```

### Paso 5: Limpiar Firebase (OPCIONAL pero Recomendado)

1. **Eliminar archivo Firebase**:
   ```bash
   rm src/lib/firebase.js
   ```

2. **Desinstalar dependencias Firebase** (opcional):
   ```bash
   npm uninstall firebase
   ```

3. **Buscar imports residuales**:
   ```bash
   grep -r "from.*firebase" src/
   grep -r "from.*firestore" src/
   ```

### Paso 6: Probar la Aplicación

1. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Verifica cada sección**:
   - ✅ **Pizarra (Board)**: Debe mostrar plataformas activas desde Supabase
   - ✅ **Config (Settings)**:
     - Calendario debe permitir selección multi-mes
     - Añadir/eliminar festivos debe funcionar
     - Añadir/eliminar planes debe funcionar
   - ⚠️ **Informes (Reports)**: Pendiente de actualizar
   - ⚠️ **Editor de Celdas**: Pendiente de actualizar

3. **Abre la consola del navegador** (F12):
   - No deberían haber errores de Firebase
   - Deberías ver logs de Supabase: "Inicializando data store..."
   - Verifica que las plataformas se cargan correctamente

---

## 🗂️ Estructura de Tablas Supabase

### `plataformas` (ya existe)
```
id               BIGINT      PK
nombre           TEXT        Nombre de la plataforma
cliente_nombre   TEXT        Nombre del cliente
activo           BOOLEAN     true = activa, false = inactiva
... +15 campos más
```

### `festivos`
```
id          BIGSERIAL   PK Auto-incremento
nombre      TEXT        Nombre del festivo (ej: "Navidad")
fecha       DATE        Fecha del festivo (ej: "2024-12-25")
created_at  TIMESTAMPTZ Timestamp de creación
```

### `planes_festivos`
```
id             BIGSERIAL   PK Auto-incremento
nombre         TEXT        Nombre del plan (ej: "Puente Navidad")
fecha_inicio   DATE        Fecha inicio del rango
fecha_fin      DATE        Fecha fin del rango
created_at     TIMESTAMPTZ Timestamp de creación
```

### `entregas`
```
id                      BIGSERIAL   PK Auto-incremento
plataforma_id           BIGINT      FK → plataformas(id)
fecha                   DATE        Fecha de la entrega
entrega                 BOOLEAN     true = entrega, false = NO ENTREGA
fecha_recepcion         DATE        Fecha de recepción
hora_recepcion          TIME        Hora de recepción
empresa_transporte      TEXT        Empresa de transporte
fecha_fabricacion       DATE        Fecha de fabricación
notas_fabricacion       TEXT        Notas de fabricación
fecha_carga             DATE        Fecha de carga
comentarios_transporte  TEXT        Comentarios de transporte
created_at              TIMESTAMPTZ Timestamp de creación
updated_at              TIMESTAMPTZ Timestamp de última actualización
```

---

## 🔄 Mapeo Completo de Campos

| Concepto | Firebase/Mock | Supabase | Tipo |
|----------|---------------|----------|------|
| **Plataformas/Clientes** |
| ID | id (string) | id (number) | BIGINT |
| Nombre | name | nombre | TEXT |
| - | mockClients | plataformas | - |
| **Festivos** |
| ID | id (string) | id (number) | BIGSERIAL |
| Nombre | name | nombre | TEXT |
| Fecha | date | fecha | DATE |
| **Planes Festivos** |
| ID | id (string) | id (number) | BIGSERIAL |
| Nombre | name | nombre | TEXT |
| Fecha Inicio | startDate | fecha_inicio | DATE |
| Fecha Fin | endDate | fecha_fin | DATE |
| **Entregas/Orders** |
| ID | id (string) | id (number) | BIGSERIAL |
| Cliente | clientId (string) | plataforma_id (number) | BIGINT FK |
| Fecha | date | fecha | DATE |
| Entrega | delivers | entrega | BOOLEAN |
| Fecha Recepción | receptionDate | fecha_recepcion | DATE |
| Hora Recepción | receptionTime | hora_recepcion | TIME |
| Empresa Transporte | transportCompany | empresa_transporte | TEXT |
| Fecha Fabricación | manufacturingDate | fecha_fabricacion | DATE |
| Notas Fabricación | manufacturingNotes | notas_fabricacion | TEXT |
| Fecha Carga | loadingDate | fecha_carga | DATE |
| Comentarios Transporte | transportComments | comentarios_transporte | TEXT |

---

## ⚠️ Consideraciones Importantes

### IDs: String → Number
- **Antes**: `clientId: 'cli1'` (string)
- **Ahora**: `plataforma_id: 123` (number)
- **Impacto**: Comparaciones deben ser con `===` directamente, no necesitan conversión

### Real-time Subscriptions
- Configuradas automáticamente
- Se actualizan cuando cambien datos en Supabase
- Para desactivarlas: comenta `setupRealtimeSubscriptions()` en `data.js`

### Permisos RLS (Row Level Security)
- **Por defecto**: Las tablas no tienen RLS activado
- **Si necesitas seguridad**: Descomenta las políticas en `supabase-schema.sql`
- **Para desarrollo**: Puedes dejarlo sin RLS

### Datos de Prueba
- El script SQL incluye datos de ejemplo comentados
- Descomenta las líneas `INSERT INTO` si quieres datos de prueba

---

## 🐛 Troubleshooting

### Error: "relation 'festivos' does not exist"
**Solución**: Ejecuta el script SQL en Supabase (Paso 2)

### Error: "Missing Supabase credentials"
**Solución**: Crea el archivo `.env.local` con tus credenciales (Paso 1)

### No se muestran plataformas
**Solución**:
1. Verifica que las plataformas tengan `activo = true` en Supabase
2. Revisa la consola del navegador para ver errores
3. Comprueba que las credenciales `.env.local` sean correctas

### El calendario sigue borrando la selección
**Solución**: Limpia la caché del navegador (Ctrl+Shift+R)

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12 → Console)
2. Verifica los logs de Supabase (Dashboard → Logs)
3. Comprueba que todas las tablas estén creadas correctamente
4. Asegúrate de que `.env.local` tenga las credenciales correctas

---

## ✨ Nuevas Funcionalidades

### Calendario Multi-Mes
- Ahora puedes seleccionar rangos como 22/12/25 → 03/01/26
- Navega entre meses sin perder la selección
- Usa el botón "Limpiar" para resetear

### Real-Time Updates
- Los cambios en Supabase se reflejan automáticamente
- No necesitas recargar la página

### Información Enriquecida
- Las plataformas ahora muestran `cliente_nombre` adicional
- Las entregas traen información de plataforma embebida

---

¡Éxito con la migración! 🎉
