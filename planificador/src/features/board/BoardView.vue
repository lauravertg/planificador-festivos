auth.js:14 
 POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=your-api-key 400 (Bad Request)
await in signInAnonymously		
initAuth	@	auth.js:14
(anonymous)	@	auth.js:19
(anonymous)	@	main.js:8
firebase_auth.js?v=4d48d907:698 Uncaught (in promise) FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.).
    at async initAuth (auth.js:14:7)
await in signInAnonymously		
initAuth	@	auth.js:14
(anonymous)	@	auth.js:19
(anonymous)	@	main.js:8
<template>
  <!-- Mensaje cuando no hay plan seleccionado -->
  <div v-if="!selectedPlanId" class="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-xl border border-gray-300">
    <div class="text-center space-y-4">
      <div class="text-6xl text-gray-300">📋</div>
      <h2 class="text-2xl font-bold text-gray-700">No hay plan seleccionado</h2>
      <p class="text-gray-500 max-w-md">
        Para comenzar a trabajar con entregas, selecciona un plan festivo existente o crea uno nuevo usando el desplegable en la parte superior izquierda.
      </p>
    </div>
  </div>

  <!-- Pizarra normal cuando hay plan -->
  <div v-else class="overflow-auto max-h-[calc(100vh-200px)] shadow-xl rounded-lg border border-gray-300 bg-white">
    <table class="min-w-full border-collapse">
      <thead>
        <tr>
          <th class="sticky left-0 top-0 z-30 bg-gray-100 border-b border-r border-gray-300 p-3 text-left min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            <span class="text-gray-500 text-xs uppercase tracking-wider font-bold">Cliente / Día</span>
          </th>
          <th
            v-for="date in dateColumns"
            :key="date"
            class="sticky top-0 z-20 min-w-[140px] border-b border-gray-200 p-2 text-center"
            :class="{
              'bg-red-50 border-red-200': isHoliday(date),
              'bg-gray-100': !isHoliday(date) && isWeekend(date),
              'bg-white': !isHoliday(date) && !isWeekend(date)
            }"
          >
            <div class="text-xs font-bold" :class="{ 'text-red-600': isHoliday(date), 'text-gray-400': !isHoliday(date) }">
              {{ getDayOfWeek(date) }}
            </div>
            <div class="text-sm flex flex-col items-center" :class="{ 'text-red-800 font-extrabold': isHoliday(date), 'text-gray-800 font-medium': !isHoliday(date) }">
              <span>{{ formatDate(date) }}</span>
              <span v-if="isHoliday(date)" class="text-[10px] text-red-500 font-normal truncate max-w-[100px]">
                {{ getHolidayName(date) }}
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="displayPlataformas.length === 0">
          <td colspan="100" class="p-8 text-center text-gray-500">
            <span v-if="dataStore.loading">Cargando plataformas...</span>
            <span v-else>No hay plataformas seleccionadas.</span>
          </td>
        </tr>
        <tr v-for="plataforma in displayPlataformas" :key="plataforma.id" class="hover:bg-gray-50 transition-colors">
          <!-- Columna Cliente -->
          <td class="sticky left-0 z-10 bg-white border-r border-b border-gray-300 p-3 font-medium text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            <div>{{ plataforma.nombre }}</div>
            <div v-if="plataforma.cliente_nombre" class="text-xs text-gray-500">
              {{ plataforma.cliente_nombre }}
              <div v-if="plataforma.tipo_carga" class="text-xs text-gray-400 mt-0.5">{{ plataforma.tipo_carga }}</div>
            </div>
          </td>

          <!-- Celdas de Días -->
          <td
            v-for="date in dateColumns"
            :key="`${plataforma.id}-${date}`"
            @click="handleCellClick(plataforma.id, date)"
            class="border-b border-r border-gray-200 h-28 relative cursor-pointer select-none group transition-all"
            :class="{
              'hover:bg-blue-50': !getOrder(plataforma.id, date) && !hasPendingChange(plataforma.id, date),
              'bg-white hover:ring-2 hover:ring-blue-300 hover:z-10': getOrder(plataforma.id, date) && !isHoliday(date) && !isWeekend(date) && !hasPendingChange(plataforma.id, date),
              'bg-red-50/30': isHoliday(date) && !hasPendingChange(plataforma.id, date),
              'bg-gray-50': !isHoliday(date) && isWeekend(date) && !hasPendingChange(plataforma.id, date),
              'bg-yellow-100 border-2 border-yellow-400 hover:bg-yellow-200': hasPendingChange(plataforma.id, date)
            }"
          >
            <div v-if="!getOrder(plataforma.id, date)" class="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-30">
              <Plus size="20" class="text-blue-500" />
            </div>
            <div v-else class="w-full h-full p-1 text-[10px] leading-tight relative">
              <div v-if="!getOrder(plataforma.id, date).delivers" class="w-full h-full flex items-center justify-center bg-gray-100">
                <span class="text-2xl font-bold text-gray-300">NO</span>
              </div>
              <template v-else>
                <!-- Siempre mostrar "SÍ" en el centro cuando hay entrega -->
                <div class="w-full h-full flex items-center justify-center">
                  <span class="text-2xl font-bold text-green-500">SÍ</span>
                </div>
                <!-- Detalles superpuestos sobre el "SÍ" -->
                <div class="absolute top-1 left-1 text-blue-700 font-bold max-w-[60%] truncate">
                  {{ formatDate(getOrder(plataforma.id, date).receptionDate) }} {{ formatTime(getOrder(plataforma.id, date).receptionTime) }}
                </div>
                <div class="absolute top-1 right-1 text-right max-w-[60%]">
                  <div class="text-black font-bold truncate">
                    {{ getOrder(plataforma.id, date).transportCompany || 'SIN TPTE' }}
                  </div>
                  <div v-if="getOrder(plataforma.id, date).transportComments" class="text-gray-400 italic text-[9px] truncate mt-0.5">
                    "{{ getOrder(plataforma.id, date).transportComments.substring(0, 20) }}..."
                  </div>
                </div>
                <div class="absolute bottom-1 left-1 text-green-700 font-bold max-w-[50%]">
                  <div class="flex flex-col">
                    <span class="text-[9px] text-green-500">FAB:</span>
                    <span class="text-sm">{{ getDayOfWeek(getOrder(plataforma.id, date).manufacturingDate) }} {{ formatDate(getOrder(plataforma.id, date).manufacturingDate) }}</span>
                    <span v-if="getOrder(plataforma.id, date).manufacturingNotes" class="text-[9px] font-normal text-green-600 truncate">{{ getOrder(plataforma.id, date).manufacturingNotes }}</span>
                  </div>
                </div>
                <div class="absolute bottom-1 right-1 text-right text-orange-600 font-bold max-w-[50%]">
                  <div class="flex flex-col items-end">
                    <span class="text-[9px] text-gray-400">Carga</span>
                    <span class="text-sm">{{ getDayOfWeek(getOrder(plataforma.id, date).loadingDate) }} {{ formatDate(getOrder(plataforma.id, date).loadingDate) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import { formatDate, getDayOfWeek, formatTime } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  dateRange: Object,
  orders: Array,
  plataformas: Array,
  onCellClick: Function,
  selectedPlanId: Number,
  pendingChanges: Map
})

