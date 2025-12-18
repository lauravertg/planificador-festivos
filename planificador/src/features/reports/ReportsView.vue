<template>
  <div class="p-6 max-w-6xl mx-auto bg-white min-h-screen print:p-0">
    <div class="flex justify-between items-center mb-8 print:hidden">
      <h2 class="text-2xl font-bold text-gray-800">Informe de Cargas</h2>
      <div class="flex gap-4">
        <select
          class="border p-2 rounded"
          v-model="selectedTransport"
        >
          <option value="all">Todas las compañías</option>
          <option value="Innova">Innova</option>
          <option value="Primafrío">Primafrío</option>
          <option value="Disfrimur">Disfrimur</option>
          <option value="Otros">Otros</option>
        </select>
        <button @click="printReport" class="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-black">
          <Printer size="18" /> Imprimir / PDF
        </button>
      </div>
    </div>

    <div class="mb-8 border-b pb-4">
      <h1 class="text-3xl font-bold uppercase tracking-wide text-gray-900">Planificación de Cargas</h1>
      <div class="mt-2 flex gap-8 text-gray-600">
        <p><span class="font-bold">Rango:</span> {{ formatDate(dateRange.start) }} - {{ formatDate(dateRange.end) }}</p>
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
              <th class="px-4 py-3 border-b">Entrega Prevista</th>
              <th class="px-4 py-3 border-b w-1/3">Comentarios Transporte</th>
              <th class="px-4 py-3 border-b w-1/4">Notas Internas (Fab)</th>
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
              <td class="px-4 py-3">{{ getDayOfWeek(item.receptionDate) }} {{ formatDate(item.receptionDate) }} {{ item.receptionTime }}</td>
              <td class="px-4 py-3 italic">{{ item.transportComments || '-' }}</td>
              <td class="px-4 py-3 text-xs text-gray-500">{{ item.manufacturingNotes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Printer, AlertCircle } from 'lucide-vue-next'
import { formatDate, getDayOfWeek } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  dateRange: Object,
  orders: Array
})

const dataStore = useDataStore()
const { holidays } = dataStore

const selectedTransport = ref('all')

const reportData = computed(() => {
  if (!props.orders.length) return []

  let filtered = props.orders.filter(o => o.delivers && o.transportCompany)

  if (selectedTransport.value !== 'all') {
    filtered = filtered.filter(o => o.transportCompany === selectedTransport.value)
  }

  const grouped = {}
  filtered.forEach(order => {
    const loadDate = order.loadingDate || 'Sin fecha de carga'
    if (!grouped[loadDate]) grouped[loadDate] = []
    grouped[loadDate].push({
      ...order,
      clientName: 'Cliente (API Pendiente)'
    })
  })

  return Object.keys(grouped).sort().map(date => ({
    date,
    items: grouped[date]
  }))
})

const isHolidayLoad = (date) => {
  return holidays.value.some(h => h.date === date)
}

const printReport = () => {
  window.print()
}
</script>