<template>
  <div class="bg-white rounded-xl shadow-2xl p-6 max-w-6xl mx-auto mt-4 ring-8 ring-white/50">
    <div class="flex justify-between items-center mb-6 border-b pb-4">
      <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Settings size="24" /> Configuración de Festivos y Puentes
      </h2>
      <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 p-1"><X /></button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- SECCIÓN 1: Festivos Individuales -->
      <div class="space-y-4">
        <h3 class="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-gray-700">
          <CornerDownRight size="18" /> Días Festivos Sueltos (Días Rojos Fijos)
        </h3>
        <p class="text-sm text-gray-500 bg-red-50 p-3 rounded border border-red-200">
          Introduce aquí los días que siempre deben aparecer en rojo (Navidad, Año Nuevo, etc.).
        </p>
        <div class="flex gap-2 items-end">
          <div class="flex-1">
            <label class="text-sm text-gray-600">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Inmaculada"
              class="w-full border p-2 rounded focus:ring-red-500 focus:border-red-500"
              v-model="newHolidayName"
            />
          </div>
          <div class="w-40">
            <label class="text-sm text-gray-600">Fecha</label>
            <input
              type="date"
              class="w-full border p-2 rounded focus:ring-red-500 focus:border-red-500"
              v-model="newHolidayDate"
            />
          </div>
          <button @click="handleAddHoliday" class="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 h-10 mb-0.5 hover:bg-green-700 transition-colors">
            <Plus size="18" /> Añadir
          </button>
        </div>
        <div class="space-y-2 max-h-80 overflow-y-auto p-2 border rounded-lg bg-gray-50">
          <p v-if="sortedHolidays.length === 0" class="text-center text-gray-500 italic">No hay festivos individuales configurados.</p>
          <div
            v-for="h in sortedHolidays"
            :key="h.id"
            class="flex justify-between items-center p-3 bg-white border rounded shadow-sm"
          >
            <div class="flex items-center gap-4">
              <div class="bg-red-100 text-red-800 font-bold px-3 py-1 rounded text-sm border border-red-200">
                {{ formatDate(h.fecha) }}
              </div>
              <span class="font-bold">{{ h.nombre }}</span>
            </div>
            <button @click="handleDeleteHoliday(h.id)" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
              <Trash2 size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: Planes de Festivos (Puentes) -->
      <div class="space-y-4">
        <h3 class="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-gray-700">
          <CornerDownRight size="18" /> Puentes y Rangos de Planificación
        </h3>

        <!-- CALENDARIO SELECTOR -->
        <div class="bg-white p-4 rounded-lg shadow-inner border">
          <!-- Navegación del mes -->
          <div class="flex justify-between items-center mb-4">
            <button @click="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronLeft size="20" />
            </button>
            <h4 class="text-lg font-bold text-blue-700">
              {{ calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
            </h4>
            <button @click="changeMonth(1)" class="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronRight size="20" />
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="day in ['L', 'M', 'X', 'J', 'V', 'S', 'D']" :key="day" class="text-center font-bold text-gray-500 p-2 border-b border-gray-200">
              {{ day }}
            </div>
            <div
              v-for="day in calendarDays"
              :key="day.dateStr"
              :class="dayClasses(day)"
              @click="handleDateClick(day.dateStr)"
            >
              {{ day.day }}
              <AlertCircle v-if="day.isFixedHoliday" size="10" class="absolute top-1 right-1 text-red-500" />
            </div>
          </div>

          <div class="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="text-sm font-bold text-blue-700 mb-1">Rango Seleccionado:</p>
                <p class="text-sm">
                  {{ selectedRange.start ? formatDate(selectedRange.start) : '??/??' }}
                  <ArrowRight size="14" class="inline mx-2 text-blue-500" />
                  {{ selectedRange.end ? formatDate(selectedRange.end) : '??/??' }}
                </p>
              </div>
              <button
                v-if="selectedRange.start || selectedRange.end"
                @click="clearSelection"
                class="text-xs text-red-600 hover:text-red-800 underline ml-2"
                title="Limpiar selección"
              >
                Limpiar
              </button>
            </div>
          </div>

          <!-- GUARDAR PLAN -->
          <div class="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Nombre del Plan (Ej: Puente Diciembre)"
              class="flex-1 border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
              v-model="newPlanName"
              :disabled="!selectedRange.start || !selectedRange.end"
            />
            <button
              @click="handleAddPlan"
              class="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
              :disabled="!selectedRange.start || !selectedRange.end || !newPlanName.trim()"
            >
              <Plus size="18" /> Añadir Plan
            </button>
          </div>
        </div>

        <!-- LISTA DE PLANES GUARDADOS -->
        <div class="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
          <p v-if="dataStore.planesFestivos.length === 0" class="text-center text-gray-500 italic">No hay planes de festivos guardados.</p>
          <div
            v-for="p in sortedPlans"
            :key="p.id"
            class="flex justify-between items-center p-3 bg-white border rounded shadow-sm"
          >
            <div class="flex items-center gap-4">
              <div class="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded text-sm border border-blue-200">
                {{ formatDate(p.fecha_inicio) }} - {{ formatDate(p.fecha_fin) }}
              </div>
              <span class="font-bold">{{ p.nombre }}</span>
            </div>
            <button @click="handleDeletePlan(p.id)" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
              <Trash2 size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Settings, X, Plus, ChevronLeft, ChevronRight, Trash2, ArrowRight, AlertCircle, CornerDownRight } from 'lucide-vue-next'
import { formatDate } from '@/utils/date'
import { supabase } from '@/lib/supabase'
import { useDataStore } from '@/stores/data'

const emit = defineEmits(['close'])

const dataStore = useDataStore()

// Estados para festivos
const newHolidayName = ref('')
const newHolidayDate = ref('')

// Estados para calendario
const calendarDate = ref(new Date())
const selectedRange = ref({ start: null, end: null })
const newPlanName = ref('')

const sortedHolidays = computed(() => {
  if (!dataStore.festivos) return []
  return [...dataStore.festivos].sort((a, b) => a.fecha.localeCompare(b.fecha))
})
const sortedPlans = computed(() => {
  if (!dataStore.planesFestivos) return []
  return [...dataStore.planesFestivos].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
})

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate()
}

