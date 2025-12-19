<script setup>
import { ref, computed, onMounted } from 'vue'
import { Truck, Calendar, FileText, Settings } from 'lucide-vue-next'
import { addDays, getTodayStr } from './utils/date'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import { supabase } from './lib/supabase'

import DateRangeSelector from './features/board/DateRangeSelector.vue'
import BoardView from './features/board/BoardView.vue'
import ReportsView from './features/reports/ReportsView.vue'
import ConfigPanel from './features/settings/ConfigPanel.vue'
import CellEditor from './features/board/CellEditor.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

const { user, loading } = authStore

// Inicializar el store al montar
onMounted(async () => {
  await dataStore.initialize()
})

// Estado de la vista
const view = ref('board')

// Rango de fechas
const dateRange = ref({
  start: addDays(getTodayStr(), -2),
  end: addDays(getTodayStr(), 12)
})

// Editor de celdas
const editorOpen = ref(false)
const editingCell = ref(null)

// Filtrar entregas por rango de fechas
const filteredOrders = computed(() => {
  if (!dataStore.entregas) return []
  return dataStore.entregas.filter(o => o.fecha >= dateRange.value.start && o.fecha <= dateRange.value.end)
})

// Manejadores
const handleCellClick = ({ clientId, date }) => {
  const existing = filteredOrders.value.find(o => o.plataforma_id === clientId && o.fecha === date)
  const plataforma = dataStore.plataformas.find(p => p.id === clientId)

  editingCell.value = {
    clientId,
    dateStr: date,
    clientName: plataforma?.nombre || 'Plataforma',
    data: existing
  }
  editorOpen.value = true
}

const handleSaveCell = async (formData) => {
  const { clientId, dateStr, data } = editingCell.value
  const isDelete = formData.delete

  try {
    if (isDelete && data && data.id) {
      // Eliminar entrega
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', data.id)

      if (error) throw error
      await dataStore.loadEntregas()
      editorOpen.value = false
      return
    }

    // Mapear campos de inglés a español
    const payload = {
      plataforma_id: clientId,
      fecha: dateStr,
      entrega: formData.delivers,
      fecha_recepcion: formData.receptionDate,
      hora_recepcion: formData.receptionTime,
      empresa_transporte: formData.transportCompany,
      fecha_fabricacion: formData.manufacturingDate,
      notas_fabricacion: formData.manufacturingNotes,
      fecha_carga: formData.loadingDate,
      comentarios_transporte: formData.transportComments
    }

    if (data && data.id) {
      // Actualizar entrega existente
      const { error } = await supabase
        .from('entregas')
        .update(payload)
        .eq('id', data.id)

      if (error) throw error
    } else {
      // Crear nueva entrega (solo si es una entrega, no NO ENTREGA)
      if (payload.entrega) {
        const { error } = await supabase
          .from('entregas')
          .insert(payload)

        if (error) throw error
      }
    }

    await dataStore.loadEntregas()
    editorOpen.value = false
  } catch (error) {
    console.error('Error guardando entrega:', error)
    alert('Error al guardar: ' + error.message)
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

        <DateRangeSelector v-model="dateRange" />
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

    <!-- CONTENIDO PRINCIPAL -->
    <main class="p-2 md:p-4">
      <div v-if="loading" class="h-screen flex items-center justify-center text-blue-600 animate-pulse">
        Cargando Planificación...
      </div>

      <ConfigPanel v-if="view === 'settings'" key="settings" @close="closeConfig" />

      <ReportsView v-if="view === 'reports'" key="reports" :dateRange="dateRange" :orders="filteredOrders" />

      <BoardView v-if="view === 'board'" key="board" :dateRange="dateRange" :orders="filteredOrders" @cellClick="handleCellClick" />
    </main>

    <CellEditor
      :isOpen="editorOpen"
      :data="editingCell?.data"
      :clientName="editingCell?.clientName"
      :dateStr="editingCell?.dateStr"
      @close="closeEditor"
      @save="handleSaveCell"
    />
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
