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
  <div class="overflow-x-auto shadow-xl rounded-lg border border-gray-300 bg-white">
    <table class="min-w-full border-collapse">
      <thead>
        <tr>
          <th class="sticky left-0 z-20 bg-gray-100 border-b border-r border-gray-300 p-3 text-left min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            <span class="text-gray-500 text-xs uppercase tracking-wider font-bold">Cliente / Día</span>
          </th>
          <th
            v-for="date in dateColumns"
            :key="date"
            class="min-w-[140px] border-b border-gray-200 p-2 text-center"
            :class="{ 'bg-red-50 border-red-200': isHoliday(date) }"
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
        <tr v-if="dataStore.mockClients.length === 0">
          <td colspan="100" class="p-8 text-center text-gray-500">No hay clientes (Usando mock).</td>
        </tr>
        <tr v-for="client in dataStore.mockClients" :key="client.id" class="hover:bg-gray-50 transition-colors">
          <!-- Columna Cliente -->
          <td class="sticky left-0 z-10 bg-white border-r border-b border-gray-300 p-3 font-medium text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            {{ client.name }}
          </td>

          <!-- Celdas de Días -->
          <td
            v-for="date in dateColumns"
            :key="`${client.id}-${date}`"
            @click="handleCellClick(client.id, date)"
            class="border-b border-r border-gray-200 h-28 relative cursor-pointer select-none group transition-all"
            :class="{
              'hover:bg-blue-50': !getOrder(client.id, date),
              'bg-white hover:ring-2 hover:ring-blue-300 hover:z-10': getOrder(client.id, date),
              'bg-red-50/30': isHoliday(date)
            }"
          >
            <div v-if="!getOrder(client.id, date)" class="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-30">
              <Plus size="20" class="text-blue-500" />
            </div>
            <div v-else class="w-full h-full p-1 text-[10px] leading-tight relative">
              <div v-if="!getOrder(client.id, date).delivers" class="w-full h-full flex items-center justify-center bg-gray-100">
                <span class="text-2xl font-bold text-gray-300">NO</span>
              </div>
              <template v-else>
                <div class="absolute top-1 left-1 text-blue-700 font-bold max-w-[60%] truncate">
                  {{ formatDate(getOrder(client.id, date).receptionDate) }} {{ getOrder(client.id, date).receptionTime }}
                </div>
                <div class="absolute top-1 right-1 text-right text-black font-bold max-w-[60%] truncate">
                  {{ getOrder(client.id, date).transportCompany || 'SIN ASIGNAR' }}
                </div>
                <div v-if="getOrder(client.id, date).transportComments" class="absolute inset-x-1 top-6 bottom-6 flex items-center justify-center text-center text-gray-400 italic text-[9px] overflow-hidden">
                  "{{ getOrder(client.id, date).transportComments.substring(0, 20) }}..."
                </div>
                <div class="absolute bottom-1 left-1 text-green-700 font-bold max-w-[50%]">
                  <div class="flex flex-col">
                    <span>Fab: {{ formatDate(getOrder(client.id, date).manufacturingDate) }}</span>
                    <span class="text-[9px] font-normal text-green-600 truncate">{{ getOrder(client.id, date).manufacturingNotes }}</span>
                  </div>
                </div>
                <div class="absolute bottom-1 right-1 text-right text-orange-600 font-bold max-w-[50%]">
                  <div class="flex flex-col items-end">
                    <span class="text-[9px] text-gray-400">Carga</span>
                    <span class="text-sm">{{ getDayOfWeek(getOrder(client.id, date).loadingDate) }} {{ formatDate(getOrder(client.id, date).loadingDate) }}</span>
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
import { formatDate, getDayOfWeek } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  dateRange: Object,
  orders: Array,
  onCellClick: Function
})

const emit = defineEmits(['cellClick'])

const dataStore = useDataStore()
// const { holidays, mockClients } = dataStore

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
      if (!map[o.clientId]) map[o.clientId] = {}
      map[o.clientId][o.date] = o
    })
  }
  return map
})

const isHoliday = (date) => {
  if (!dataStore.holidays) return false
  return dataStore.holidays.some(h => h.date === date)
}

const getHolidayName = (date) => {
  if (!dataStore.holidays) return ''
  const holiday = dataStore.holidays.find(h => h.date === date)
  return holiday ? holiday.name : ''
}

const getOrder = (clientId, date) => {
  return ordersMap.value[clientId]?.[date]
}

const handleCellClick = (clientId, date) => {
  emit('cellClick', { clientId, date })
}
</script>