<template>
  <div class="p-6 max-w-6xl mx-auto bg-white min-h-screen print:p-0">
    <div class="flex justify-between items-center mb-8 print:hidden">
      <h2 class="text-2xl font-bold text-gray-800">Informe de Cargas</h2>
      <div class="flex gap-4">
        <div class="flex gap-2 items-center">
          <label class="text-sm font-medium text-gray-700">Desde:</label>
          <input
            type="date"
            class="border p-2 rounded"
            v-model="loadDateStart"
          />
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-sm font-medium text-gray-700">Hasta:</label>
          <input
            type="date"
            class="border p-2 rounded"
            v-model="loadDateEnd"
          />
        </div>
        <select
          class="border p-2 rounded"
          v-model="selectedTransport"
        >
          <option value="all">Todas las compañías</option>
          <option v-for="company in transportCompanies" :key="company" :value="company">
            {{ company }}
          </option>
        </select>
        <button @click="printReport" class="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-black">
          <Printer size="18" /> Imprimir / PDF
        </button>
      </div>
    </div>

    <div class="mb-8 border-b pb-4">
      <h1 class="text-3xl font-bold uppercase tracking-wide text-gray-900">Planificación de Cargas</h1>
      <div class="mt-2 flex gap-8 text-gray-600">
        <p><span class="font-bold">Fechas de Carga:</span> {{ loadDateStart ? formatDate(loadDateStart) : 'Sin límite' }} - {{ loadDateEnd ? formatDate(loadDateEnd) : 'Sin límite' }}</p>
        <p><span class="font-bold">Compañía:</span> {{ selectedTransport === 'all' ? 'TODAS' : selectedTransport }}</p>
        <p><span class="font-bold">Fecha Emisión:</span> {{ new Date().toLocaleDateString() }}</p>
      </div>
    </div>

    <div v-if="reportData.length === 0" class="text-center py-10 text-gray-500">
      No hay datos de carga registrados para este rango.
    </div>
    <div v-else class="space-y-8">
      <div
        v-for="group in reportData"
        :key="group.date"
        class="break-inside-avoid"
      >
        <h3 :class="[
          'text-xl font-bold p-2 border-l-4 mb-3 flex items-center gap-2',
          isHolidayLoad(group.date) ? 'bg-red-50 border-red-500 text-red-800' : 'bg-gray-100 border-orange-500 text-gray-800'
        ]">
          <AlertCircle v-if="isHolidayLoad(group.date)" size="20" />
          Fecha de Carga: {{ group.date === 'Sin fecha de carga' ? 'FECHA NO ASIGNADA' : `${getDayOfWeek(group.date)} ${formatDate(group.date)}` }}
          <span v-if="isHolidayLoad(group.date)" class="text-sm font-normal ml-2">(Festivo)</span>
        </h3>
        <table class="w-full text-sm text-left text-gray-600 border border-gray-200">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th class="px-4 py-3 border-b">Cliente / Plataforma</th>
              <th class="px-4 py-3 border-b">Transporte</th>
              <th class="px-4 py-3 border-b">Fecha de Entrega</th>
              <th class="px-4 py-3 border-b w-1/3">Comentarios Transporte</th>
              <th v-if="selectedTransport === 'all'" class="px-4 py-3 border-b w-1/4">Notas Internas (Fab)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in group.items"
              :key="item.id"
              class="bg-white border-b hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ item.clientName }}</td>
              <td class="px-4 py-3 font-bold">{{ item.transportCompany }}</td>
              <td class="px-4 py-3">{{ getDayOfWeek(item.deliveryDate) }} {{ formatDate(item.deliveryDate) }}</td>
              <td class="px-4 py-3 italic">{{ item.transportComments || '-' }}</td>
              <td v-if="selectedTransport === 'all'" class="px-4 py-3 text-xs text-gray-500">{{ item.manufacturingNotes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Printer, AlertCircle } from 'lucide-vue-next'
import { formatDate, getDayOfWeek } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  dateRange: Object,
  orders: Array
})

const dataStore = useDataStore()
const { festivos } = dataStore

const selectedTransport = ref('all')

// Rango de fechas de carga
const loadDateStart = ref('')
const loadDateEnd = ref('')

// Inicializar con el rango completo del plan
watch(() => props.dateRange, (newRange) => {
  if (newRange && !loadDateStart.value && !loadDateEnd.value) {
    loadDateStart.value = newRange.start
    loadDateEnd.value = newRange.end
  }
}, { immediate: true })

// Obtener lista única de empresas de transporte de las órdenes
const transportCompanies = computed(() => {
  if (!props.orders.length) return []

  const companies = props.orders
    .filter(o => o.entrega && o.empresa_transporte)
    .map(o => o.empresa_transporte)

  // Eliminar duplicados y ordenar
  return [...new Set(companies)].sort()
})

const reportData = computed(() => {
  if (!props.orders.length) return []

  // Filtrar: solo entregas con empresa de transporte
  let filtered = props.orders.filter(o => o.entrega && o.empresa_transporte)

  if (selectedTransport.value !== 'all') {
    filtered = filtered.filter(o => o.empresa_transporte === selectedTransport.value)
  }

  // Filtrar por rango de fechas de carga
  if (loadDateStart.value || loadDateEnd.value) {
    filtered = filtered.filter(o => {
      const loadDate = o.fecha_carga
      if (!loadDate) return false // Excluir las que no tienen fecha de carga

      if (loadDateStart.value && loadDate < loadDateStart.value) return false
      if (loadDateEnd.value && loadDate > loadDateEnd.value) return false

      return true
    })
  }

  const grouped = {}
  filtered.forEach(order => {
    const loadDate = order.fecha_carga || 'Sin fecha de carga'
    if (!grouped[loadDate]) grouped[loadDate] = []

    // Mapear campos de Supabase (español) a formato de reporte (inglés para compatibilidad con template)
    grouped[loadDate].push({
      id: order.id,
      clientName: order.plataforma?.nombre || 'Plataforma',
      transportCompany: order.empresa_transporte,
      deliveryDate: order.fecha,
      transportComments: order.comentarios_transporte,
      manufacturingNotes: order.notas_fabricacion
    })
  })

  return Object.keys(grouped).sort().map(date => ({
    date,
    items: grouped[date]
  }))
})

const isHolidayLoad = (date) => {
  if (!festivos.value) return false
  return festivos.value.some(h => h.fecha === date)
}

const printReport = () => {
  window.print()
}
</script>