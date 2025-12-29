<template>
  <div class="flex items-center gap-2">
    <label class="text-sm font-medium text-gray-600">Plan:</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value ? parseInt($event.target.value) : null)"
      class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
      :class="{ 'border-red-400 bg-red-50': !modelValue }"
    >
      <option :value="null">Selecciona o crea un plan</option>
      <option v-for="plan in planes" :key="plan.id" :value="plan.id">
        {{ plan.nombre }} ({{ formatDate(plan.fecha_inicio) }} - {{ formatDate(plan.fecha_fin) }})
      </option>
    </select>
    <button
      @click="showCreateModal = true"
      class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
      title="Crear nuevo plan"
    >
      + Nuevo Plan
    </button>

    <!-- Modal para crear nuevo plan -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Crear Nuevo Plan Festivo</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
            <input
              v-model="newPlan.nombre"
              type="text"
              placeholder="ej: Puente Navidad 2024"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                v-model="newPlan.fecha_inicio"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                v-model="newPlan.fecha_fin"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showCreateModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="createPlan"
            :disabled="!canCreate"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Crear Plan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  modelValue: Number,
  planes: Array
})

const emit = defineEmits(['update:modelValue'])

const dataStore = useDataStore()
const showCreateModal = ref(false)
const newPlan = ref({
  nombre: '',
  fecha_inicio: '',
  fecha_fin: ''
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const canCreate = computed(() => {
  return newPlan.value.nombre.trim() !== '' &&
    newPlan.value.fecha_inicio !== '' &&
    newPlan.value.fecha_fin !== '' &&
    new Date(newPlan.value.fecha_inicio) <= new Date(newPlan.value.fecha_fin)
})

const createPlan = async () => {
  if (!canCreate.value) return

  try {
    const { data, error } = await supabase
      .from('planes_festivos')
      .insert([{
        nombre: newPlan.value.nombre.trim(),
        fecha_inicio: newPlan.value.fecha_inicio,
        fecha_fin: newPlan.value.fecha_fin
      }])
      .select()

    if (error) {
      console.error('Error creando plan:', error)
      alert('Error al crear el plan: ' + error.message)
      return
    }

    // Recargar planes
    await dataStore.loadPlanesFestivos()

    // Seleccionar el plan recién creado
    if (data && data.length > 0) {
      emit('update:modelValue', data[0].id)
    }

    // Cerrar modal y limpiar formulario
    showCreateModal.value = false
    newPlan.value = {
      nombre: '',
      fecha_inicio: '',
      fecha_fin: ''
    }
  } catch (e) {
    console.error('Error creando plan:', e)
    alert('Error al crear el plan: ' + e.message)
  }
}
</script>
