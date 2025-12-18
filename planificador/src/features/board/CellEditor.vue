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
                <input
                  type="date"
                  class="border p-2 rounded text-sm w-full"
                  v-model="formData.receptionDate"
                />
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
                  <option value="Innova">Innova</option>
                  <option value="Primafrío">Primafrío</option>
                  <option value="Disfrimur">Disfrimur</option>
                  <option value="Otros">Otros</option>
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
                    class="border p-2 rounded text-sm w-full"
                    v-model="formData.manufacturingDate"
                  />
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
                class="border p-2 rounded text-sm w-full"
                v-model="formData.loadingDate"
              />
            </div>
          </template>
        </div>

        <div class="p-4 border-t flex justify-between gap-2 bg-gray-50">
          <button
            v-if="data && data.id"
            @click="confirmDelete"
            class="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size="18" /> Borrar
          </button>
          <div class="flex gap-2">
            <button @click="$emit('close')" class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
            <button @click="handleSubmit" class="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow hover:bg-blue-700 flex items-center gap-2">
              <Save size="18" /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Calendar, Truck, Factory, Clock, Save, X, Trash2 } from 'lucide-vue-next'
import { formatDate, getDayOfWeek } from '@/utils/date'

const props = defineProps({
  isOpen: Boolean,
  data: Object,
  clientName: String,
  dateStr: String
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  delivers: true,
  receptionDate: props.dateStr,
  receptionTime: '',
  manufacturingDate: '',
  manufacturingNotes: '',
  loadingDate: '',
  transportCompany: '',
  transportComments: '',
  ...props.data
})

watch(() => props.data, (newData) => {
  formData.value = {
    delivers: true,
    receptionDate: props.dateStr,
    receptionTime: '',
    manufacturingDate: '',
    manufacturingNotes: '',
    loadingDate: '',
    transportCompany: '',
    transportComments: '',
    ...newData
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('save', formData.value)
}

const confirmDelete = () => {
  if (confirm('¿Borrar esta entrada de planificación?')) {
    emit('save', { ...formData.value, delete: true })
  }
}
</script>