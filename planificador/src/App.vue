<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Truck, Calendar, FileText, Settings, Save, Clipboard, X } from 'lucide-vue-next'
import { addDays, getTodayStr } from './utils/date'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import { supabase } from './lib/supabase'

import PlanSelector from './features/board/PlanSelector.vue'
import PlatformFilter from './features/board/PlatformFilter.vue'
import BoardView from './features/board/BoardView.vue'
import ReportsView from './features/reports/ReportsView.vue'
import ConfigPanel from './features/settings/ConfigPanel.vue'
import CellEditor from './features/board/CellEditor.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

const { loading } = authStore

// Inicializar el store al montar
onMounted(async () => {
  await dataStore.initialize()
})

// Estado de la vista
const view = ref('board')

// Plan festivo seleccionado
const selectedPlanId = ref(null)

// Rango de fechas (se actualiza automáticamente desde el plan seleccionado)
const dateRange = ref({
  start: addDays(getTodayStr(), -2),
  end: addDays(getTodayStr(), 12)
})

// Actualizar el rango de fechas cuando cambia el plan seleccionado
watch(selectedPlanId, (newPlanId) => {
  if (newPlanId) {
    const plan = dataStore.planesFestivos.find(p => p.id === newPlanId)
    if (plan) {
      dateRange.value = {
        start: plan.fecha_inicio,
        end: plan.fecha_fin
      }
    }
  }
})

// Filtrado y ordenamiento de plataformas
const selectedPlatformIds = ref([])
const platformSortBy = ref('nombre')

// Inicializar con todas las plataformas seleccionadas cuando se cargan
watch(() => dataStore.plataformas, (plataformas) => {
  if (plataformas && plataformas.length > 0 && selectedPlatformIds.value.length === 0) {
    selectedPlatformIds.value = plataformas.map(p => p.id)
  }
}, { immediate: true })

// Plataformas filtradas y ordenadas
const filteredAndSortedPlatforms = computed(() => {
  let platforms = dataStore.plataformas.filter(p => selectedPlatformIds.value.includes(p.id))

  switch (platformSortBy.value) {
    case 'nombre':
      return platforms.sort((a, b) => a.nombre.localeCompare(b.nombre))
    case 'nombre-desc':
      return platforms.sort((a, b) => b.nombre.localeCompare(a.nombre))
    case 'cliente':
      return platforms.sort((a, b) => {
        const aCliente = a.cliente_nombre || a.nombre
        const bCliente = b.cliente_nombre || b.nombre
        return aCliente.localeCompare(bCliente)
      })
    case 'cliente-desc':
      return platforms.sort((a, b) => {
        const aCliente = a.cliente_nombre || a.nombre
        const bCliente = b.cliente_nombre || b.nombre
        return bCliente.localeCompare(aCliente)
      })
    default:
      return platforms
  }
})

// Editor de celdas
const editorOpen = ref(false)
const editingCell = ref(null)

// Sistema de portapapeles (copiar/pegar)
const clipboard = ref(null)

// Sistema de cambios pendientes
const pendingChanges = ref(new Map()) // key: `${plataforma_id}-${fecha}`, value: { action: 'create'|'update'|'delete', data: {...} }
const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

// Combinar entregas de Supabase con cambios pendientes locales
const mergedOrders = computed(() => {
  // Empezar con las entregas originales de Supabase
  const ordersMap = new Map()

  if (dataStore.entregas) {
    // Filtrar solo entregas del plan seleccionado
    dataStore.entregas
      .filter(order => order.plan_id === selectedPlanId.value)
      .forEach(order => {
        const key = `${order.plataforma_id}-${order.fecha}`
        ordersMap.set(key, { ...order, _isOriginal: true })
      })
  }

  // Aplicar cambios pendientes
  pendingChanges.value.forEach((change, key) => {
    if (change.action === 'delete') {
      ordersMap.delete(key)
    } else {
      ordersMap.set(key, { ...change.data, _isPending: true })
    }
  })

  return Array.from(ordersMap.values())
})

// Filtrar entregas por rango de fechas
const filteredOrders = computed(() => {
  if (!mergedOrders.value) return []
  return mergedOrders.value.filter(o => o.fecha >= dateRange.value.start && o.fecha <= dateRange.value.end)
})