const emit = defineEmits(['cellClick'])

const dataStore = useDataStore()

// Usar plataformas del prop si están disponibles, si no, usar del store
const displayPlataformas = computed(() => {
  return props.plataformas || dataStore.plataformas
})

const dateColumns = computed(() => {
  const dates = []
  const start = new Date(props.dateRange.start)
  const end = new Date(props.dateRange.end)

  if (start > end) return []

  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    dates.push(new Date(dt).toISOString().split('T')[0])
  }
  return dates
})

const ordersMap = computed(() => {
  const map = {}
  if (props.orders) {
    props.orders.forEach(o => {
      if (!map[o.plataforma_id]) map[o.plataforma_id] = {}
      // Mapear campos de español (Supabase) a inglés (UI)
      map[o.plataforma_id][o.fecha] = {
        ...o,
        delivers: o.entrega,
        receptionDate: o.fecha_recepcion,
        receptionTime: o.hora_recepcion,
        manufacturingDate: o.fecha_fabricacion,
        manufacturingNotes: o.notas_fabricacion,
        loadingDate: o.fecha_carga,
        transportCompany: o.empresa_transporte,
        transportComments: o.comentarios_transporte
      }
    })
  }
  return map
})

const isHoliday = (date) => {
  if (!dataStore.festivos) return false
  return dataStore.festivos.some(h => h.fecha === date)
}

const isWeekend = (date) => {
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // 0 = domingo, 6 = sábado
}

const getHolidayName = (date) => {
  if (!dataStore.festivos) return ''
  const holiday = dataStore.festivos.find(h => h.fecha === date)
  return holiday ? holiday.nombre : ''
}

const getOrder = (clientId, date) => {
  return ordersMap.value[clientId]?.[date]
}

const handleCellClick = (clientId, date) => {
  emit('cellClick', { clientId, date })
}

// Verificar si una celda tiene cambios pendientes
const hasPendingChange = (plataformaId, date) => {
  if (!props.pendingChanges) return false
  const key = `${plataformaId}-${date}`
  return props.pendingChanges.has(key)
}
</script>