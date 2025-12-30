<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div class="bg-blue-700 text-white p-4 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold">{{ clientName || 'Cliente (API Pendiente)' }}</h3>
            <p class="text-sm opacity-90">Planificación para {{ getDayOfWeek(dateStr) }} {{ formatDate(dateStr) }}</p>
          </div>
          <button @click="$emit('close')"><X /></button>
        </div>

        <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between bg-gray-100 p-3 rounded">
            <span class="font-medium text-gray-700">¿Hay entrega este día?</span>
            <button
              @click="formData.delivers = !formData.delivers"
              :class="[
                'px-4 py-1 rounded-full font-bold transition-colors',
                formData.delivers ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              ]"
            >
              {{ formData.delivers ? 'SÍ ENTREGA' : 'NO ENTREGA' }}
            </button>
          </div>

          <template v-if="formData.delivers">
            <!-- Recepción -->
            <div class="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
              <h4 class="text-blue-700 font-bold text-sm mb-2 flex items-center gap-2">
                <Calendar size="14" /> Fecha/Hora Recepción
              </h4>
              <div class="grid grid-cols-2 gap-2">
                <div class="col-span-2 sm:col-span-1">
                  <input
                    type="date"
                    class="border p-2 rounded text-sm w-full planning-date"
                    :class="{
                      'border-red-500 bg-red-50': isReceptionDateInvalid,
                      'in-range': isReceptionDateInRange && !isReceptionDateInvalid,
                      'out-of-range': formData.receptionDate && !isReceptionDateInRange && !isReceptionDateInvalid
                    }"
                    v-model="formData.receptionDate"
                    :title="`Rango sugerido: ${suggestedDateRange.min} a ${suggestedDateRange.max}`"
                  />
                  <p v-if="isReceptionDateInvalid" class="text-red-600 text-xs mt-1 font-medium">
                    ⚠️ No puede ser posterior a la entrega
                  </p>
                  <p v-if="!isReceptionDateInvalid" class="text-green-600 text-xs mt-1">
                    💡 Rango sugerido: <strong>{{ formatDate(suggestedDateRange.min) }}</strong> a <strong>{{ formatDate(suggestedDateRange.max) }}</strong>
                  </p>
                </div>
                <input
                  type="time"
                  class="border p-2 rounded text-sm w-full"
                  v-model="formData.receptionTime"
                />
              </div>
            </div>

            <!-- Transporte -->
            <div class="border-l-4 border-gray-800 pl-4 py-2 bg-gray-50 rounded-r">
              <h4 class="text-gray-800 font-bold text-sm mb-2 flex items-center gap-2">
                <Truck size="14" /> Transporte
              </h4>
              <div class="space-y-2">
                <select
                  class="border p-2 rounded text-sm w-full bg-white"
                  v-model="formData.transportCompany"
                >
                  <option value="">-- Seleccionar Compañía --</option>
                  <option
                    v-for="company in availableTransportCompanies"
                    :key="company"
                    :value="company"
                  >
                    {{ company }}
                  </option>
                </select>
                <textarea
                  placeholder="Comentarios para el transportista..."
                  class="border p-2 rounded text-sm w-full h-16 resize-none"
                  v-model="formData.transportComments"
                />
              </div>
            </div>

            <!-- Fabricación -->
            <div class="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
              <h4 class="text-green-700 font-bold text-sm mb-2 flex items-center gap-2">
                <Factory size="14" /> Fabricación
              </h4>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="col-span-2 sm:col-span-1">
                  <label class="text-xs text-gray-500 block">Día Fabricación</label>
                  <input
                    type="date"
                    class="border p-2 rounded text-sm w-full planning-date"
                    :class="{
                      'border-red-500 bg-red-50': isManufacturingDateInvalid,
                      'in-range': isManufacturingDateInRange && !isManufacturingDateInvalid,
                      'out-of-range': formData.manufacturingDate && !isManufacturingDateInRange && !isManufacturingDateInvalid
                    }"
                    v-model="formData.manufacturingDate"
                    :title="`Rango sugerido: ${suggestedDateRange.min} a ${suggestedDateRange.max}`"
                  />
                  <p v-if="isManufacturingDateInvalid" class="text-red-600 text-xs mt-1 font-medium">
                    ⚠️ No puede ser posterior a la entrega
                  </p>
                  <p v-if="!isManufacturingDateInvalid" class="text-green-600 text-xs mt-1">
                    💡 Rango sugerido: <strong>{{ formatDate(suggestedDateRange.min) }}</strong> a <strong>{{ formatDate(suggestedDateRange.max) }}</strong>
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Notas (ej: Piking, A previsión)"
                class="border p-2 rounded text-sm w-full"
                v-model="formData.manufacturingNotes"
              />
            </div>

            <!-- Carga -->
            <div class="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded-r">
              <h4 class="text-orange-700 font-bold text-sm mb-2 flex items-center gap-2">
                <Clock size="14" /> Fecha de Carga
              </h4>
              <input
                type="date"
                class="border p-2 rounded text-sm w-full planning-date"
                :class="{
                  'border-red-500 bg-red-50': isLoadingDateInvalid || isLoadingDateAfterDelivery,
                  'in-range': isLoadingDateInRange && !isLoadingDateInvalid && !isLoadingDateAfterDelivery,
                  'out-of-range': formData.loadingDate && !isLoadingDateInRange && !isLoadingDateInvalid && !isLoadingDateAfterDelivery
                }"
                v-model="formData.loadingDate"
                :title="`Rango sugerido: ${suggestedDateRange.min} a ${suggestedDateRange.max}`"
              />
              <p v-if="isLoadingDateInvalid" class="text-red-600 text-xs mt-1 font-medium">
                ⚠️ La fecha de carga no puede ser anterior a la fecha de fabricación
              </p>
              <p v-if="isLoadingDateAfterDelivery && !isLoadingDateInvalid" class="text-red-600 text-xs mt-1 font-medium">
                ⚠️ No puede ser posterior a la entrega
              </p>
              <p v-if="!isLoadingDateInvalid && !isLoadingDateAfterDelivery" class="text-green-600 text-xs mt-1">
                💡 Rango sugerido: <strong>{{ formatDate(suggestedDateRange.min) }}</strong> a <strong>{{ formatDate(suggestedDateRange.max) }}</strong>
              </p>
            </div>
          </template>
        </div>

        <div class="p-4 border-t bg-gray-50 space-y-2">
          <!-- Botones de copiar/pegar -->
          <div class="flex gap-2 pb-2 border-b">
            <button
              @click="handleCopy"
              class="flex-1 px-3 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Copy size="16" /> Copiar
            </button>
            <button
              @click="handlePaste"
              class="flex-1 px-3 py-2 text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 flex items-center justify-center gap-2 transition-colors"
              :disabled="!hasClipboard"
              :class="{ 'opacity-50 cursor-not-allowed': !hasClipboard }"
            >
              <Clipboard size="16" /> Pegar
            </button>
          </div>

          <!-- Botones principales -->
          <div class="flex justify-between gap-2">
            <button
              v-if="data && data.id"
              @click="confirmDelete"
              class="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size="18" /> Borrar
            </button>
            <div class="flex gap-2 ml-auto">
              <button @click="$emit('close')" class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
              <button
                @click="handleSubmit"
                :disabled="!!validationError"
                :class="[
                  'px-6 py-2 rounded font-medium shadow flex items-center gap-2 transition-colors',
                  validationError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                <Save size="18" /> Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Calendar, Truck, Factory, Clock, Save, X, Trash2, Copy, Clipboard } from 'lucide-vue-next'