// Limpiar cambios pendientes cuando cambia el rango de fechas o el plan
watch([dateRange, selectedPlanId], () => {
  if (hasPendingChanges.value) {
    const confirmDiscard = confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?')
    if (confirmDiscard) {
      pendingChanges.value.clear()
    }
  }
}, { deep: true })

// Manejadores
const handleCellClick = ({ clientId, date }) => {
  // No permitir edición si no hay plan seleccionado
  if (!selectedPlanId.value) {
    alert('Por favor selecciona un plan festivo antes de agregar entregas.')
    return
  }

  const existing = filteredOrders.value.find(o => o.plataforma_id === clientId && o.fecha === date)
  const plataforma = dataStore.plataformas.find(p => p.id === clientId)

  editingCell.value = {
    clientId,
    dateStr: date,
    clientName: plataforma?.nombre || 'Plataforma',
    plataforma: plataforma,
    data: existing
  }
  editorOpen.value = true
}

// Copiar celda al portapapeles
const handleCopyCell = (formData) => {
  clipboard.value = { ...formData }
  editorOpen.value = false
  // Mostrar notificación visual
  const notification = document.createElement('div')
  notification.textContent = '✓ Celda copiada al portapapeles'
  notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out'
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 2000)
}

// Pegar desde portapapeles
const handlePasteCell = () => {
  if (!clipboard.value) {
    alert('No hay nada en el portapapeles')
    return
  }

  // Actualizar la celda con los datos pegados
  handleSaveCell({ ...clipboard.value })
}

const handleSaveCell = (formData) => {
  const { clientId, dateStr, data } = editingCell.value
  const isDelete = formData.delete
  const key = `${clientId}-${dateStr}`

  if (isDelete) {
    // Marcar para eliminar
    if (data && data.id && data._isOriginal) {
      // Es una entrega existente en la BD, marcar para borrar
      pendingChanges.value.set(key, {
        action: 'delete',
        id: data.id
      })
    } else {
      // Es un cambio pendiente, solo quitarlo de los cambios pendientes
      pendingChanges.value.delete(key)
    }
  } else {
    // Función helper para convertir strings vacíos en null
    const emptyToNull = (value) => value === '' ? null : value

    // Mapear campos de inglés a español
    const payload = {
      plan_id: selectedPlanId.value,
      plataforma_id: clientId,
      fecha: dateStr,
      entrega: formData.delivers,
      fecha_recepcion: emptyToNull(formData.receptionDate),
      hora_recepcion: emptyToNull(formData.receptionTime),
      empresa_transporte: emptyToNull(formData.transportCompany),
      fecha_fabricacion: emptyToNull(formData.manufacturingDate),
      notas_fabricacion: emptyToNull(formData.manufacturingNotes),
      fecha_carga: emptyToNull(formData.loadingDate),
      comentarios_transporte: emptyToNull(formData.transportComments)
    }

    if (data && data.id && data._isOriginal) {
      // Actualizar entrega existente
      pendingChanges.value.set(key, {
        action: 'update',
        id: data.id,
        data: payload
      })
    } else {
      // Crear nueva entrega
      pendingChanges.value.set(key, {
        action: 'create',
        data: payload
      })
    }
  }

  editorOpen.value = false
}

// Guardar todos los cambios pendientes a Supabase
const saveAllChanges = async () => {
  if (!hasPendingChanges.value) return

  const changes = Array.from(pendingChanges.value.values())
  const errors = []

  console.log('Guardando cambios:', changes)

  try {
    // Procesar eliminaciones
    const deletes = changes.filter(c => c.action === 'delete')
    for (const change of deletes) {
      console.log('Eliminando:', change)
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', change.id)

      if (error) {
        console.error('Error en delete:', error)
        errors.push({ type: 'delete', error })
      }
    }

    // Procesar actualizaciones
    const updates = changes.filter(c => c.action === 'update')
    for (const change of updates) {
      console.log('Actualizando:', change)
      const { error } = await supabase
        .from('entregas')
        .update(change.data)
        .eq('id', change.id)

      if (error) {
        console.error('Error en update:', error)
        errors.push({ type: 'update', error })
      }
    }

    // Procesar creaciones
    const creates = changes.filter(c => c.action === 'create')
    if (creates.length > 0) {
      console.log('Creando:', creates)
      const { error } = await supabase
        .from('entregas')
        .insert(creates.map(c => c.data))

      if (error) {
        console.error('Error en insert:', error)
        errors.push({ type: 'create', error })
      }
    }

    if (errors.length > 0) {
      console.error('Errores al guardar cambios:', errors)
      alert(`Se produjeron ${errors.length} errores al guardar. Revisa la consola.`)
    } else {
      // Limpiar cambios pendientes
      pendingChanges.value.clear()
      // Recargar entregas
      await dataStore.loadEntregas()
      alert('Cambios guardados correctamente')
    }
  } catch (error) {
    console.error('Error guardando cambios:', error)
    alert('Error al guardar cambios: ' + error.message)
  }
}