const calendarDays = computed(() => {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth()
  const numDays = getDaysInMonth(year, month)
  let firstDayOfMonth = new Date(year, month, 1).getDay()

  const startPlaceholder = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1
  const days = []

  for (let i = 0; i < startPlaceholder; i++) {
    days.push({ dateStr: null, day: null })
  }

  for (let i = 1; i <= numDays; i++) {
    const dayDate = new Date(year, month, i)
    const dateStr = dayDate.toISOString().split('T')[0]

    const isToday = dateStr === new Date().toISOString().split('T')[0]
    const isStart = selectedRange.value.start === dateStr
    const isEnd = selectedRange.value.end === dateStr

    const rangeStart = selectedRange.value.start < selectedRange.value.end ? selectedRange.value.start : selectedRange.value.end
    const rangeEnd = selectedRange.value.start < selectedRange.value.end ? selectedRange.value.end : selectedRange.value.start
    const isBetween = rangeStart && rangeEnd && dateStr > rangeStart && dateStr < rangeEnd

    const isFixedHoliday = dataStore.festivos ? dataStore.festivos.some(h => h.fecha === dateStr) : false
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6

    days.push({
      dateStr,
      day: i,
      isToday,
      isStart,
      isEnd,
      isBetween,
      isFixedHoliday,
      isWeekend
    })
  }

  return days
})

const dayClasses = (day) => {
  if (!day.dateStr) return "p-2"

  let classes = "p-2 text-center rounded-lg cursor-pointer transition-colors text-sm font-medium relative"

  if (day.isStart || day.isEnd) {
    classes += " bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 transform scale-105"
  } else if (day.isBetween) {
    classes += " bg-blue-200 text-blue-800 hover:bg-blue-300"
  } else if (day.isFixedHoliday) {
    classes += " bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
  } else if (day.isWeekend) {
    classes += " bg-gray-50 text-gray-500 hover:bg-gray-100"
  } else {
    classes += " text-gray-800 hover:bg-gray-100"
  }

  if (day.isToday && !day.isStart && !day.isEnd) {
    classes += " border-2 border-green-500"
  }

  return classes
}

const handleDateClick = (dateStr) => {
  if (!selectedRange.value.start || selectedRange.value.end) {
    selectedRange.value = { start: dateStr, end: null }
  } else if (dateStr < selectedRange.value.start) {
    selectedRange.value = { start: dateStr, end: selectedRange.value.start }
  } else if (dateStr === selectedRange.value.start) {
    selectedRange.value = { start: null, end: null }
  } else {
    selectedRange.value = { ...selectedRange.value, end: dateStr }
  }
}

const changeMonth = (delta) => {
  calendarDate.value = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() + delta, 1)
  // ✅ Permitir selección multi-mes - no borrar la selección al cambiar de mes
}

const clearSelection = () => {
  selectedRange.value = { start: null, end: null }
}

const handleAddHoliday = async () => {
  if (!newHolidayName.value.trim() || !newHolidayDate.value) return

  const { error } = await supabase
    .from('festivos')
    .insert({
      nombre: newHolidayName.value,
      fecha: newHolidayDate.value
    })

  if (error) {
    console.error('Error añadiendo festivo:', error)
    alert('Error al guardar el festivo: ' + error.message)
  } else {
    newHolidayName.value = ''
    newHolidayDate.value = ''
    await dataStore.loadFestivos()
  }
}

const handleDeleteHoliday = async (id) => {
  if (confirm('¿Borrar este festivo de la lista?')) {
    const { error } = await supabase
      .from('festivos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando festivo:', error)
      alert('Error al eliminar el festivo: ' + error.message)
    } else {
      await dataStore.loadFestivos()
    }
  }
}

const handleAddPlan = async () => {
  if (!selectedRange.value.start || !selectedRange.value.end || !newPlanName.value.trim()) return

  const { error } = await supabase
    .from('planes_festivos')
    .insert({
      nombre: newPlanName.value.trim(),
      fecha_inicio: selectedRange.value.start,
      fecha_fin: selectedRange.value.end
    })

  if (error) {
    console.error('Error añadiendo plan:', error)
    alert('Error al guardar el plan: ' + error.message)
  } else {
    newPlanName.value = ''
    selectedRange.value = { start: null, end: null }
    await dataStore.loadPlanesFestivos()
  }
}

const handleDeletePlan = async (id) => {
  if (confirm('¿Borrar este plan de festivo?')) {
    const { error } = await supabase
      .from('planes_festivos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando plan:', error)
      alert('Error al eliminar el plan: ' + error.message)
    } else {
      await dataStore.loadPlanesFestivos()
    }
  }
}
</script>