import { formatDate, getDayOfWeek } from '@/utils/date'
import { useDataStore } from '@/stores/data'

const props = defineProps({
  isOpen: Boolean,
  data: Object,
  clientName: String,
  dateStr: String,
  plataforma: Object,
  hasClipboard: Boolean
})

const emit = defineEmits(['close', 'save', 'copy', 'paste'])

const dataStore = useDataStore()

// Computed: Obtener empresas de transporte únicas desde el store
const availableTransportCompanies = computed(() => {
  return dataStore.empresasTransporte
})

const formData = ref({
  delivers: true,
  receptionDate: '',
  receptionTime: '',
  manufacturingDate: '',
  manufacturingNotes: '',
  loadingDate: '',
  transportCompany: '',
  transportComments: ''
})

watch(() => [props.data, props.plataforma], ([newData, plataforma]) => {
  if (newData) {
    // Mapear campos de Supabase (español) a formData (inglés)
    formData.value = {
      delivers: newData.entrega ?? true,
      receptionDate: newData.fecha_recepcion || '',
      receptionTime: newData.hora_recepcion || '',
      manufacturingDate: newData.fecha_fabricacion || '',
      manufacturingNotes: newData.notas_fabricacion || '',
      loadingDate: newData.fecha_carga || '',
      transportCompany: newData.empresa_transporte || '',
      transportComments: newData.comentarios_transporte || ''
    }
  } else {
    // Valores por defecto para nuevo registro
    // Pre-seleccionar la empresa de transporte de la plataforma
    const defaultTransportCompany = plataforma?.empresa_transporte || ''

    formData.value = {
      delivers: true,
      receptionDate: '',
      receptionTime: '',
      manufacturingDate: '',
      manufacturingNotes: '',
      loadingDate: '',
      transportCompany: defaultTransportCompany,
      transportComments: ''
    }
  }
}, { immediate: true })