// Descartar cambios pendientes
const discardChanges = () => {
  if (confirm('¿Estás seguro de descartar todos los cambios sin guardar?')) {
    pendingChanges.value.clear()
  }
}

const closeEditor = () => {
  editorOpen.value = false
}

const closeConfig = () => {
  view.value = 'board'
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 font-sans text-gray-800">
    <!-- HEADER DE NAVEGACIÓN -->
    <nav class="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40 print:hidden">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="bg-blue-600 text-white p-2 rounded-lg shrink-0">
          <Truck size="20" />
        </div>

        <PlanSelector
          v-if="view === 'board'"
          v-model="selectedPlanId"
          :planes="dataStore.planesFestivos"
        />

        <PlatformFilter
          v-if="view === 'board'"
          :plataformas="dataStore.plataformas"
          v-model="selectedPlatformIds"
          v-model:sortBy="platformSortBy"
        />

        <!-- Indicador de portapapeles -->
        <div
          v-if="clipboard && view === 'board'"
          class="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-300 rounded-md text-sm"
        >
          <Clipboard size="16" class="text-purple-600" />
          <span class="text-purple-700 font-medium">Celda copiada</span>
          <button
            @click="clipboard = null"
            class="text-purple-400 hover:text-purple-600 ml-1"
            title="Limpiar portapapeles"
          >
            <X size="14" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="view = 'board'"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            view === 'board' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'
          ]"
        >
          <Calendar size="18" /> <span class="hidden sm:inline">Pizarra</span>
        </button>
        <button
          @click="view = 'reports'"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            view === 'reports' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'
          ]"
        >
          <FileText size="18" /> <span class="hidden sm:inline">Informes</span>
        </button>
        <button
          @click="view = 'settings'"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            view === 'settings' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'
          ]"
        >
          <Settings size="18" /> <span class="hidden sm:inline">Config</span>
        </button>
      </div>
    </nav>

    <!-- BARRA DE CAMBIOS PENDIENTES -->
    <div
      v-if="hasPendingChanges && view === 'board'"
      class="sticky top-[57px] z-30 bg-amber-50 border-b border-amber-200 px-4 py-3 shadow-sm"
    >
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-2">
          <div class="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {{ pendingChanges.size }}
          </div>
          <span class="text-amber-800 font-medium">
            Tienes {{ pendingChanges.size }} cambio{{ pendingChanges.size !== 1 ? 's' : '' }} sin guardar.
          </span>
        </div>
        <div class="flex gap-2">
          <button
            @click="discardChanges"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Descartar
          </button>
          <button
            @click="saveAllChanges"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            <Save size="16" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="p-2 md:p-4">
      <div v-if="loading" class="h-screen flex items-center justify-center text-blue-600 animate-pulse">
        Cargando Planificación...
      </div>

      <template v-else>
        <ConfigPanel v-if="view === 'settings'" @close="closeConfig" />

        <ReportsView v-else-if="view === 'reports'" :dateRange="dateRange" :orders="filteredOrders" />

        <BoardView
          v-else
          :dateRange="dateRange"
          :orders="filteredOrders"
          :plataformas="filteredAndSortedPlatforms"
          :selectedPlanId="selectedPlanId"
          :pendingChanges="pendingChanges"
          @cellClick="handleCellClick"
        />
      </template>
    </main>

    <CellEditor
      :isOpen="editorOpen"
      :data="editingCell?.data"
      :clientName="editingCell?.clientName"
      :dateStr="editingCell?.dateStr"
      :plataforma="editingCell?.plataforma"
      :hasClipboard="!!clipboard"
      @close="closeEditor"
      @save="handleSaveCell"
      @copy="handleCopyCell"
      @paste="handlePasteCell"
    />
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