// Validación: fecha de carga no puede ser anterior a fecha de fabricación
const isLoadingDateInvalid = computed(() => {
  if (!formData.value.delivers) return false
  if (!formData.value.manufacturingDate || !formData.value.loadingDate) return false

  return new Date(formData.value.loadingDate) < new Date(formData.value.manufacturingDate)
})

// Validación: fechas no pueden ser posteriores a la fecha de entrega planificada
const areDatesAfterDelivery = computed(() => {
  if (!formData.value.delivers) return { invalid: false, fields: [] }

  const deliveryDate = new Date(props.dateStr)
  const invalidFields = []

  // Validar fecha de recepción
  if (formData.value.receptionDate && new Date(formData.value.receptionDate) > deliveryDate) {
    invalidFields.push('recepción')
  }

  // Validar fecha de fabricación
  if (formData.value.manufacturingDate && new Date(formData.value.manufacturingDate) > deliveryDate) {
    invalidFields.push('fabricación')
  }

  // Validar fecha de carga
  if (formData.value.loadingDate && new Date(formData.value.loadingDate) > deliveryDate) {
    invalidFields.push('carga')
  }

  return {
    invalid: invalidFields.length > 0,
    fields: invalidFields
  }
})

// Validaciones individuales para cada campo
const isReceptionDateInvalid = computed(() => {
  if (!formData.value.delivers || !formData.value.receptionDate) return false
  return new Date(formData.value.receptionDate) > new Date(props.dateStr)
})

const isManufacturingDateInvalid = computed(() => {
  if (!formData.value.delivers || !formData.value.manufacturingDate) return false
  return new Date(formData.value.manufacturingDate) > new Date(props.dateStr)
})

const isLoadingDateAfterDelivery = computed(() => {
  if (!formData.value.delivers || !formData.value.loadingDate) return false
  return new Date(formData.value.loadingDate) > new Date(props.dateStr)
})

const validationError = computed(() => {
  if (isLoadingDateInvalid.value) {
    return 'La fecha de carga no puede ser anterior a la fecha de fabricación'
  }

  if (areDatesAfterDelivery.value.invalid) {
    const fields = areDatesAfterDelivery.value.fields.join(', ')
    return `La fecha de ${fields} no puede ser posterior a la fecha de entrega (${formatDate(props.dateStr)})`
  }

  return null
})

const handleSubmit = () => {
  // Validar antes de guardar
  if (validationError.value) {
    alert(validationError.value)
    return
  }

  emit('save', formData.value)
}

const handleCopy = () => {
  emit('copy', formData.value)
}

const handlePaste = () => {
  emit('paste')
}

const confirmDelete = () => {
  if (confirm('¿Borrar esta entrada de planificación?')) {
    emit('save', { ...formData.value, delete: true })
  }
}

// Calcular rango de fechas sugerido (7 días antes de la entrega)
const suggestedDateRange = computed(() => {
  const deliveryDate = new Date(props.dateStr)
  const minDate = new Date(deliveryDate)
  minDate.setDate(minDate.getDate() - 7)

  return {
    min: minDate.toISOString().split('T')[0],
    max: props.dateStr
  }
})

// Determinar si cada fecha está en el rango sugerido
const isReceptionDateInRange = computed(() => {
  if (!formData.value.receptionDate) return false
  const date = new Date(formData.value.receptionDate)
  const minDate = new Date(suggestedDateRange.value.min)
  const maxDate = new Date(suggestedDateRange.value.max)
  return date >= minDate && date <= maxDate
})

const isManufacturingDateInRange = computed(() => {
  if (!formData.value.manufacturingDate) return false
  const date = new Date(formData.value.manufacturingDate)
  const minDate = new Date(suggestedDateRange.value.min)
  const maxDate = new Date(suggestedDateRange.value.max)
  return date >= minDate && date <= maxDate
})

const isLoadingDateInRange = computed(() => {
  if (!formData.value.loadingDate) return false
  const date = new Date(formData.value.loadingDate)
  const minDate = new Date(suggestedDateRange.value.min)
  const maxDate = new Date(suggestedDateRange.value.max)
  return date >= minDate && date <= maxDate
})
</script>

<style scoped>
/* Estilo para inputs de fecha con indicador visual del rango sugerido */
input[type="date"] {
  position: relative;
}

/* Añadir un indicador visual sutil para el rango recomendado */
input[type="date"].planning-date {
  background: linear-gradient(to right, #f0fdf4 0%, #f0fdf4 100%);
  border-left: 3px solid #86efac;
}

input[type="date"].planning-date:focus {
  outline: 2px solid #4ade80;
  outline-offset: 2px;
}

/* Estilo cuando está en el rango válido */
input[type="date"].in-range {
  background: linear-gradient(to right, #dcfce7 0%, #f0fdf4 100%);
}

/* Estilo cuando está fuera del rango sugerido pero válido */
input[type="date"].out-of-range {
  background: #fef3c7;
  border-left: 3px solid #fbbf24;
}
</style>